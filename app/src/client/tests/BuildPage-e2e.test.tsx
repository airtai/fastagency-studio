import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { screen, waitFor, RenderResult, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { renderInContext } from 'wasp/client/test';
import { useQuery } from 'wasp/client/operations';
import { llmUserProperties, mockProps } from './mocks';
import _ from 'lodash';

// Types
interface MockData {
  uuid: string;
  user_uuid: string;
  type_name: string;
  model_name: string;
  json_str: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Mock setup
let mockData: MockData[] = [];
let mockIsLoading = false;
const mockRefetch = vi.fn();
const mockGetModels = vi.fn();
const mockValidateForm = vi.fn();
const mockAddUserModels = vi.fn();
const mockUpdateUserModels = vi.fn();

vi.mock('wasp/client/operations', () => ({
  useQuery: vi.fn(() => ({
    data: mockData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  })),
  getModels: (...args: any[]) => mockGetModels(...args),
  validateForm: (...args: any[]) => mockValidateForm(...args),
  addUserModels: (...args: any[]) => mockAddUserModels(...args),
  updateUserModels: (...args: any[]) => mockUpdateUserModels(...args),
}));

function getActiveTabPanel(): HTMLElement {
  const activeTab = screen.getByRole('tab', { selected: true });
  const activeTabPanel = screen.getByRole('tabpanel', { hidden: false });
  return activeTabPanel;
}

// Helper functions
const setupComponent = async (): Promise<{ user: UserEvent; container: HTMLElement }> => {
  const user = userEvent.setup();
  const { BuildPageTab } = await import('../components/buildPage/BuildPageTab');
  const renderResult = renderInContext(<BuildPageTab {...mockProps} activeProperty='agent' />);
  const activePanel = getActiveTabPanel();
  await user.click(within(activePanel).getByText('ADD AGENT'));
  await waitFor(() => {
    expect(within(activePanel).getByText('AssistantAgent')).toBeInTheDocument();
    expect(within(activePanel).getByText('LLM')).toBeInTheDocument();
  });
  return { user, ...renderResult };
};

const createSecret = async (user: UserEvent): Promise<void> => {
  const activePanel = getActiveTabPanel();
  await user.click(within(activePanel).getAllByRole('combobox')[2]);
  await user.click(within(activePanel).getByText('Add new "Secret"'));
  await waitFor(() => expect(within(activePanel).getByText('Select Secret')).toBeInTheDocument());
  expect(within(activePanel).getByText('AnthropicAPIKey')).toBeInTheDocument();

  const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
  await user.type(nameInput, 'My AnthropicAPIKey Secret');

  const apiKeyInput = within(activePanel).getByPlaceholderText('The API Key from Anthropic');
  await user.type(apiKeyInput, 'My Api Key');

  mockValidateForm.mockResolvedValue({
    name: 'My AnthropicAPIKey Secret',
    api_key: 'test-api-key-12345', // pragma: allowlist secret
    uuid: 'test-uuid-secret-123',
  });

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

  mockRefetch.mockResolvedValue({ data: mockData });

  // Check if the breadcrumbs are displayed correctly
  expect(within(activePanel).getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
  expect(within(activePanel).getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();
  expect(within(activePanel).getByTestId('breadcrumb-link-Secret')).toBeInTheDocument();

  // Save the form
  await user.click(within(activePanel).getByRole('button', { name: 'Save' }));

  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
  });

  // Wait for the refetch to be called and check if the data is updated
  await waitFor(() => {
    expect(mockRefetch).toHaveBeenCalled();
    expect(within(activePanel).getByText('Anthropic')).toBeInTheDocument();

    const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
    expect(nameInput).toHaveValue('My Anthropic LLM');

    expect(within(activePanel).getByText('My AnthropicAPIKey Secret')).toBeInTheDocument();
  });
};

const createLLM = async (user: UserEvent): Promise<void> => {
  const activePanel = getActiveTabPanel();
  await user.click(within(activePanel).getAllByRole('combobox')[1]);
  await user.click(within(activePanel).getByText('Add new "LLM"'));
  await waitFor(() => expect(within(activePanel).getByText('Select LLM')).toBeInTheDocument());
  const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
  await user.type(nameInput, 'My Anthropic LLM');

  await createSecret(user);

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

  mockData.push({
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
  });

  mockRefetch.mockResolvedValue({ data: mockData });

  // Check if the breadcrumbs are displayed correctly
  expect(within(activePanel).getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
  expect(within(activePanel).getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();

  // Save the form
  await user.click(within(activePanel).getByRole('button', { name: 'Save' }));

  await waitFor(async () => {
    expect(within(activePanel).getByText('AssistantAgent')).toBeInTheDocument();
    expect(within(activePanel).getByText('LLM')).toBeInTheDocument();

    const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
    expect(nameInput).toHaveValue('My Anthropic Agent');
    expect(within(activePanel).getByText('My Anthropic LLM')).toBeInTheDocument();
    await user.click(within(activePanel).getAllByRole('combobox')[1]);
    expect(within(activePanel).getByRole('listbox').children.length).toBe(2);
  });
};

const createToolbox = async (user: UserEvent): Promise<void> => {
  const activePanel = getActiveTabPanel();
  await user.click(within(activePanel).getAllByRole('combobox')[2]);
  await user.click(within(activePanel).getByText('Add new "Toolbox"'));

  const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
  await user.type(nameInput, 'My Toolbox Name');

  const OpenAPIURLInput = within(activePanel).getByPlaceholderText('The URL of OpenAPI specification file');
  await user.type(OpenAPIURLInput, 'https://api.mytoolbox.com/openapi.json');

  mockValidateForm.mockResolvedValue({
    name: 'My Toolbox Name',
    openapi_url: 'https://api.mytoolbox.com/openapi.json',
    openapi_auth: null,
    uuid: 'test-uuid-toolbox-789',
  });

  mockData.push({
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
  });

  mockRefetch.mockResolvedValue({ data: mockData });
  await user.click(within(activePanel).getByRole('button', { name: 'Save' }));

  await waitFor(async () => {
    // check if the previous form is able to presist the user input
    const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
    expect(nameInput).toHaveValue('My Anthropic Agent');
    expect(within(activePanel).getByText('My Anthropic LLM')).toBeInTheDocument();
    expect(within(activePanel).getByText('My Toolbox Name')).toBeInTheDocument();
  });
};

describe('UserProperty Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = [];
    mockIsLoading = false;
    mockRefetch.mockReset().mockResolvedValue({ data: mockData });
    mockGetModels.mockReset().mockResolvedValue([]);
    mockValidateForm.mockReset();
    mockAddUserModels.mockReset();
  });

  it('should persist user-filled form data when pressing cancel in the resume flow', async () => {
    const { user } = await setupComponent();
    const activePanel = getActiveTabPanel();

    const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
    await user.type(nameInput, 'Test Name');
    await user.click(within(activePanel).getAllByRole('combobox')[1]);
    await user.click(within(activePanel).getByText('Add new "LLM"'));

    await waitFor(() => expect(within(activePanel).getByText('Select LLM')).toBeInTheDocument());

    await user.click(within(activePanel).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(within(activePanel).getByText('AssistantAgent')).toBeInTheDocument();
      expect(within(activePanel).getByText('LLM')).toBeInTheDocument();
      expect(nameInput).toHaveValue('Test Name');
    });
  });

  it('should create an agent with dependent properties', async () => {
    const { user } = await setupComponent();
    const activePanel = getActiveTabPanel();

    const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
    await user.type(nameInput, 'My Anthropic Agent');

    await createLLM(user);
    await createToolbox(user);

    // Create Agent
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

    mockData.push({
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
    });

    mockRefetch.mockResolvedValue({ data: mockData });
    await user.click(within(activePanel).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(within(activePanel).getByText('ADD AGENT')).toBeInTheDocument();
      expect(within(activePanel).getByText('My Anthropic Agent')).toBeInTheDocument();
      expect(within(activePanel).queryByText('No Agents found. Please add one.')).not.toBeInTheDocument();
    });

    await user.click(within(activePanel).getByText('My Anthropic Agent'));

    await waitFor(() => {
      expect(nameInput).toHaveValue('My Anthropic Agent');
      expect(within(activePanel).getByText('My Anthropic LLM')).toBeInTheDocument();
      expect(within(activePanel).getByText('My Toolbox Name')).toBeInTheDocument();
    });
  }, 10000);

  it('should show correct form when clicking the breadcrumbs', async () => {
    const { user } = await setupComponent();
    const activePanel = getActiveTabPanel();

    // Enter name for Agent
    const agentNameInput = within(activePanel).getByPlaceholderText('The name of the item');
    await user.type(agentNameInput, 'My Anthropic Agent');

    // Create LLM but do not save the form
    await user.click(within(activePanel).getAllByRole('combobox')[1]);
    await user.click(within(activePanel).getByText('Add new "LLM"'));
    await waitFor(() => expect(within(activePanel).getByText('Select LLM')).toBeInTheDocument());
    const llmNameInput = within(activePanel).getByPlaceholderText('The name of the item');
    await user.type(llmNameInput, 'My Anthropic LLM');

    // Check if the breadcrumbs are displayed correctly
    expect(within(activePanel).getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
    expect(within(activePanel).getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();

    // Create Secret but do not save the form
    await user.click(within(activePanel).getAllByRole('combobox')[2]);
    await user.click(within(activePanel).getByText('Add new "Secret"'));
    await waitFor(() => expect(within(activePanel).getByText('Select Secret')).toBeInTheDocument());
    expect(within(activePanel).getByText('AnthropicAPIKey')).toBeInTheDocument();

    const secretNameInput = within(activePanel).getByPlaceholderText('The name of the item');
    await user.type(secretNameInput, 'My AnthropicAPIKey Secret');

    const apiKeyInput = within(activePanel).getByPlaceholderText('The API Key from Anthropic');
    await user.type(apiKeyInput, 'My Api Key');

    // Check if the breadcrumbs are displayed correctly
    expect(within(activePanel).getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
    expect(within(activePanel).getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();
    expect(within(activePanel).getByTestId('breadcrumb-link-Secret')).toBeInTheDocument();

    // Click the last item in the breadcrumb and nothing should change in the UI
    await user.click(within(activePanel).getByTestId('breadcrumb-link-Secret'));

    await waitFor(() => {
      expect(secretNameInput).toHaveValue('My AnthropicAPIKey Secret');
      expect(apiKeyInput).toHaveValue('My Api Key');
    });

    // Click on the first item the user should be taken back to the Agent within(activePanel)
    await user.click(within(activePanel).getByTestId('breadcrumb-link-Agent'));

    await waitFor(() => {
      expect(agentNameInput).toHaveValue('My Anthropic Agent');
    });
  });

  it('Should call the update function correctly when the top level model is updated', async () => {
    // The below test checks the following:
    // 1. Click one of the existing LLM
    // 2. Changes the api_key for that LLM, and selects the 'Add new secret' option from the dropdown
    // 3. Creates a new secret key and ensures the addModel function is called
    // 4. Now saves the LLM form and ensures the updateModel function is called

    const user = userEvent.setup();
    const { BuildPageTab } = await import('../components/buildPage/BuildPageTab');

    // Mock useQuery to return llmUserProperties
    const data = _.cloneDeep(llmUserProperties);
    (useQuery as Mock).mockReturnValue({
      data: data,
      refetch: vi.fn().mockResolvedValue({ data: data }),
      isLoading: false,
    });

    renderInContext(<BuildPageTab {...mockProps} activeProperty='llm' />);
    const activePanel = getActiveTabPanel();

    // click the data-testid which starts with the regex "model-item-"
    await user.click(within(activePanel).getByTestId(/model-item-.*/));
    expect(within(activePanel).getByText('Update LLM')).toBeInTheDocument();

    // Create Secret
    await user.click(within(activePanel).getAllByRole('combobox')[0]);
    await user.click(within(activePanel).getByText('Add new "Secret"'));

    await waitFor(() => expect(within(activePanel).getByText('Select Secret')).toBeInTheDocument());
    expect(within(activePanel).getByText('AzureOAIAPIKey')).toBeInTheDocument();

    const nameInput = within(activePanel).getByPlaceholderText('The name of the item');
    await user.type(nameInput, 'My AzureOAIAPIKey Secret');

    const apiKeyInput = within(activePanel).getByPlaceholderText('The API Key from Azure OpenAI');
    await user.type(apiKeyInput, 'My Api Key');

    // Mock validateForm to return the secret form
    mockValidateForm.mockResolvedValue({
      name: 'My AzureOAIAPIKey Secret',
      api_key: 'test-api-key-12345678910', // pragma: allowlist secret
      uuid: 'test-uuid-secret-123',
    });
    data.push({
      uuid: 'test-uuid-secret-123',
      user_uuid: 'test-user-uuid-563ec0df-3ecd-4d2a',
      type_name: 'secret',
      model_name: 'AzureOAIAPIKey',
      json_str: {
        name: 'My AzureOAIAPIKey Secret',
        api_key: 'test-api-key-12345678910', // pragma: allowlist secret
      },
      created_at: '2024-08-19T11:28:32.875000Z',
      updated_at: '2024-08-19T11:28:32.875000Z',
    });
    // Mock useQuery to return llmUserProperties
    (useQuery as Mock).mockReturnValue({
      data,
      refetch: vi.fn().mockResolvedValue({ data: data }),
      isLoading: false,
    });
    // Save the secret form
    await user.click(within(activePanel).getByRole('button', { name: 'Save' }));

    // Check if the addModel function is called correctly
    expect(mockAddUserModels).toHaveBeenCalledOnce();
    expect(mockUpdateUserModels).not.toHaveBeenCalled();
    expect(within(activePanel).getByText('My AzureOAIAPIKey Secret')).toBeInTheDocument();

    // Save the LLM form
    await user.click(within(activePanel).getByRole('button', { name: 'Save' }));

    // Check if the updateModel function is called correctly
    expect(mockUpdateUserModels).toHaveBeenCalledOnce();
    expect(within(activePanel).getByText('LLM')).toBeInTheDocument();
  });
});
