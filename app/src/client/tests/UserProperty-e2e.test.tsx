import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, RenderResult } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { renderInContext } from 'wasp/client/test';
import { useQuery } from 'wasp/client/operations';
import { mockProps } from './mocks';

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

vi.mock('wasp/client/operations', () => ({
  useQuery: vi.fn(() => ({
    data: mockData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  })),
  getModels: (...args: any[]) => mockGetModels(...args),
  validateForm: (...args: any[]) => mockValidateForm(...args),
  addUserModels: (...args: any[]) => mockAddUserModels(...args),
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
  await user.type(screen.getByLabelText('Name'), 'My AnthropicAPIKey Secret');
  await user.type(screen.getByLabelText('Api Key'), 'My Api Key');

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
  });

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
    await user.type(screen.getByLabelText('Api Key'), 'My Api Key');

    // Check if the breadcrumbs are displayed correctly
    expect(screen.getByTestId('breadcrumb-link-Agent')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-link-LLM')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-link-Secret')).toBeInTheDocument();

    // Click the last item in the breadcrumb and nothing should change in the UI
    await user.click(screen.getByTestId('breadcrumb-link-Secret'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('My AnthropicAPIKey Secret');
      expect(screen.getByLabelText('Api Key')).toHaveValue('My Api Key');
    });

    // Click on the first item the user should be taken back to the Agent screen
    await user.click(screen.getByTestId('breadcrumb-link-Agent'));

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveValue('My Anthropic Agent');
    });
  }, 10000);
});
