import React from 'react';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderInContext } from 'wasp/client/test';
import { validateForm } from 'wasp/client/operations';
import * as operations from 'wasp/client/operations';

import { DynamicForm } from '../components/buildPage/DynamicForm';
import { ListOfSchemas } from '../interfaces/BuildPageInterfacesNew';

// Mock the validateForm function
vi.mock('wasp/client/operations', () => ({
  validateForm: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields based on the AnthropicAPIKey schema', () => {
    renderInContext(
      <DynamicForm
        propertySchemasList={mockPropertySchemasList}
        modelName='AnthropicAPIKey'
        setModelName={vi.fn()}
        refetchUserOwnedProperties={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Api Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('The name of the item')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('The API Key from Anthropic')).toBeInTheDocument();
  });

  it('submits the form with valid data for AnthropicAPIKey', async () => {
    renderInContext(
      <DynamicForm
        propertySchemasList={mockPropertySchemasList}
        modelName='AnthropicAPIKey'
        setModelName={vi.fn()}
        refetchUserOwnedProperties={vi.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText('Name'), 'My Anthropic Key');
    await userEvent.type(screen.getByLabelText('Api Key'), 'anthropic-api-key-123');

    const submitButton = screen.getByTestId('form-submit-button');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(validateForm).toHaveBeenCalledWith({
        data: { name: 'My Anthropic Key', api_key: 'anthropic-api-key-123' }, // pragma: allowlist secret
        validationURL: 'models/secret/AnthropicAPIKey/validate',
        isSecretUpdate: false,
      });
    });
  });

  it('displays validation errors', async () => {
    const mockError = {
      message: JSON.stringify([{ loc: ['name'], msg: 'Name is required', type: 'value_error' }]),
    };

    // Use vi.mocked to properly type the mock function
    vi.mocked(operations.validateForm).mockRejectedValue(mockError);

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        propertySchemasList={mockPropertySchemasList}
        modelName='AnthropicAPIKey'
        setModelName={vi.fn()}
        refetchUserOwnedProperties={vi.fn()}
      />
    );

    const submitButton = screen.getByTestId('form-submit-button');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    });
  });

  it('resets the form when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const setModelName = vi.fn();
    renderInContext(
      <DynamicForm
        propertySchemasList={mockPropertySchemasList}
        modelName='AnthropicAPIKey'
        setModelName={setModelName}
        refetchUserOwnedProperties={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText('Name'), 'My Anthropic Key');
    await user.type(screen.getByLabelText('Api Key'), 'anthropic-api-key-123');

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Api Key')).toHaveValue('');
    expect(setModelName).toHaveBeenCalledWith(null);
  });

  it('masks the API key input', () => {
    renderInContext(
      <DynamicForm
        propertySchemasList={mockPropertySchemasList}
        modelName='AnthropicAPIKey'
        setModelName={vi.fn()}
        refetchUserOwnedProperties={vi.fn()}
      />
    );

    const apiKeyInput = screen.getByLabelText('Api Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  // it('handles non-JSON error responses', async () => {
  //   const mockError = new Error('Network error');

  //   // Use vi.mocked to properly type the mock function
  //   vi.mocked(operations.validateForm).mockRejectedValue(mockError);

  //   const user = userEvent.setup();

  //   renderInContext(<DynamicForm propertySchemasList={mockPropertySchemasList} modelName="AnthropicAPIKey" />);

  //   await user.type(screen.getByLabelText('Name'), 'My Anthropic Key');
  //   await user.type(screen.getByLabelText('Api Key'), 'anthropic-api-key-123');

  //   const submitButton = screen.getByTestId('form-submit-button');
  //   await user.click(submitButton);

  //   // This test ensures that the component doesn't crash on non-JSON errors
  //   // You might want to add an assertion here to check for a specific behavior,
  //   // such as displaying a generic error message to the user
  // });
});
