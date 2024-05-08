import WebSocket from 'ws';
import { FASTAGENCY_SERVER_URL } from '../common/constants';

const isLocal = FASTAGENCY_SERVER_URL === 'http://127.0.0.1:9000';
const protocol = isLocal ? 'ws' : 'wss';
const port = isLocal ? '8080' : '9090';
const WS_URL = `${protocol}://${FASTAGENCY_SERVER_URL.split('//')[1].split(':')[0]}:${port}`;

async function getChat(chatId, context) {
  return await context.entities.Chat.findFirst({
    where: {
      id: chatId,
    },
    select: {
      id: true,
      smartSuggestions: true,
    },
  });
}

async function updateDB(context, chatId, message, conversationId, socketConversationHistory, isExceptionOccured) {
  let obj = {};
  try {
    const jsonString = message.replace(/True/g, true).replace(/False/g, false);
    obj = JSON.parse(jsonString);
  } catch (error) {
    obj = { message: message, smart_suggestions: [] };
  }
  await context.entities.Conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      isLoading: false,
      message: obj.message,
      agentConversationHistory: socketConversationHistory,
    },
  });

  const smart_suggestions = isExceptionOccured
    ? {
        suggestions: ["Let's try again"],
        type: 'oneOf',
      }
    : obj.smart_suggestions;

  await context.entities.Chat.update({
    where: {
      id: chatId,
    },
    data: {
      team_status: 'completed',
      smartSuggestions: smart_suggestions,
      isExceptionOccured: isExceptionOccured,
    },
  });
}

function wsConnection(socket, context, currentChatDetails, conversationId, lastMessage, allMessages, team_name) {
  const ws = new WebSocket(WS_URL);
  const googleAdsTeamName = team_name ? team_name : currentChatDetails.team_name;
  const data = {
    conv_id: currentChatDetails.id,
    user_id: currentChatDetails.userId,
    message: lastMessage,
    agent_chat_history: currentChatDetails.agentChatHistory,
    all_messages: allMessages,
    is_continue_daily_analysis: currentChatDetails.chatType === 'daily_analysis' && !!currentChatDetails.team_status,
    google_ads_team: googleAdsTeamName.replace(`_${currentChatDetails.userId}_${currentChatDetails.id}`, ''),
  };
  let socketConversationHistory = '';
  let lastSocketMessage = null;
  ws.onopen = () => {
    ws.send(JSON.stringify(data));
  };
  ws.onmessage = function (event) {
    socketConversationHistory = socketConversationHistory + event.data;
    lastSocketMessage = event.data;
    socket.emit('newMessageFromTeam', socketConversationHistory);
  };
  ws.onerror = function (event) {
    console.error('WebSocket error observed: ', event);
  };
  ws.onclose = async function (event) {
    let message;
    let isExceptionOccured = false;
    if (event.code === 1000) {
      message = lastSocketMessage;
    } else {
      isExceptionOccured = true;
      message =
        "Ahoy, mate! It seems our voyage hit an unexpected squall. Let's trim the sails and set a new course. Cast off once more by clicking the button below.";
      console.log('WebSocket is closed with the event code:', event.code);
    }
    await updateDB(
      context,
      currentChatDetails.id,
      message,
      conversationId,
      socketConversationHistory,
      isExceptionOccured
    );
    socket.emit('streamFromTeamFinished');
  };
}

export const socketFn = (io, context) => {
  // When a new user is connected
  io.on('connection', async (socket) => {
    if (socket.data.user) {
      const userEmail = socket.data.user.email;
      console.log('========');
      console.log('a user connected: ', userEmail);

      socket.on('checkSmartSuggestionStatus', async (chatId) => {
        let isSmartSuggestionEmpty = true;
        for (let i = 0; i < 10; i++) {
          const chat = await getChat(chatId, context);
          const { suggestions } = chat.smartSuggestions;
          isSmartSuggestionEmpty = suggestions.length === 1 && suggestions[0] === '';

          if (isSmartSuggestionEmpty) {
            // If smart suggestions are still empty, wait for 1 second and check again
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            socket.emit('smartSuggestionsAddedToDB', chatId);
            break;
          }
        }
      });

      socket.on(
        'sendMessageToTeam',
        async (currentChatDetails, conversationId, lastMessage, allMessages, team_name) => {
          wsConnection(socket, context, currentChatDetails, conversationId, lastMessage, allMessages, team_name);
        }
      );
    }
  });
};
