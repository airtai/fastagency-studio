import { type Chat } from 'wasp/entities';
import { retryTeamChat } from 'wasp/client/operations';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import Markdown from 'markdown-to-jsx';

export default function SmartSuggestionButton({
  currentChatDetails,
  smartSuggestionOnClick,
}: {
  currentChatDetails: Chat;
  smartSuggestionOnClick: any;
}) {
  const [isShowSuggestions, setIsShowSuggestions] = useState(true);
  const history = useHistory();
  // @ts-ignore
  const suggestions = currentChatDetails.smartSuggestions.suggestions;
  async function handleSuggestionClick(suggestion: string, smartSuggestionOnClick: any) {
    if (currentChatDetails.isExceptionOccured) {
      if (currentChatDetails.team_name) {
        const [chat, lastConversationMessage] = await retryTeamChat(currentChatDetails.id);
        history.push(`/playground/${chat.uuid}?msg=${lastConversationMessage}`);
      } else {
        setIsShowSuggestions(false);
        smartSuggestionOnClick(null, false, true);
      }
    } else {
      smartSuggestionOnClick(suggestion);
      setIsShowSuggestions(false);
    }
  }
  return (
    <div>
      <div className={` pb-4 flex items-center group bg-airt-primary`}>
        <div
          style={{ maxWidth: '765px', margin: 'auto' }}
          className={`fade-in  relative ml-3 block w-full px-4 rounded-lg bg-airt-primary ${
            isShowSuggestions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className='ml-5 chat-conversations text-base flex flex-wrap'>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className=' bg-airt-secondary hover:opacity-90 font-medium rounded-lg text-sm px-3 py-2 m-1 text-airt-primary'
                onClick={() => handleSuggestionClick(suggestion, smartSuggestionOnClick)}
              >
                <Markdown>{suggestion}</Markdown>
              </button>
            ))}
          </div>
          {!currentChatDetails.isExceptionOccured && (
            <p className='my-2 ml-6 pt-2 text-airt-font-base'>
              You can choose from the listed options above or type your own answers in the input field below.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
