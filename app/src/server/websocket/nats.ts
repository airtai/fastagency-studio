import { connect, consumerOpts, JSONCodec } from 'nats';
import { updateDB } from './webSocket';

const NATS_URL = process.env['NATS_URL'];
console.log(`NATS_URL=${NATS_URL}`);

export async function connectToNatsServer(
  socket: any,
  context: any,
  currentChatDetails: any,
  selectedTeamUUID: string,
  message: string,
  conversationId: number,
  shouldCallInitiateChat: boolean
) {
  try {
    let socketConversationHistory = '';
    let lastSocketMessage = null;

    if (!NATS_URL) {
      throw new Error('NATS_URL is not defined');
    }
    const nc = await connect({ servers: NATS_URL });
    console.log(`connected to ${nc.getServer()}`);

    const js = nc.jetstream();
    const jc = JSONCodec();
    const threadId = currentChatDetails.uuid;

    const initiateChatSubject = `chat.server.initiate_chat`;
    const clientPrintSubject = `chat.client.print.${threadId}`;
    const clientInputSubject = `chat.client.input.${threadId}`;
    const serverInputSubject = `chat.server.input.${threadId}`;

    if (shouldCallInitiateChat) {
      await js.publish(
        initiateChatSubject,
        jc.encode({
          thread_id: threadId,
          team_id: selectedTeamUUID,
          msg: message,
        })
      );
    } else {
      await js.publish(serverInputSubject, jc.encode({ msg: message }));
    }

    // Subscribe to messages
    const opts = consumerOpts();
    opts.orderedConsumer();

    const clientPrintSub = await js.subscribe(clientPrintSubject, opts);
    (async () => {
      for await (const m of clientPrintSub) {
        const jm: any = jc.decode(m.data);
        // add the message to the global variable and send it back to the client
        lastSocketMessage = jm.msg;
        socketConversationHistory = socketConversationHistory + lastSocketMessage;
        socket.emit('newMessageFromTeam', socketConversationHistory);
      }
    })().catch((err) => {
      console.error(`Error: ${err}`);
    });

    const clientInputSub = await js.subscribe(clientInputSubject, opts);
    (async () => {
      let message;
      let isExceptionOccured = false;
      for await (const m of clientInputSub) {
        const jm: any = jc.decode(m.data);
        message = jm.prompt;
        await updateDB(
          context,
          currentChatDetails.id,
          message,
          conversationId,
          socketConversationHistory,
          isExceptionOccured
        );
        socket.emit('streamFromTeamFinished');
      }
    })().catch((err) => {
      console.error(`Error: ${err}`);
    });
  } catch (err: any) {
    console.error(`Error: ${err}`);
    if (err.code) {
      console.error(`Error code: ${err.code}`);
    }
    if (err.chainedError) {
      console.error(`Chained error: ${err.chainedError}`);
    }
  }
}
