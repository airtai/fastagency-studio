import React from 'react';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderInContext } from 'wasp/client/test';
import { validateForm } from 'wasp/client/operations';

import * as operations from 'wasp/client/operations';

import { DynamicForm } from '../components/buildPage/DynamicForm';
import { ListOfSchemas } from '../interfaces/BuildPageInterfacesNew';
import { PropertySchemaParser } from '../components/buildPage/PropertySchemaParser';

// Mock the operation
vi.mock('wasp/client/operations', () => ({
  validateForm: vi.fn(),
  addUserModels: vi.fn(),
}));

const mockPropertySchemasList: ListOfSchemas = {
  name: 'secret',
  schemas: [
    {
      name: 'AnthropicAPIKey',
      json_schema: {
        properties: {
          name: {
            description: 'The name of the item',
            minLength: 1,
            title: 'Name',
            type: 'string',
          },
          api_key: {
            description: 'The API Key from Anthropic',
            title: 'Api Key',
            type: 'string',
          },
        },
        required: ['name', 'api_key'],
        title: 'AnthropicAPIKey',
        type: 'object',
      },
    },
    {
      name: 'AzureOAIAPIKey',
      json_schema: {
        properties: {
          name: {
            description: 'The name of the item',
            minLength: 1,
            title: 'Name',
            type: 'string',
          },
          api_key: {
            description: 'The API Key from Azure OpenAI',
            title: 'Api Key',
            type: 'string',
          },
        },
        required: ['name', 'api_key'],
        title: 'AzureOAIAPIKey',
        type: 'object',
      },
    },
  ],
};

describe('DynamicForm', () => {
  it('renders form fields based on the AnthropicAPIKey schema and handles submission', async () => {
    const parser = new PropertySchemaParser(mockPropertySchemasList);
    parser.setActiveModel('AnthropicAPIKey');
    const mockSetActiveModel = vi.fn();
    const mockRefetchUserOwnedProperties = vi.fn();

    vi.mocked(operations.validateForm).mockResolvedValue({});
    vi.mocked(operations.addUserModels).mockResolvedValue({});

    renderInContext(
      <DynamicForm
        parser={parser}
        setActiveModel={mockSetActiveModel}
        refetchUserOwnedProperties={mockRefetchUserOwnedProperties}
      />
    );

    // Check if form fields are rendered
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Api Key')).toBeInTheDocument();

    // Fill out the form
    await userEvent.type(screen.getByLabelText('Name'), 'Test Name');
    await userEvent.type(screen.getByLabelText('Api Key'), 'test-api-key');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(submitButton);

    // Check if validation and submission occurred
    expect(operations.validateForm).toHaveBeenCalled();
    expect(operations.addUserModels).toHaveBeenCalled();

    // Check if the form was reset and properties were refetched
    expect(mockSetActiveModel).toHaveBeenCalledWith(null);
    expect(mockRefetchUserOwnedProperties).toHaveBeenCalled();
  });

  it('renders form fields and handles successful submission', async () => {
    const parser = new PropertySchemaParser(mockPropertySchemasList);
    parser.setActiveModel('AnthropicAPIKey');
    const mockSetActiveModel = vi.fn();
    const mockRefetchUserOwnedProperties = vi.fn();

    vi.mocked(operations.validateForm).mockResolvedValue({});
    vi.mocked(operations.addUserModels).mockResolvedValue({});

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        parser={parser}
        setActiveModel={mockSetActiveModel}
        refetchUserOwnedProperties={mockRefetchUserOwnedProperties}
      />
    );

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Api Key')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'Test Name');
    await user.type(screen.getByLabelText('Api Key'), 'test-api-key');

    const submitButton = screen.getByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(operations.validateForm).toHaveBeenCalled();
      expect(operations.addUserModels).toHaveBeenCalled();
      expect(mockSetActiveModel).toHaveBeenCalledWith(null);
      expect(mockRefetchUserOwnedProperties).toHaveBeenCalled();
    });
  });

  it('handles form submission failure due to validation error', async () => {
    const parser = new PropertySchemaParser(mockPropertySchemasList);
    parser.setActiveModel('AnthropicAPIKey');
    const mockSetActiveModel = vi.fn();
    const mockRefetchUserOwnedProperties = vi.fn();

    const mockError = {
      message: JSON.stringify([{ loc: ['name'], msg: 'Name is required', type: 'value_error' }]),
    };

    vi.mocked(operations.validateForm).mockRejectedValue(mockError);

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        parser={parser}
        setActiveModel={mockSetActiveModel}
        refetchUserOwnedProperties={mockRefetchUserOwnedProperties}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    });

    expect(mockSetActiveModel).not.toHaveBeenCalled();
    expect(mockRefetchUserOwnedProperties).not.toHaveBeenCalled();
  });

  it('calls handleCancel when cancel button is clicked', async () => {
    const parser = new PropertySchemaParser(mockPropertySchemasList);
    parser.setActiveModel('AnthropicAPIKey');
    const mockSetActiveModel = vi.fn();
    const mockRefetchUserOwnedProperties = vi.fn();

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        parser={parser}
        setActiveModel={mockSetActiveModel}
        refetchUserOwnedProperties={mockRefetchUserOwnedProperties}
      />
    );

    await user.type(screen.getByLabelText('Name'), 'Test Name');
    await user.type(screen.getByLabelText('Api Key'), 'test-api-key');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Api Key')).toHaveValue('');
    expect(mockSetActiveModel).toHaveBeenCalledWith(null);
  });

  it('masks the API key input', () => {
    const parser = new PropertySchemaParser(mockPropertySchemasList);
    parser.setActiveModel('AnthropicAPIKey');
    const mockSetActiveModel = vi.fn();
    const mockRefetchUserOwnedProperties = vi.fn();

    renderInContext(
      <DynamicForm
        parser={parser}
        setActiveModel={mockSetActiveModel}
        refetchUserOwnedProperties={mockRefetchUserOwnedProperties}
      />
    );

    const apiKeyInput = screen.getByLabelText('Api Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });
});
