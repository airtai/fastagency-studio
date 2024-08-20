import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserProperty } from '../components/buildPage/UserProperty';
import { renderInContext } from 'wasp/client/test';
import { useQuery } from 'wasp/client/operations';
import { mockProps } from './mocks';

const mockRefetch = vi.fn();
const userPropertiesMockResponse = [
  {
    uuid: 'test-4dd6-81af-4155de6a87ec',
    user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
    type_name: 'secret',
    model_name: 'AzureOAIAPIKey',
    json_str: {
      name: '111',
      api_key: '111111',
    },
    created_at: '2024-08-19T11:28:32.875000Z',
    updated_at: '2024-08-19T11:28:32.875000Z',
  },
];

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

describe('UserProperty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders UserProperty component with add button when no models exist', () => {
    renderInContext(<UserProperty {...mockProps} />);

    // Check for the presence of the "Add TestProperty" button
    expect(screen.getByText('Add Secret')).toBeInTheDocument();

    // Check for the "No TestProperty found" message
    expect(screen.getByText('No Secrets found. Please add one.')).toBeInTheDocument();
  });

  it('renders loading component when data is being fetched', () => {
    (useQuery as Mock).mockReturnValue({ data: undefined, refetch: vi.fn(), isLoading: true });

    const { getByText, container } = renderInContext(<UserProperty {...mockProps} />);

    expect(getByText('Loading...')).toBeInTheDocument();
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

    renderInContext(<UserProperty {...mockProps} />);

    expect(screen.getByText('Secret1')).toBeInTheDocument();
    expect(screen.getByText('Secret2')).toBeInTheDocument();
    expect(screen.queryByText('No Secrets found. Please add one.')).not.toBeInTheDocument();
  });

  it('opens form to add new model when Add Secret button is clicked', async () => {
    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { getByText, getAllByTestId } = renderInContext(<UserProperty {...mockProps} />);

    const addButton = getByText('Add Secret');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add a new Secret')).toBeInTheDocument();
      expect(screen.getByText('Select Secret')).toBeInTheDocument();
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

    renderInContext(<UserProperty {...llmProps} />);

    expect(screen.getByText('Add LLM')).toBeInTheDocument();
    expect(screen.getByText('No LLMs found. Please add one.')).toBeInTheDocument();
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

    renderInContext(<UserProperty {...mockProps} />);

    expect(screen.getByText('Secret1')).toBeInTheDocument();
    expect(screen.queryByText('LLM1')).not.toBeInTheDocument();
  });
  it('uses correct schema when adding a new model', async () => {
    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { getByText, getByRole, container } = renderInContext(<UserProperty {...mockProps} />);

    fireEvent.click(screen.getByText('Add Secret'));

    await waitFor(() => {
      expect(getByText('AnthropicAPIKey')).toBeInTheDocument();
    });

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    await waitFor(() => {
      expect(getByText('AzureOAIAPIKey')).toBeInTheDocument();
    });

    // on cancel button click, the form should be closed
    const cancelButton = getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Add Secret')).toBeInTheDocument();
    expect(screen.getByText('No Secrets found. Please add one.')).toBeInTheDocument();
  });
});

describe('End-to-End mock test for form save and resume functaionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Initial mock setup
    mockRefetch.mockResolvedValue({ data: userPropertiesMockResponse });

    (useQuery as Mock).mockReturnValue({
      data: userPropertiesMockResponse,
      isLoading: false,
      refetch: mockRefetch,
    });
  });

  it('Should persist user-filled form data when pressing cancel in the resume flow', async () => {
    const user = userEvent.setup();
    const agentProps = {
      ...mockProps,
      activeProperty: 'agent',
    };

    const { getByText, getAllByRole, container } = renderInContext(<UserProperty {...agentProps} />);

    // Click 'Add Agent' button
    await user.click(screen.getByText('Add Agent'));

    // Wait for the form to appear
    await waitFor(() => {
      expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
      expect(screen.getByText('LLM')).toBeInTheDocument();
    });

    // Update the Name
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'Test Name');

    // Open the LLM dropdown
    const selectElements = getAllByRole('combobox');
    await user.click(selectElements[1]);

    // Check the listbox content
    const listbox = screen.getByRole('listbox');
    expect(listbox.children.length).toBe(1);
    expect(screen.getByText('Add new "LLM"')).toBeInTheDocument();

    // Click the 'Add new "LLM"' option
    await user.click(screen.getByText('Add new "LLM"'));

    // Wait for the new LLM form to appear
    await waitFor(() => {
      expect(screen.getByText('Select LLM')).toBeInTheDocument();
    });

    // press cancelButton
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Wait for the previous form to optn
    await waitFor(() => {
      expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
      expect(screen.getByText('LLM')).toBeInTheDocument();

      // check if the previous form is able to presist the user input
      expect(nameInput).toHaveValue('Test Name');
    });
  });
  it('Should persist user-filled form data when a dependent property is created and the previous form is redisplayed', async () => {
    const user = userEvent.setup();
    const agentProps = {
      ...mockProps,
      activeProperty: 'agent',
    };

    const { getAllByRole, container } = renderInContext(<UserProperty {...agentProps} />);

    // Click 'Add Agent' button
    await user.click(screen.getByText('Add Agent'));

    // Wait for the form to appear
    await waitFor(() => {
      expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
      expect(screen.getByText('LLM')).toBeInTheDocument();
    });

    // Update the agent Name
    const agentNameInput = screen.getByLabelText('Name');
    await user.type(agentNameInput, 'My Agent');

    // Open the LLM dropdown
    const selectElements = getAllByRole('combobox');
    await user.click(selectElements[1]);

    // Check the listbox content
    const listbox = screen.getByRole('listbox');
    expect(listbox.children.length).toBe(1);
    expect(screen.getByText('Add new "LLM"')).toBeInTheDocument();

    // Click the 'Add new "LLM"' option
    await user.click(screen.getByText('Add new "LLM"'));

    // Wait for the new LLM form to appear
    await waitFor(() => {
      expect(screen.getByText('Select LLM')).toBeInTheDocument();
    });

    // Update the LLM Name
    const llmNameInput = screen.getByLabelText('Name');
    await user.type(llmNameInput, 'My LLM');

    // Mock the response for after a new LLM is created
    const updatedUserProperties = [
      ...userPropertiesMockResponse,
      {
        uuid: 'test-uuid-563ec0df-3ecd-4d2a-a43a',
        user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
        type_name: 'llm',
        model_name: 'AzureOAI',
        json_str: {
          name: 'My LLM',
          model: 'gpt-3.5-turbo',
          api_key: {
            name: 'AzureOAIAPIKey',
            type: 'secret',
            uuid: 'test-4dd6-81af-4155de6a87ec',
          },
          api_type: 'azure',
          base_url: 'https://api.openai.com/v1',
          api_version: '2024-02-01',
          temperature: 0.8,
        },
        created_at: '2024-08-19T11:30:40.194000Z',
        updated_at: '2024-08-19T11:30:40.194000Z',
      },
    ];

    // Update the mock refetch function to return the new data after saving
    mockRefetch.mockResolvedValueOnce({ data: updatedUserProperties });

    // press save button
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    // Wait for the refetch to be called
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });

    await waitFor(async () => {
      expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
      expect(screen.getByText('LLM')).toBeInTheDocument();

      // check if the previous form is able to presist the user input
      expect(agentNameInput).toHaveValue('My Agent');
      expect(screen.getByText('My LLM')).toBeInTheDocument();

      // Open the LLM dropdown
      const selectElements = getAllByRole('combobox');
      await user.click(selectElements[1]);
      // Check the listbox content
      const listbox = screen.getByRole('listbox');
      expect(listbox.children.length).toBe(2);
    });
  });
});
