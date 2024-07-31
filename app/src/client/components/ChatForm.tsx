import React, { useRef, useState, useEffect, useCallback } from 'react';

import TextareaAutosize from 'react-textarea-autosize';
import { useSocketListener } from 'wasp/client/webSocket';
import { type Chat } from 'wasp/entities';

interface ChatFormProps {
  handleFormSubmit: (userQuery: string, isUserRespondedWithNextAction?: boolean, retrySameChat?: boolean) => void;
  currentChatDetails: Chat;
  triggerChatFormSubmitMsg?: string | null;
}

export default function ChatForm({ handleFormSubmit, currentChatDetails, triggerChatFormSubmitMsg }: ChatFormProps) {
  const [message, setMessage] = useState<string>('');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasTriggerSubmitted = useRef(false);

  const isInputDisabled = useCallback(() => {
    return (
      hasTriggerSubmitted.current || currentChatDetails?.team_status === 'inprogress' || currentChatDetails?.showLoader
    );
  }, [currentChatDetails]);

  const formRef = useCallback(
    async (node: HTMLFormElement | null) => {
      if (node !== null && triggerChatFormSubmitMsg && !hasTriggerSubmitted.current) {
        hasTriggerSubmitted.current = true;
        await handleFormSubmit(triggerChatFormSubmitMsg, true);
      }
    },
    [triggerChatFormSubmitMsg, handleFormSubmit]
  );

  useEffect(() => {
    if (currentChatDetails && currentChatDetails.isChatTerminated) {
      return;
    }
    textAreaRef.current?.focus();
  }, [currentChatDetails]);

  useSocketListener('streamFromTeamFinished', () => {
    textAreaRef.current?.focus();
    hasTriggerSubmitted.current = false;
  });

  const submitMessage = async () => {
    if (isInputDisabled() || !message.trim()) return;

    hasTriggerSubmitted.current = true;

    try {
      await handleFormSubmit(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      hasTriggerSubmitted.current = false;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await submitMessage();
    }
  };

  return (
    <div className='mt-2 mb-2'>
      <form data-testid='chat-form' onSubmit={handleSubmit} className='' ref={formRef}>
        <label
          htmlFor='search'
          className='mb-2 text-sm font-medium text-captn-dark-blue sr-only dark:text-airt-font-base'
        >
          Search
        </label>
        <div className='relative bottom-0 left-0 right-0 flex items-center justify-between m-1'>
          <TextareaAutosize
            ref={textAreaRef}
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Enter your message...'
            minRows={1}
            maxRows={4}
            className='w-full p-3 text-sm text-white bg-airt-primary rounded-lg focus:outline-none focus:ring-0'
            style={{ resize: 'none', lineHeight: '1.5' }}
          />
          <button
            type='submit'
            disabled={isInputDisabled() || !message.trim()}
            className={`absolute right-2 p-1.5 rounded-lg ${
              isInputDisabled() || !message.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-secondary hover:opacity-90 cursor-pointer'
            }`}
            aria-label='Send message'
          >
            <span className=''>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='none' className='text-airt-primary'>
                <path
                  d='M7 11L12 6L17 11M12 18V7'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                ></path>
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
