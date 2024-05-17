import { sendMsgToNatsServer } from './nats';

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

export async function updateDB(context, chatId, message, conversationId, socketConversationHistory, isChatTerminated) {
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

  // const smart_suggestions = isExceptionOccured
  //   ? {
  //       suggestions: ["Let's try again"],
  //       type: 'oneOf',
  //     }
  //   : obj.smart_suggestions;

  await context.entities.Chat.update({
    where: {
      id: chatId,
    },
    data: {
      team_status: 'completed',
      // smartSuggestions: smart_suggestions,
      isChatTerminated: isChatTerminated,
    },
  });
}

export const socketFn = (io, context) => {
  // When a new user is connected
  io.on('connection', async (socket) => {
    if (socket.data.user) {
      const userEmail = socket.data.user.email;
      const userUUID = socket.data.user.uuid;
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
        async (currentChatDetails, selectedTeamUUID, allMessagesOrUserQuery, conversationId) => {
          let message = '';
          let shouldCallInitiateChat = true;
          if (typeof allMessagesOrUserQuery === 'string') {
            message = allMessagesOrUserQuery;
            shouldCallInitiateChat = false;
          } else {
            message = allMessagesOrUserQuery[0].content;
          }
          sendMsgToNatsServer(
            socket,
            context,
            currentChatDetails,
            selectedTeamUUID,
            userUUID,
            message,
            conversationId,
            shouldCallInitiateChat
          );
        }
      );
    }
  });
};
