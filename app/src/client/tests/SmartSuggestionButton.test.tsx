import { test, expect, vi, describe } from 'vitest';
import { renderInContext } from 'wasp/client/test';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as operations from 'wasp/client/operations';
import { createMemoryHistory } from 'history';

import { type Chat } from 'wasp/entities';
import SmartSuggestionButton from '../components/SmartSuggestionButton';

vi.mock('wasp/client/operations', async (importOriginal) => {
  const mod = await importOriginal<typeof import('wasp/client/operations')>();
  return {
    ...mod,
    retryTeamChat: vi.fn().mockResolvedValue([{ uuid: '123' }, 'Sample user message']),
  };
});

describe('SmartSuggestionButton', () => {
  test('renders the correct suggestions', () => {
    const mockOnClick = vi.fn();
    const currentChatDetails: Partial<Chat> = {
      smartSuggestions: {
        suggestions: ['Suggestion 1', 'Suggestion 2'],
      },
      isExceptionOccured: false,
    };

    renderInContext(
      <SmartSuggestionButton
        // @ts-ignore
        currentChatDetails={currentChatDetails}
        smartSuggestionOnClick={mockOnClick}
      />
    );
  });

  test('handles suggestion click correctly', () => {
    const mockOnClick = vi.fn();
    const currentChatDetails: Partial<Chat> = {
      smartSuggestions: {
        suggestions: ['Suggestion 1', 'Suggestion 2'],
      },
      isExceptionOccured: false,
    };

    renderInContext(
      <SmartSuggestionButton
        // @ts-ignore
        currentChatDetails={currentChatDetails}
        smartSuggestionOnClick={mockOnClick}
      />
    );

    fireEvent.click(screen.getByText('Suggestion 1'));
    expect(mockOnClick).toHaveBeenCalledWith('Suggestion 1');
  });

  test('handles exception correctly', () => {
    const mockOnClick = vi.fn();
    const currentChatDetails: Partial<Chat> = {
      smartSuggestions: {
        suggestions: ['Suggestion 1', 'Suggestion 2'],
      },
      isExceptionOccured: true,
    };

    renderInContext(
      <SmartSuggestionButton
        // @ts-ignore
        currentChatDetails={currentChatDetails}
        smartSuggestionOnClick={mockOnClick}
      />
    );

    fireEvent.click(screen.getByText('Suggestion 1'));
    expect(mockOnClick).toHaveBeenCalledWith(null, false, true);
  });

  test('handles team chat type correctly', async () => {
    const mockOnClick = vi.fn();
    const history = createMemoryHistory();
    const currentChatDetails: Partial<Chat> = {
      team_name: 'Team Name',
      smartSuggestions: {
        suggestions: ['Suggestion 1', 'Suggestion 2'],
      },
      isExceptionOccured: true,
      id: 1,
    };

    renderInContext(
      <SmartSuggestionButton
        // @ts-ignore
        currentChatDetails={currentChatDetails}
        smartSuggestionOnClick={mockOnClick}
      />
    );

    fireEvent.click(screen.getByText('Suggestion 1'));

    expect(operations.retryTeamChat).toHaveBeenCalledWith(currentChatDetails.id);
  });
});
