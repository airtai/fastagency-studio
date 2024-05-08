import {
  updateCurrentChat,
  updateCurrentConversation,
  createNewAndReturnAllConversations,
  createNewAndReturnLastConversation,
  getAgentResponse,
  deleteLastConversationInChat,
} from 'wasp/client/operations';

import { type Conversation, type Chat } from 'wasp/entities';

export const exceptionMessage =
  "Ahoy, mate! It seems our voyage hit an unexpected squall. Let's trim the sails and set a new course. Cast off once more by clicking the button below.";

type OutputMessage = {
  role: string;
  content: string;
};

export function prepareOpenAIRequest(input: Conversation[]): OutputMessage[] {
  const messages: OutputMessage[] = input.map((message) => {
    return {
      role: message.role,
      content: message.message,
    };
  });
  return messages;
}

export async function updateCurrentChatStatus(
  activeChatId: number,
  isUserRespondedWithNextAction: boolean,
  removeQueryParameters: Function
) {
  isUserRespondedWithNextAction && removeQueryParameters();
  await updateCurrentChat({
    id: activeChatId,
    data: {
      smartSuggestions: { suggestions: [''], type: '' },
      userRespondedWithNextAction: isUserRespondedWithNextAction,
    },
  });
}

export async function getFormattedChatMessages(
  activeChatId: number,
  userQuery: string,
  retrySameChat: boolean
) {
  let allConversations;
  if (retrySameChat) {
    allConversations = await deleteLastConversationInChat(activeChatId);
  } else {
    allConversations = await createNewAndReturnAllConversations({
      chatId: activeChatId,
      userQuery,
      role: 'user',
    });
  }
  const messages: any = prepareOpenAIRequest(allConversations);
  await updateCurrentChat({
    id: activeChatId,
    data: {
      showLoader: true,
    },
  });
  return messages;
}

export async function getInProgressConversation(
  activeChatId: number,
  userQuery: string,
  retrySameChat: boolean
) {
  const message = retrySameChat ? '' : userQuery;
  const inProgressConversation = await createNewAndReturnLastConversation({
    chatId: activeChatId,
    userQuery: message,
    role: 'assistant',
    isLoading: true,
  });
  return inProgressConversation;
}

export const handleDailyAnalysisChat = async (
  socket: any,
  currentChatDetails: any,
  inProgressConversation: any,
  userQuery: string,
  messages: any,
  activeChatId: number
) => {
  const teamName =
    currentChatDetails.chatType === 'daily_analysis'
      ? `default_team_${currentChatDetails.userId}_${currentChatDetails.id}`
      : currentChatDetails.team_name;
  socket.emit(
    'sendMessageToTeam',
    currentChatDetails,
    inProgressConversation.id,
    userQuery,
    messages,
    teamName
  );
  await updateCurrentChat({
    id: activeChatId,
    data: {
      showLoader: false,
      team_status: 'inprogress',
    },
  });
};

export const callOpenAiAgent = async (
  activeChatId: number,
  currentChatDetails: any,
  inProgressConversation: any,
  socket: any,
  messages: any,
  refetchChatDetails: () => void
) => {
  const response = await getAgentResponse({
    chatId: activeChatId,
    messages: messages,
  });
  await handleAgentResponse(
    response,
    currentChatDetails,
    inProgressConversation,
    socket,
    messages,
    activeChatId,
    refetchChatDetails
  );
};

export const handleAgentResponse = async (
  response: any,
  currentChatDetails: any,
  inProgressConversation: any,
  socket: any,
  messages: any,
  activeChatId: number,
  refetchChatDetails: () => void
) => {
  if (!!response.customer_brief) {
    socket.emit(
      'sendMessageToTeam',
      currentChatDetails,
      inProgressConversation.id,
      response.customer_brief,
      messages,
      response['team_name']
    );
  }
  // Emit an event to check the smartSuggestion status
  if (response['content'] && !response['is_exception_occured']) {
    socket.emit('checkSmartSuggestionStatus', activeChatId);
    await updateCurrentChat({
      id: activeChatId,
      data: {
        streamAgentResponse: true,
        showLoader: false,
        smartSuggestions: response['smart_suggestions'],
      },
    });
  }

  response['content'] &&
    (await updateCurrentConversation({
      id: inProgressConversation.id,
      data: {
        isLoading: false,
        message: response['content'],
      },
    }));

  const chatName = currentChatDetails.isChatNameUpdated
    ? null
    : response['conversation_name']
      ? response['conversation_name']
      : null;

  await updateCurrentChat({
    id: activeChatId,
    data: {
      showLoader: false,
      team_id: response['team_id'],
      team_name: response['team_name'],
      team_status: response['team_status'],
      smartSuggestions: response['smart_suggestions'],
      isExceptionOccured: response['is_exception_occured'] || false,
      customerBrief: response['customer_brief'],
      ...(chatName && {
        name: chatName,
        isChatNameUpdated: true,
      }),
    },
  });

  chatName && refetchChatDetails();
};

export const handleChatError = async (
  err: any,
  activeChatId: number,
  inProgressConversation: any,
  history: any
) => {
  await updateCurrentChat({
    id: activeChatId,
    data: { showLoader: false },
  });
  console.log('Error: ' + err.message);
  if (err.message === 'No Subscription Found') {
    history.push('/pricing');
  } else {
    await updateCurrentConversation({
      //@ts-ignore
      id: inProgressConversation.id,
      data: {
        isLoading: false,
        message: exceptionMessage,
      },
    });
    await updateCurrentChat({
      id: activeChatId,
      data: {
        showLoader: false,
        smartSuggestions: {
          suggestions: ["Let's try again"],
          type: 'oneOf',
        },
        isExceptionOccured: true,
      },
    });
  }
};

export const shouldRenderChat = (chat: Chat): boolean => {
  return chat.chatType !== 'daily_analysis' || chat.shouldShowChat;
};
