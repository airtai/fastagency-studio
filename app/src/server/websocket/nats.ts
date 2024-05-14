import { connect, consumerOpts, JSONCodec } from 'nats';
import { updateDB } from './webSocket';

const NATS_URL = process.env['NATS_URL'];
console.log(`NATS_URL=${NATS_URL}`);

export async function connectToNatsServer(
  socket: any,
  context: any,
  uniqueName: string,
  currentChatDetails: any,
  conversationId: number
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
    const clientId = uniqueName;

    const registerSubject = `register.${clientId}`;
    const pingSubject = `ping.${clientId}`;
    const pongSubject = `pong.${clientId}`;
    const terminateSubject = `terminate.${clientId}`;

    // Subscribe to messages
    const opts = consumerOpts();
    opts.orderedConsumer();
    const sub = await js.subscribe(pongSubject, opts);

    (async () => {
      for await (const m of sub) {
        const jm: any = jc.decode(m.data);
        // add the message to the global variable and send it back to the client
        console.log(`Received message: ${JSON.stringify(jm)}`);
        lastSocketMessage = jm.msg;
        socketConversationHistory = socketConversationHistory + lastSocketMessage;
        socket.emit('newMessageFromTeam', socketConversationHistory);
      }
    })().catch((err) => {
      console.error(`Error: ${err}`);
    });

    const terminateSub = await js.subscribe(terminateSubject, opts);
    (async () => {
      let message;
      let isExceptionOccured = false;
      for await (const m of terminateSub) {
        const jm: any = jc.decode(m.data);
        console.log(`Received message: ${JSON.stringify(jm)}`);
        message = jm.msg;
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

    await js.publish(registerSubject, jc.encode({ client_id: clientId }));
    await js.publish(pingSubject, jc.encode({ msg: 'ping' }));
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
