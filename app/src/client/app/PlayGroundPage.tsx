import { useState, useEffect } from 'react';
import _ from 'lodash';
import { useSocket, useSocketListener } from 'wasp/client/webSocket';
import { type User } from 'wasp/entities';

import { updateCurrentChat, useQuery, getChat, getChatFromUUID, getConversations } from 'wasp/client/operations';

import { useHistory, useLocation } from 'react-router-dom';

import CustomAuthRequiredLayout from './layout/CustomAuthRequiredLayout';
import ChatLayout from './layout/ChatLayout';
import ConversationsList from '../components/ConversationList';

import {
  updateCurrentChatStatus,
  getInProgressConversation,
  getFormattedChatMessages,
  handleDailyAnalysisChat,
  callOpenAiAgent,
  handleChatError,
} from '../utils/chatUtils';
import SelectTeamToChat from '../components/SelectTeamToChat';

const PlayGroundPage = ({ user }: { user: User }) => {
  const [refetchAllChatDetails, setRefetchAllChatDetails] = useState(false);
  const { socket } = useSocket();
  const location = useLocation();
  const { pathname } = location;
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);

  const uuidFromURL = pathname.split('/').pop();
  const activeChatUUId = uuidFromURL === 'chat' ? null : uuidFromURL;
  const { data: activeChat } = useQuery(getChatFromUUID, {
    chatUUID: activeChatUUId,
  });
  const activeChatId = Number(activeChat?.id);
  const { data: currentChatDetails, refetch: refetchChat }: { data: any; refetch: any } = useQuery(
    getChat,
    { chatId: activeChatId },
    { enabled: !!activeChatId }
  );
  const { data: conversations, refetch: refetchConversation } = useQuery(
    getConversations,
    { chatId: activeChatId },
    { enabled: !!activeChatId }
  );

  useEffect(() => {
    if (currentChatDetails && currentChatDetails.chatType === 'daily_analysis') {
      updateCurrentChat({
        id: activeChatId,
        data: {
          shouldShowChat: true,
        },
      });
    }
  }, [activeChatUUId, currentChatDetails]);

  useSocketListener('smartSuggestionsAddedToDB', updateState);
  useSocketListener('streamFromTeamFinished', updateState);

  function updateState() {
    refetchConversation();
    refetchChat();
  }

  // Function to remove query parameters
  const removeQueryParameters = () => {
    history.push({
      search: '', // This removes all query parameters
    });
  };

  const refetchChatDetails = () => {
    setRefetchAllChatDetails(!refetchAllChatDetails);
  };

  const handleFormSubmit = async (
    userQuery: string,
    isUserRespondedWithNextAction: boolean = false,
    retrySameChat: boolean = false
  ) => {
    if (currentChatDetails.userId !== user.id) {
      window.alert('Error: This chat does not belong to you.');
    } else {
      let inProgressConversation;
      try {
        await updateCurrentChatStatus(activeChatId, isUserRespondedWithNextAction, removeQueryParameters);
        const messages: any = await getFormattedChatMessages(activeChatId, userQuery, retrySameChat);
        inProgressConversation = await getInProgressConversation(activeChatId, userQuery, retrySameChat);
        // if the chat has customerBrief already then directly send required detalils in socket event
        if (currentChatDetails.customerBrief || currentChatDetails.chatType === 'daily_analysis') {
          await handleDailyAnalysisChat(
            socket,
            currentChatDetails,
            inProgressConversation,
            userQuery,
            messages,
            activeChatId
          );
        } else {
          await callOpenAiAgent(
            activeChatId,
            currentChatDetails,
            inProgressConversation,
            socket,
            messages,
            refetchChatDetails
          );
        }
      } catch (err: any) {
        await handleChatError(err, activeChatId, inProgressConversation, history);
      }
    }
  };

  const onStreamAnimationComplete = () => {
    updateCurrentChat({
      id: activeChatId,
      data: {
        streamAgentResponse: false,
      },
    });
  };

  let triggerChatFormSubmitMsg = queryParams.get('msg');
  if (triggerChatFormSubmitMsg && currentChatDetails?.userRespondedWithNextAction) {
    triggerChatFormSubmitMsg = null;
  }

  const userSelectedAction: any = queryParams.get('selected_user_action');
  let userSelectedActionMessage: string | null = null;

  if (userSelectedAction) {
    if (!currentChatDetails?.userRespondedWithNextAction) {
      if (currentChatDetails?.proposedUserAction) {
        userSelectedActionMessage = currentChatDetails.proposedUserAction[Number(userSelectedAction) - 1];
      }
    }
  }
  return (
    <ChatLayout
      handleFormSubmit={handleFormSubmit}
      currentChatDetails={currentChatDetails}
      triggerChatFormSubmitMsg={triggerChatFormSubmitMsg}
      refetchAllChatDetails={refetchAllChatDetails}
    >
      <div className='flex h-full flex-col'>
        {currentChatDetails ? (
          <div className='flex-1 overflow-hidden'>
            {conversations && conversations.length > 0 ? (
              <ConversationsList
                conversations={conversations}
                currentChatDetails={currentChatDetails}
                handleFormSubmit={handleFormSubmit}
                userSelectedActionMessage={userSelectedActionMessage}
                onStreamAnimationComplete={onStreamAnimationComplete}
              />
            ) : (
              <SelectTeamToChat />
            )}
          </div>
        ) : (
          <SelectTeamToChat />
        )}
      </div>
    </ChatLayout>
  );
};

const PlayGroundPageWithCustomAuth = CustomAuthRequiredLayout(PlayGroundPage);
export default PlayGroundPageWithCustomAuth;
