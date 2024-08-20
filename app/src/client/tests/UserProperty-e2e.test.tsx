import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// import { UserProperty } from '../components/buildPage/UserProperty';
import { renderInContext } from 'wasp/client/test';
import { useQuery } from 'wasp/client/operations';
import { mockProps } from './mocks';

// Mock data and functions
let mockData: any = [];
let mockIsLoading = false;
const mockRefetch = vi.fn();
const mockGetModels = vi.fn();
const mockValidateForm = vi.fn();
const mockAddUserModels = vi.fn();

// Mock the entire wasp/client/operations module
vi.mock('wasp/client/operations', () => ({
  useQuery: vi.fn(() => ({
    data: mockData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  })),
  getModels: (...args: any) => mockGetModels(...args),
  validateForm: (...args: any) => mockValidateForm(...args),
  addUserModels: (...args: any) => mockAddUserModels(...args),
}));

describe('End-to-End mock test for form save and resume functaionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data and functions to initial state
    mockData = [];
    mockIsLoading = false;
    mockRefetch.mockReset().mockResolvedValue({ data: mockData });
    mockGetModels.mockReset().mockResolvedValue([]);
    mockValidateForm.mockReset();
    mockAddUserModels.mockReset();
  });

  it('Should persist user-filled form data when pressing cancel in the resume flow', async () => {
    const user = userEvent.setup();
    const agentProps = {
      ...mockProps,
      activeProperty: 'agent',
    };

    const { UserProperty } = await import('../components/buildPage/UserProperty');

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

    const { UserProperty } = await import('../components/buildPage/UserProperty');
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
    await user.type(agentNameInput, 'My Anthropic Agent');

    // Open the LLM dropdown
    const llmDropdown = getAllByRole('combobox');
    await user.click(llmDropdown[1]);

    // Check the listbox content
    const listbox = screen.getByRole('listbox');
    expect(listbox.children.length).toBe(1);
    expect(screen.getByText('Add new "LLM"')).toBeInTheDocument();

    // Click the 'Add new "LLM"' option
    await user.click(screen.getByText('Add new "LLM"'));

    // Wait for the new LLM form to appear
    await waitFor(() => {
      expect(screen.getByText('Select LLM')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
    });

    // Update the LLM Name
    const llmNameInput = screen.getByLabelText('Name');
    await user.type(llmNameInput, 'My Anthropic LLM');

    // Open the Api_key dropdown and select add new secret
    await user.click(getAllByRole('combobox')[2]);

    const apiKeyListbox = screen.getByRole('listbox');
    expect(apiKeyListbox.children.length).toBe(1);

    // Click the 'Add new "Secret"' option
    await user.click(screen.getByText('Add new "Secret"'));

    // Wait for the new Secret form to appear
    await waitFor(() => {
      expect(screen.getByText('Select Secret')).toBeInTheDocument();
    });

    // check if the dropdown as AnthropicAPIKey
    expect(screen.getByText('AnthropicAPIKey')).toBeInTheDocument();

    // Update the secret Name
    const secretNameInput = screen.getByLabelText('Name');
    await user.type(secretNameInput, 'My AnthropicAPIKey Secret');

    // Update the secret Api Key
    const secretApiKeyInput = screen.getByLabelText('Api Key');
    await user.type(secretApiKeyInput, 'My Api Key');

    // Mock validation for Secret
    mockValidateForm.mockResolvedValue({
      name: 'My AnthropicAPIKey Secret',
      api_key: 'test-api-key-12345', // pragma: allowlist secret
      uuid: 'test-uuid-secret-123',
    });

    // Mock the response for after a new Secret is created
    mockData = [
      {
        uuid: 'test-uuid-secret-123',
        user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
        type_name: 'secret',
        model_name: 'AnthropicAPIKey',
        json_str: {
          name: 'My AnthropicAPIKey Secret',
          api_key: 'test-api-key-12345', // pragma: allowlist secret
        },
        created_at: '2024-08-19T11:28:32.875000Z',
        updated_at: '2024-08-19T11:28:32.875000Z',
      },
    ];

    // Update the mock refetch function to return the new data after saving
    mockRefetch.mockResolvedValue({ data: mockData });

    // press save button
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    // Wait for the refetch to be called
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });

    // Wait for the refetch to be called and check if the data is updated
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic LLM');
      expect(screen.getByText('My AnthropicAPIKey Secret')).toBeInTheDocument();
    });

    // Mock validation for LLM
    mockValidateForm.mockResolvedValue({
      name: 'My Anthropic LLM',
      model: 'claude-3-5-sonnet-20240620',
      api_key: {
        name: 'My AnthropicAPIKey Secret',
        type: 'secret',
        uuid: 'test-uuid-secret-123',
      },
      api_type: 'anthropic',
      base_url: 'https://api.anthropic.com/v1',
      temperature: 0.8,
      uuid: 'test-uuid-llm-456',
    });

    // Update mockData for LLM creation
    mockData = [
      ...mockData,
      {
        uuid: 'test-uuid-llm-456',
        user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
        type_name: 'llm',
        model_name: 'Anthropic',
        json_str: {
          name: 'My Anthropic LLM',
          model: 'claude-3-5-sonnet-20240620',
          api_key: {
            name: 'My AnthropicAPIKey Secret',
            type: 'secret',
            uuid: 'test-uuid-secret-123',
          },
          api_type: 'anthropic',
          base_url: 'https://api.anthropic.com/v1',
          temperature: 0.8,
        },
        created_at: '2024-08-19T11:30:40.194000Z',
        updated_at: '2024-08-19T11:30:40.194000Z',
      },
    ];

    mockRefetch.mockResolvedValue({ data: mockData });

    // Simulate saving the LLM
    const saveLLMButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveLLMButton);

    await waitFor(async () => {
      expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
      expect(screen.getByText('LLM')).toBeInTheDocument();
      // check if the previous form is able to presist the user input
      expect(agentNameInput).toHaveValue('My Anthropic Agent');
      expect(screen.getByText('My Anthropic LLM')).toBeInTheDocument();
      // Open the Agent dropdown
      await user.click(getAllByRole('combobox')[1]);
      // Check the listbox content
      expect(screen.getByRole('listbox').children.length).toBe(2);
    });

    // Mock validation for Toolbox
    mockValidateForm.mockResolvedValue({
      name: 'My Toolbox Name',
      openapi_url: 'https://api.mytoolbox.com/openapi.json',
      openapi_auth: null,
      uuid: 'test-uuid-toolbox-789',
    });

    // Update mockData for Toolbox creation
    mockData = [
      ...mockData,
      {
        uuid: 'test-uuid-toolbox-789',
        user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
        type_name: 'toolbox',
        model_name: 'Toolbox',
        json_str: {
          name: 'My Toolbox Name',
          openapi_url: 'https://api.mytoolbox.com/openapi.json',
          openapi_auth: null,
        },
        created_at: '2024-08-20T08:02:57.112000Z',
        updated_at: '2024-08-20T08:02:57.112000Z',
      },
    ];

    mockRefetch.mockResolvedValue({ data: mockData });

    // Simulate creating and saving the Toolbox
    await user.click(getAllByRole('combobox')[2]);
    await user.click(screen.getByText('Add new "Toolbox"'));
    await user.type(screen.getByLabelText('Name'), 'My Toolbox Name');
    await user.type(screen.getByLabelText('OpenAPI URL'), 'https://api.mytoolbox.com/openapi.json');

    const saveToolboxButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveToolboxButton);

    await waitFor(async () => {
      // check if the previous form is able to presist the user input
      expect(agentNameInput).toHaveValue('My Anthropic Agent');
      expect(screen.getByText('My Anthropic LLM')).toBeInTheDocument();
      expect(screen.getByText('My Toolbox Name')).toBeInTheDocument();
    });

    // Mock validation for Agent
    mockValidateForm.mockResolvedValue({
      name: 'My Anthropic Agent',
      llm: {
        type: 'llm',
        name: 'My Anthropic LLM',
        uuid: 'test-uuid-llm-456',
      },
      toolbox_1: {
        type: 'toolbox',
        name: 'My Toolbox Name',
        uuid: 'test-uuid-toolbox-789',
      },
      toolbox_2: null,
      toolbox_3: null,
      system_message: 'You are a helpful assistant.',
      uuid: 'test-uuid-agent-101',
    });

    // Update mockData for Agent creation
    mockData = [
      ...mockData,
      {
        uuid: 'test-uuid-agent-101',
        user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
        type_name: 'agent',
        model_name: 'AssistantAgent',
        json_str: {
          name: 'My Anthropic Agent',
          llm: {
            name: 'My Anthropic LLM',
            uuid: 'test-uuid-llm-456',
          },
          toolbox_1: {
            name: 'My Toolbox Name',
            uuid: 'test-uuid-toolbox-789',
          },
          toolbox_2: null,
          toolbox_3: null,
          system_message: 'You are a helpful assistant.',
        },
        created_at: '2024-08-20T10:15:30.000000Z',
        updated_at: '2024-08-20T10:15:30.000000Z',
      },
    ];

    mockRefetch.mockResolvedValue({ data: mockData });

    // Simulate saving the Agent
    const saveAgentButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveAgentButton);

    // Check if the Agent is saved and the list of Agents is displayed
    await waitFor(() => {
      // Check if we're back to the list view
      expect(screen.getByText('Add Agent')).toBeInTheDocument();

      // Check if our new Agent is in the list
      expect(screen.getByText('My Anthropic Agent')).toBeInTheDocument();

      // Check if the "No Agents found" message is not displayed
      expect(screen.queryByText('No Agents found. Please add one.')).not.toBeInTheDocument();
    });

    // Simulate clicking on the newly created Agent to edit it
    await user.click(screen.getByText('My Anthropic Agent'));

    // Check if the Agent form is populated with the correct data
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic Agent');
      expect(screen.getByText('My Anthropic LLM')).toBeInTheDocument();
      console.log('container.innerHTML', container.innerHTML);
      expect(screen.getByText('My Toolbox Name')).toBeInTheDocument();
    });
  });
});
