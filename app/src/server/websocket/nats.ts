import { connect, consumerOpts, JSONCodec, Subscription, JetStreamClient } from 'nats';
import { updateDB } from './webSocket';

function generateNatsUrl(natsUrl: string | undefined, fastAgencyServerUrl: string | undefined): string | undefined {
  if (natsUrl) return natsUrl;
  return fastAgencyServerUrl ? `${fastAgencyServerUrl.replace('https://', 'tls://')}:4222` : fastAgencyServerUrl;
}

const NATS_URL = generateNatsUrl(process.env['NATS_URL'], process.env['FASTAGENCY_SERVER_URL']);
console.log(`NATS_URL=${NATS_URL}`);

class NatsConnectionManager {
  public static connections: Map<
    string,
    {
      nc: any;
      subscriptions: Map<string, Subscription>;
      socketConversationHistory: string;
      lastSocketMessage: string | null;
    }
  > = new Map();

  static async getConnection(threadId: string) {
    if (!this.connections.has(threadId)) {
      const nc = await connect({ servers: NATS_URL });
      this.connections.set(threadId, {
        nc,
        subscriptions: new Map(),
        socketConversationHistory: '',
        lastSocketMessage: null,
      });
      console.log(`Connected to ${nc.getServer()} for threadId ${threadId}`);
    }
    return this.connections.get(threadId);
  }

  static async cleanup(threadId: string) {
    const connection = this.connections.get(threadId);
    if (connection) {
      for (const sub of connection.subscriptions.values()) {
        await sub.unsubscribe();
      }
      await connection.nc.close();
      this.connections.delete(threadId);
      console.log(`Cleaned up NATS connection and subscriptions for threadId ${threadId}`);
    }
  }

  static addSubscription(threadId: string, subject: string, sub: Subscription) {
    const connection = this.connections.get(threadId);
    if (connection) {
      const existingSub = connection.subscriptions.get(subject);
      if (existingSub) {
        existingSub.unsubscribe();
      }
      connection.subscriptions.set(subject, sub);
    }
  }

  static updateMessageHistory(threadId: string, message: string) {
    const connection = this.connections.get(threadId);
    if (connection) {
      connection.lastSocketMessage = message;
      connection.socketConversationHistory += message;
    }
  }

  static getLastSocketMessage(threadId: string): string | null | undefined {
    return this.connections.get(threadId)?.lastSocketMessage;
  }

  static getConversationHistory(threadId: string): string {
    return this.connections.get(threadId)?.socketConversationHistory || '';
  }

  static clearConversationHistory(threadId: string) {
    const connection = this.connections.get(threadId);
    if (connection) {
      connection.socketConversationHistory = '';
    }
  }
}

export async function sendMsgToNatsServer(
  socket: any,
  context: any,
  currentChatDetails: any,
  selectedTeamUUID: string,
  message: string,
  conversationId: number,
  shouldCallInitiateChat: boolean
) {
  try {
    const threadId = currentChatDetails.uuid;
    const { nc } = (await NatsConnectionManager.getConnection(threadId)) as { nc: any };
    const js = nc.jetstream();
    const jc = JSONCodec();

    // Initiate chat or continue conversation
    const initiateChatSubject = `chat.server.initiate_chat`;
    const serverInputSubject = `chat.server.input.${threadId}`;
    const subject = shouldCallInitiateChat ? initiateChatSubject : serverInputSubject;

    NatsConnectionManager.clearConversationHistory(threadId);
    await js.publish(subject, jc.encode({ thread_id: threadId, team_id: selectedTeamUUID, msg: message }));

    // Subscribe logic
    const clientPrintSubject = `chat.client.print.${threadId}`;
    const clientInputSubject = `chat.client.input.${threadId}`;
    await setupSubscription(js, jc, clientPrintSubject, threadId, socket);
    await setupSubscription(
      js,
      jc,
      clientInputSubject,
      threadId,
      socket,
      true,
      context,
      currentChatDetails,
      conversationId
    );
  } catch (err) {
    console.error(`Error in connectToNatsServer: ${err}`);
  }
}

async function setupSubscription(
  js: JetStreamClient,
  jc: any,
  subject: string,
  threadId: string,
  socket: any,
  isInput: boolean = false,
  context?: any,
  currentChatDetails?: any,
  conversationId?: number
) {
  const opts = consumerOpts();
  opts.orderedConsumer();
  const sub = await js.subscribe(subject, opts);
  NatsConnectionManager.addSubscription(threadId, subject, sub as Subscription);
  (async () => {
    for await (const m of sub) {
      const jm = jc.decode(m.data);
      const message = jm.msg || jm.prompt;
      const conversationHistory = NatsConnectionManager.getConversationHistory(threadId);
      if (isInput) {
        try {
          await updateDB(context, currentChatDetails.id, message, conversationId, conversationHistory, false);
          socket.emit('streamFromTeamFinished');
        } catch (err) {
          console.error(`DB Update failed: ${err}`);
        }
      } else {
        NatsConnectionManager.updateMessageHistory(threadId, message);
        socket.emit('newMessageFromTeam', conversationHistory);
      }
    }
  })().catch((err) => {
    console.error(`Error in subscription for ${subject}: ${err}`);
  });
}
