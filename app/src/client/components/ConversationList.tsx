import { useSocketListener } from 'wasp/client/webSocket';
import { type Conversation, type Chat } from 'wasp/entities';

import React from 'react';
import { useState, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
// import createNewAndReturnAllConversations from '@wasp/actions/createNewAndReturnAllConversations';

import SmartSuggestionButton from './SmartSuggestionButton';
import SmartSuggestionCheckbox from './SmartSuggestionCheckbox';
import LetterByLetterDisplay from './LetterByLetterDisplay';
// import TerminalDisplay from './TerminalDisplay';
import AgentConversationHistory from './AgentConversationHistory';
import AnimatedCharacterLoader from './AnimatedCharacterLoader';
// import logo from '../static/captn-logo.png';
import logo from '../static/logo.svg';

type ConversationsListProps = {
  conversations: Conversation[];
  currentChatDetails: Chat;
  handleFormSubmit: any;
  userSelectedActionMessage?: string | null;
  onStreamAnimationComplete?: () => void;
};

export default function ConversationsList({
  conversations,
  currentChatDetails,
  handleFormSubmit,
  userSelectedActionMessage,
  onStreamAnimationComplete,
}: ConversationsListProps) {
  const [streamingAgentResponse, setStreamingAgentResponse] = useState('');
  // @ts-ignore
  const smartSuggestions = currentChatDetails?.smartSuggestions?.suggestions;
  // @ts-ignore
  const smartSuggestionsLength = smartSuggestions?.length;
  // @ts-ignore
  const isSmartSuggestionsAvailable =
    // @ts-ignore
    smartSuggestionsLength > 0 &&
    !(
      smartSuggestionsLength === 1 &&
      // @ts-ignore
      currentChatDetails?.smartSuggestions.suggestions[0] === ''
    );
  const lastConversationIdx = conversations.length - 1;

  useSocketListener('newMessageFromTeam', (message: any) => setStreamingAgentResponse(message));

  useSocketListener('streamFromTeamFinished', () => setStreamingAgentResponse(''));

  return (
    <div data-testid='conversations-wrapper' className='w-full'>
      {conversations.map((conversation, idx) => {
        const isUserConversation = conversation.role === 'user';
        const conversationBgColor = isUserConversation ? 'airt-primary' : 'airt-font-base';
        const conversationTextColor = isUserConversation ? 'airt-font-base' : 'airt-primary';
        const conversationLogo = isUserConversation ? (
          <div
            style={{
              alignItems: 'center',
              background: '#eae4d9',
              borderRadius: '50%',
              color: '#444654',
              display: 'flex',
              flexBasis: '40px',
              flexGrow: '0',
              flexShrink: '0',
              fontSize: '14px',
              height: '40px',
              justifyContent: 'center',
              padding: '5px',
              position: 'relative',
              width: '40px',
            }}
            className='flex'
          >
            <div>You</div>
          </div>
        ) : (
          <div
            className='bg-airt-primary'
            style={{ borderRadius: '50%', width: '93%', height: '93%', paddingTop: '3px' }}
          >
            <img
              alt='FastAgency logo'
              className='w-full h-full'
              src={logo}
              style={{ width: '78%', height: '78%', marginLeft: '4px' }}
            />
          </div>
        );

        return (
          <div key={idx}>
            {conversation.isLoading ? (
              <AnimatedCharacterLoader
                loadingMessage={`${
                  currentChatDetails.customerBrief || currentChatDetails.chatType === 'daily_analysis'
                    ? 'The team is currently working on the task. You can monitor their discussions in the window below as they progress...'
                    : 'Loading...'
                }`}
              />
            ) : (
              <div
                style={{ minHeight: '85px' }}
                className={`flex items-center px-5 group bg-${conversationBgColor} flex-col ${
                  isUserConversation ? 'user-conversation-container' : 'agent-conversation-container'
                }`}
              >
                <div
                  style={{ maxWidth: '800px', margin: 'auto' }}
                  className={`relative ml-3 block w-full p-4 pl-10 text-sm text-${conversationTextColor}  border-${conversationBgColor} rounded-lg bg-${conversationBgColor} `}
                >
                  <span
                    className='absolute inline-block'
                    style={{
                      left: '-15px',
                      top: '11px',
                      height: ' 45px',
                      width: '45px',
                    }}
                  >
                    {conversationLogo}
                  </span>
                  {idx === lastConversationIdx && !isUserConversation && (
                    <div className='chat-conversations text-base flex flex-col gap-2'>
                      {currentChatDetails?.streamAgentResponse && !currentChatDetails?.team_id ? (
                        <LetterByLetterDisplay
                          sentence={conversation.message}
                          speed={5}
                          onStreamAnimationComplete={onStreamAnimationComplete}
                        />
                      ) : (
                        <Markdown>{conversation.message}</Markdown>
                      )}
                    </div>
                  )}
                  {(idx !== lastConversationIdx || (idx === lastConversationIdx && isUserConversation)) && (
                    <div className='chat-conversations text-base flex flex-col gap-2'>
                      <Markdown>{conversation.message}</Markdown>
                    </div>
                  )}
                  {conversation.agentConversationHistory && (
                    <AgentConversationHistory agentConversationHistory={conversation.agentConversationHistory} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {currentChatDetails?.team_status === 'inprogress' && streamingAgentResponse && (
        <AgentConversationHistory
          agentConversationHistory={streamingAgentResponse}
          initialState={true}
          isAgentWindow={true}
        />
      )}

      {isSmartSuggestionsAvailable && !currentChatDetails?.streamAgentResponse && (
        <div data-testid='smart-suggestions' className='fadeIn'>
          {
            // @ts-ignore
            currentChatDetails.smartSuggestions?.type == 'oneOf' ? (
              <SmartSuggestionButton
                currentChatDetails={currentChatDetails}
                smartSuggestionOnClick={handleFormSubmit}
              />
            ) : (
              <SmartSuggestionCheckbox
                suggestions={
                  // @ts-ignore
                  currentChatDetails.smartSuggestions.suggestions
                }
                smartSuggestionOnClick={handleFormSubmit}
                chatType={currentChatDetails.chatType}
                userSelectedActionMessage={userSelectedActionMessage}
              />
            )
          }
        </div>
      )}
    </div>
  );
}
