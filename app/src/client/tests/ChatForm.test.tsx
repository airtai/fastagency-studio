import { test, expect, describe, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderInContext } from 'wasp/client/test';

import ChatForm from '../components/ChatForm';
import { Chat } from 'wasp/entities';

describe('ChatForm', () => {
  test('renders ChatForm and auto submits the form', async () => {
    const handleFormSubmit = vi.fn();
    const currentChatDetails: Chat = {
      id: 1,
      uuid: '1312312312321313',
      createdAt: new Date(),
      updatedAt: new Date(),
      team_id: 1,
      team_name: '',
      team_status: '',
      userRespondedWithNextAction: false,
      agentChatHistory: '',
      isExceptionOccured: false,
      showLoader: false,
      smartSuggestions: {},
      streamAgentResponse: false,
      customerBrief: '',
      userId: 1,
      name: '',
      isChatNameUpdated: false,
      selectedTeam: '',
      isChatTerminated: false,
    };
    const triggerChatFormSubmitMsg = 'Test message';

    const { getByTestId, getByPlaceholderText } = renderInContext(
      <ChatForm
        handleFormSubmit={handleFormSubmit}
        currentChatDetails={currentChatDetails}
        triggerChatFormSubmitMsg={triggerChatFormSubmitMsg}
      />
    );
    expect(getByTestId('chat-form')).toBeInTheDocument();
    expect(handleFormSubmit).toHaveBeenCalledWith(triggerChatFormSubmitMsg, true);
  });
  test('renders ChatForm and submits the form', async () => {
    const handleFormSubmit = vi.fn();
    const currentChatDetails: Chat = {
      id: 1,
      uuid: '1312312312321313',
      createdAt: new Date(),
      updatedAt: new Date(),
      team_id: 1,
      team_name: '',
      team_status: '',
      userRespondedWithNextAction: false,
      agentChatHistory: '',
      isExceptionOccured: false,
      showLoader: false,
      smartSuggestions: {},
      streamAgentResponse: false,
      customerBrief: '',
      userId: 1,
      name: '',
      isChatNameUpdated: false,
      selectedTeam: '',
      isChatTerminated: false,
    };

    renderInContext(
      <ChatForm
        handleFormSubmit={handleFormSubmit}
        currentChatDetails={currentChatDetails}
        triggerChatFormSubmitMsg={null}
      />
    );
    expect(screen.getByTestId('chat-form')).toBeInTheDocument();

    const formInputValue = 'Hello World!';
    const input = screen.getByPlaceholderText('Enter your message...');
    fireEvent.change(input, { target: { value: formInputValue } });
    // @ts-ignore
    expect(input.value).toBe(formInputValue);

    // Simulate form submission
    const form = screen.getByTestId('chat-form');
    fireEvent.submit(form);

    await waitFor(() => expect(handleFormSubmit).toHaveBeenCalledWith(formInputValue));
  });
});
