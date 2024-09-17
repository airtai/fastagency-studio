import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { screen, waitFor, prettyDOM } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { renderInContext } from 'wasp/client/test';
import { useQuery } from 'wasp/client/operations';
import { deploymentUserProperties, llmUserProperties, mockProps } from './mocks';
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

// Helper functions
const setupComponent = async (): Promise<{ user: UserEvent; container: HTMLElement }> => {
  const user = userEvent.setup();
  const { UserProperty } = await import('../components/buildPage/UserProperty');
  const renderResult = renderInContext(<UserProperty {...mockProps} activeProperty='agent' />);
  await user.click(screen.getByText('Add Agent'));
  await waitFor(() => {
    expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
    expect(screen.getByText('LLM')).toBeInTheDocument();
  });
  return { user, ...renderResult };
};

const createSecret = async (user: UserEvent): Promise<void> => {
  await user.click(screen.getAllByRole('combobox')[2]);
  await user.click(screen.getByText('Add new "Secret"'));
  await waitFor(() => expect(screen.getByText('Select Secret')).toBeInTheDocument());
  expect(screen.getByText('AnthropicAPIKey')).toBeInTheDocument();

  // Check Api Key Tooltip
  const apiKeyTooltip = screen.getByTestId('api_key-tooltip');
  await user.hover(apiKeyTooltip);
  await waitFor(() => {
    expect(
      screen.getByText('The API key specified here will be used to authenticate requests to Anthropic services.')
    ).toBeInTheDocument();
  });

  await user.type(screen.getByLabelText('Name'), 'My AnthropicAPIKey Secret');
  await user.type(screen.getByLabelText('API Key'), 'My Api Key');

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
  expect(screen.getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
  expect(screen.getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();
  expect(screen.getByTestId('breadcrumb-link-Secret')).toBeInTheDocument();

  // Save the form
  await user.click(screen.getByRole('button', { name: 'Save' }));

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
};

const createLLM = async (user: UserEvent): Promise<void> => {
  await user.click(screen.getAllByRole('combobox')[1]);
  await user.click(screen.getByText('Add new "LLM"'));
  await waitFor(() => expect(screen.getByText('Select LLM')).toBeInTheDocument());
  await user.type(screen.getByLabelText('Name'), 'My Anthropic LLM');

  // Check tooltips
  const tooltips = {
    api_key: 'Choose the API key that will be used to authenticate requests to Anthropic services.', // pragma: allowlist secret
    model: 'Choose the model that the LLM should use to generate responses.',
    base_url: 'The base URL that the LLM uses to interact with Anthropic services.',
    temperature:
      'Adjust the temperature to change the response style. Lower values lead to more consistent answers, while higher values make the responses more creative. The values must be between 0 and 2.',
  };

  // Check Tooltips
  for (const [key, value] of Object.entries(tooltips)) {
    const tooltip = screen.getByTestId(`${key}-tooltip`);
    await user.hover(tooltip);
    await waitFor(() => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  }

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
  expect(screen.getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
  expect(screen.getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();

  // Save the form
  await user.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(async () => {
    expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
    expect(screen.getByText('LLM')).toBeInTheDocument();

    expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic Agent');
    expect(screen.getByText('My Anthropic LLM')).toBeInTheDocument();
    await user.click(screen.getAllByRole('combobox')[1]);
    expect(screen.getByRole('listbox').children.length).toBe(2);
  });
};

const createToolbox = async (user: UserEvent): Promise<void> => {
  await user.click(screen.getAllByRole('combobox')[2]);
  await user.click(screen.getByText('Add new "Toolbox"'));
  await user.type(screen.getByLabelText('Name'), 'My Toolbox Name');
  await user.type(screen.getByLabelText('OpenAPI URL'), 'https://api.mytoolbox.com/openapi.json');

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
  await user.click(screen.getByRole('button', { name: 'Save' }));

  await waitFor(async () => {
    // check if the previous form is able to presist the user input
    expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic Agent');
    expect(screen.getByText('My Anthropic LLM')).toBeInTheDocument();
    expect(screen.getByText('My Toolbox Name')).toBeInTheDocument();
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

    await user.type(screen.getByLabelText('Name'), 'Test Name');
    await user.click(screen.getAllByRole('combobox')[1]);
    await user.click(screen.getByText('Add new "LLM"'));

    await waitFor(() => expect(screen.getByText('Select LLM')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.getByText('AssistantAgent')).toBeInTheDocument();
      expect(screen.getByText('LLM')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('Test Name');
    });
  });

  it('should create an agent with dependent properties', async () => {
    const { user } = await setupComponent();

    await user.type(screen.getByLabelText('Name'), 'My Anthropic Agent');

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
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Add Agent')).toBeInTheDocument();
      expect(screen.getByText('My Anthropic Agent')).toBeInTheDocument();
      expect(screen.queryByText('No Agents found. Please add one.')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText('My Anthropic Agent'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic Agent');
      expect(screen.getByText('My Anthropic LLM')).toBeInTheDocument();
      expect(screen.getByText('My Toolbox Name')).toBeInTheDocument();
    });
  }, 10000);

  it('should show correct form when clicking the breadcrumbs', async () => {
    const { user } = await setupComponent();

    // Enter name for Agent
    await user.type(screen.getByLabelText('Name'), 'My Anthropic Agent');

    // Create LLM but do not save the form
    await user.click(screen.getAllByRole('combobox')[1]);
    await user.click(screen.getByText('Add new "LLM"'));
    await waitFor(() => expect(screen.getByText('Select LLM')).toBeInTheDocument());
    await user.type(screen.getByLabelText('Name'), 'My Anthropic LLM');

    // Check if the breadcrumbs are displayed correctly
    expect(screen.getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();

    // Create Secret but do not save the form
    await user.click(screen.getAllByRole('combobox')[2]);
    await user.click(screen.getByText('Add new "Secret"'));
    await waitFor(() => expect(screen.getByText('Select Secret')).toBeInTheDocument());
    expect(screen.getByText('AnthropicAPIKey')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'My AnthropicAPIKey Secret');
    await user.type(screen.getByLabelText('API Key'), 'My Api Key');

    // Check if the breadcrumbs are displayed correctly
    expect(screen.getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-link-Secret')).toBeInTheDocument();

    // Click the last item in the breadcrumb and nothing should change in the UI
    await user.click(screen.getByTestId('breadcrumb-link-Secret'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('My AnthropicAPIKey Secret');
      expect(screen.getByLabelText('API Key')).toHaveValue('My Api Key');
    });

    // Click on the first item the user should be taken back to the Agent screen
    await user.click(screen.getByTestId('breadcrumb-link-Agent'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic Agent');
    });
  });

  it('Should call the update function correctly when the top level model is updated', async () => {
    // The below test checks the following:
    // 1. Click one of the existing LLM
    // 2. Changes the api_key for that LLM, and selects the 'Add new secret' option from the dropdown
    // 3. Creates a new secret key and ensures the addModel function is called
    // 4. Now saves the LLM form and ensures the updateModel function is called

    const user = userEvent.setup();
    const { UserProperty } = await import('../components/buildPage/UserProperty');

    // Mock useQuery to return llmUserProperties
    const data = _.cloneDeep(llmUserProperties);
    (useQuery as Mock).mockReturnValue({
      data: data,
      refetch: vi.fn().mockResolvedValue({ data: data }),
      isLoading: false,
    });

    renderInContext(<UserProperty {...mockProps} activeProperty='llm' />);

    // click the data-testid which starts with the regex "model-item-"
    await user.click(screen.getByTestId(/model-item-.*/));
    expect(screen.getByText('Update LLM')).toBeInTheDocument();

    // Create Secret
    await user.click(screen.getAllByRole('combobox')[0]);
    await user.click(screen.getByText('Add new "Secret"'));
    await waitFor(() => expect(screen.getByText('Select Secret')).toBeInTheDocument());
    expect(screen.getByText('AzureOAIAPIKey')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'My AzureOAIAPIKey Secret');
    await user.type(screen.getByLabelText('API Key'), 'My Api Key');
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
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Check if the addModel function is called correctly
    expect(mockAddUserModels).toHaveBeenCalledOnce();
    expect(mockUpdateUserModels).not.toHaveBeenCalled();
    expect(screen.getByText('My AzureOAIAPIKey Secret')).toBeInTheDocument();

    // Save the LLM form
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Check if the updateModel function is called correctly
    expect(mockUpdateUserModels).toHaveBeenCalledOnce();
    expect(screen.getByText('LLM')).toBeInTheDocument();
  });

  it('Should mark specific form fields as non-editable while editing the property', async () => {
    // The below test checks the following:
    // 1. Create a new Deployment and save it
    // 2. Open the saved deployment from the list and check if the form fields "Repo Name", "Fly App Name", "GH Token" and "FLY Token" are non-editable

    const user = userEvent.setup();
    const { UserProperty } = await import('../components/buildPage/UserProperty');

    // Mock useQuery to return llmUserProperties
    const data = _.cloneDeep(deploymentUserProperties);
    (useQuery as Mock).mockReturnValue({
      data: data,
      refetch: vi.fn().mockResolvedValue({ data: data }),
      isLoading: false,
    });

    const { container } = renderInContext(<UserProperty {...mockProps} activeProperty='deployment' />);

    await user.click(screen.getByText('Add Deployment'));
    expect(screen.getByText('Add a new Deployment')).toBeInTheDocument();

    // Fill the deployment form
    await user.type(screen.getByLabelText('Name'), 'My Deployment Name');
    await user.type(screen.getByLabelText('Repo Name'), 'My Repo Name');
    await user.type(screen.getByLabelText('Fly App Name'), 'My Fly App Name');

    const mockValidateFormResponse = {
      name: 'My Deployment Name',
      team: {
        name: 'TwoAgentTeam',
        type: 'team',
        uuid: '31273537-4cd5-4437-b5d0-222e3549259f',
      },
      gh_token: {
        name: 'GitHubToken',
        type: 'secret',
        uuid: '42e34575-2029-4055-9460-3bf5e2745ddf',
      },
      fly_token: {
        name: 'FlyToken',
        type: 'secret',
        uuid: 'e94cf6f2-f82a-4513-81dc-03adfe8ca9c9',
      },
      repo_name: 'My Repo Name',
      gh_repo_url: 'https://github.com/harishmohanraj/my-deployment-name',
      fly_app_name: 'My Fly App Name',
      app_deploy_status: 'inprogress',
      uuid: 'c5e3fbc7-70e0-4abe-b512-f11c0a77d330',
    };

    mockValidateForm.mockResolvedValue(mockValidateFormResponse);

    const mockSuccessResponse = {
      uuid: 'c5e3fbc7-70e0-4abe-b512-f11c0a77d330',
      user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
      type_name: 'deployment',
      model_name: 'Deployment',
      json_str: mockValidateFormResponse,
      created_at: '2024-09-11T12:31:27.477000Z',
      updated_at: '2024-09-11T12:31:27.477000Z',
    };
    mockAddUserModels.mockResolvedValue(mockSuccessResponse);
    data.push(mockSuccessResponse);

    // Mock useQuery to return llmUserProperties
    (useQuery as Mock).mockReturnValue({
      data,
      refetch: vi.fn().mockResolvedValue({ data: data }),
      isLoading: false,
    });

    // Save the deployment form
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockAddUserModels).toHaveBeenCalledOnce();

    // check if the form submit button is disabled
    expect(screen.getByTestId('form-submit-button')).toBeDisabled();

    // check if the form fields are non-editable
    expect(screen.getByLabelText('Repo Name')).toBeDisabled();
    expect(screen.getByLabelText('Fly App Name')).toBeDisabled();
    expect(screen.getByLabelText('GH Token')).toBeDisabled();
    expect(screen.getByLabelText('Fly Token')).toBeDisabled();

    // Click on the cancel button
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Click on the deployment from the list
    await user.click(screen.getByText('My Deployment Name'));

    // Check if the form fields are non-editable
    expect(screen.getByLabelText('Repo Name')).toBeDisabled();
    expect(screen.getByLabelText('Fly App Name')).toBeDisabled();
    expect(screen.getByLabelText('GH Token')).toBeDisabled();
    expect(screen.getByLabelText('Fly Token')).toBeDisabled();

    // Check if the form submit button is enabled
    expect(screen.getByTestId('form-submit-button')).toBeEnabled();
  });
});
