import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { fireEvent, waitFor, within } from '@testing-library/react';

import { BuildPageTab } from '../components/buildPage/BuildPageTab';
import { renderInContext } from 'wasp/client/test';
import { useQuery } from 'wasp/client/operations';
import { mockProps } from './mocks';

function getActiveTabPanel(container: HTMLElement): HTMLElement {
  // Find the active tab
  const activeTab = container.querySelector('[aria-selected="true"]');
  expect(activeTab).not.toBeNull();
  expect(activeTab).toBeInstanceOf(HTMLElement);

  // Find the active tab panel
  const activeTabPanel = container.querySelector(`[aria-labelledby="${(activeTab as HTMLElement).id}"]`);
  expect(activeTabPanel).not.toBeNull();
  expect(activeTabPanel).toBeInstanceOf(HTMLElement);

  return activeTabPanel as HTMLElement;
}

const validateAndSaveMockResponse = {
  json: {
    name: 'My LLM',
    api_key: 'test-api-key', // pragma: allowlist secret
    uuid: 'test-uuid-563ec0df-3ecd-4d2a-a43a',
  },
};

// Mock the wasp/client/operations
vi.mock('wasp/client/operations', () => ({
  useQuery: vi.fn(() => ({
    data: [
      { uuid: '1', type_name: 'testProperty', model_name: 'Model1', json_str: {} },
      { uuid: '2', type_name: 'testProperty', model_name: 'Model2', json_str: {} },
    ],
    isLoading: false,
    refetch: vi.fn(),
  })),
  getModels: vi.fn(),
  validateForm: vi.fn(() => Promise.resolve(validateAndSaveMockResponse)),
  addUserModels: vi.fn(() => Promise.resolve(validateAndSaveMockResponse)),
}));

describe('BuildPageTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders BuildPageTab component with add button when no models exist', () => {
    const { container } = renderInContext(<BuildPageTab {...mockProps} />);
    const activeTabPanel = getActiveTabPanel(container);

    // Check for the presence of the "Add TestProperty" button within the active tab panel
    expect(within(activeTabPanel as HTMLElement).queryByText('ADD SECRET')).toBeInTheDocument();

    // Check for the "No TestProperty found" message within the active tab panel
    expect(within(activeTabPanel as HTMLElement).queryByText('No Secrets found. Please add one.')).toBeInTheDocument();
  });

  it('renders loading component when data is being fetched', () => {
    (useQuery as Mock).mockReturnValue({ data: undefined, refetch: vi.fn(), isLoading: true });

    const { container } = renderInContext(<BuildPageTab {...mockProps} />);

    const activeTabPanel = getActiveTabPanel(container);
    expect(within(activeTabPanel as HTMLElement).queryByText('Loading...')).toBeInTheDocument();
  });

  it('renders ModelsList when models exist', () => {
    (useQuery as Mock).mockReturnValue({
      data: [
        { uuid: '1', type_name: 'secret', model_name: 'Secret1', json_str: {} },
        { uuid: '2', type_name: 'secret', model_name: 'Secret2', json_str: {} },
      ],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { container } = renderInContext(<BuildPageTab {...mockProps} />);
    const activeTabPanel = getActiveTabPanel(container);

    expect(within(activeTabPanel as HTMLElement).queryByText('Secret1')).toBeInTheDocument();
    expect(within(activeTabPanel as HTMLElement).queryByText('Secret2')).toBeInTheDocument();
    expect(
      within(activeTabPanel as HTMLElement).queryByText('No Secrets found. Please add one.')
    ).not.toBeInTheDocument();
  });

  it('opens form to add new model when Add Secret button is clicked', async () => {
    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { container } = renderInContext(<BuildPageTab {...mockProps} />);
    const activeTabPanel = getActiveTabPanel(container);

    const addButton = within(activeTabPanel as HTMLElement).getByText('ADD SECRET');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(within(activeTabPanel as HTMLElement).getByText('Add a new Secret')).toBeInTheDocument();
      expect(within(activeTabPanel as HTMLElement).getByText('Select Secret')).toBeInTheDocument();
    });
  });
  it('renders correct property name for LLM', () => {
    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    const llmProps = {
      ...mockProps,
      activeProperty: 'llm',
    };

    const { container } = renderInContext(<BuildPageTab {...llmProps} />);
    const activeTabPanel = getActiveTabPanel(container);

    expect(within(activeTabPanel as HTMLElement).getByText('ADD LLM')).toBeInTheDocument();
    expect(within(activeTabPanel as HTMLElement).getByText('No LLMs found. Please add one.')).toBeInTheDocument();
  });
  it('filters models by activeProperty type', () => {
    (useQuery as Mock).mockReturnValue({
      data: [
        { uuid: '1', type_name: 'secret', model_name: 'Secret1', json_str: {} },
        { uuid: '2', type_name: 'llm', model_name: 'LLM1', json_str: {} },
      ],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { container } = renderInContext(<BuildPageTab {...mockProps} />);
    const activeTabPanel = getActiveTabPanel(container);

    expect(within(activeTabPanel as HTMLElement).getByText('Secret1')).toBeInTheDocument();
    expect(within(activeTabPanel as HTMLElement).queryByText('LLM1')).not.toBeInTheDocument();
  });
  it('uses correct schema when adding a new model', async () => {
    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { container } = renderInContext(<BuildPageTab {...mockProps} />);
    const activeTabPanel = getActiveTabPanel(container);

    const addButton = within(activeTabPanel as HTMLElement).getByText('ADD SECRET');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(within(activeTabPanel as HTMLElement).getByText('AnthropicAPIKey')).toBeInTheDocument();
    });

    // Open the select dropdown
    const selectElement = within(activeTabPanel as HTMLElement).getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      expect(within(activeTabPanel as HTMLElement).getByText('AzureOAIAPIKey')).toBeInTheDocument();
    });

    // on cancel button click, the form should be closed
    const cancelButton = within(activeTabPanel as HTMLElement).getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(within(activeTabPanel as HTMLElement).getByText('ADD SECRET')).toBeInTheDocument();
    expect(within(activeTabPanel as HTMLElement).getByText('No Secrets found. Please add one.')).toBeInTheDocument();
  });
});
