import React from 'react';

import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderInContext } from 'wasp/client/test';

import * as operations from 'wasp/client/operations';

import { DynamicForm } from '../components/buildPage/DynamicForm';
import { PropertySchemaParser } from '../components/buildPage/PropertySchemaParser';
import { mockPropertieSchemas } from './mocks';

// Mock the operation
vi.mock('wasp/client/operations', () => ({
  validateForm: vi.fn(),
  addUserModels: vi.fn(),
}));

describe('DynamicForm', () => {
  const mockUpdateFormStack = vi.fn();
  const mockRefetchUserProperties = vi.fn();
  const mockPopFromStack = vi.fn();
  mockRefetchUserProperties.mockResolvedValue({
    data: {
      userProperties: [],
    },
  });

  it('renders form fields based on the AnthropicAPIKey schema and handles submission', async () => {
    const activeProperty = 'secret';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('AnthropicAPIKey');

    vi.mocked(operations.validateForm).mockResolvedValue({});
    vi.mocked(operations.addUserModels).mockResolvedValue({});

    renderInContext(
      <DynamicForm
        parser={parser}
        updateFormStack={mockUpdateFormStack}
        refetchUserProperties={mockRefetchUserProperties}
        popFromStack={mockPopFromStack}
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
    expect(mockUpdateFormStack).toHaveBeenCalledWith(null);
    expect(mockRefetchUserProperties).toHaveBeenCalled();
  });

  it('renders form fields and handles successful submission', async () => {
    const activeProperty = 'secret';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('AnthropicAPIKey');

    vi.mocked(operations.validateForm).mockResolvedValue({});
    vi.mocked(operations.addUserModels).mockResolvedValue({});

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        parser={parser}
        updateFormStack={mockUpdateFormStack}
        refetchUserProperties={mockRefetchUserProperties}
        popFromStack={mockPopFromStack}
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
      expect(mockUpdateFormStack).toHaveBeenCalledWith(null);
      expect(mockRefetchUserProperties).toHaveBeenCalled();
    });
  });

  it('handles form submission failure due to validation error', async () => {
    const activeProperty = 'secret';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('AnthropicAPIKey');
    const mockUpdateFormStack = vi.fn();
    const mockRefetchUserProperties = vi.fn();

    const mockError = {
      message: JSON.stringify([{ loc: ['name'], msg: 'Name is required', type: 'value_error' }]),
    };

    vi.mocked(operations.validateForm).mockRejectedValue(mockError);

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        parser={parser}
        updateFormStack={mockUpdateFormStack}
        refetchUserProperties={mockRefetchUserProperties}
        popFromStack={mockPopFromStack}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    });

    expect(mockUpdateFormStack).not.toHaveBeenCalled();
    expect(mockRefetchUserProperties).not.toHaveBeenCalled();
  });

  it('calls handleCancel when cancel button is clicked', async () => {
    const activeProperty = 'secret';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('AnthropicAPIKey');
    const mockUpdateFormStack = vi.fn();
    const mockRefetchUserProperties = vi.fn();
    const mockPopFromStack = vi.fn();

    const user = userEvent.setup();

    renderInContext(
      <DynamicForm
        parser={parser}
        updateFormStack={mockUpdateFormStack}
        refetchUserProperties={mockRefetchUserProperties}
        popFromStack={mockPopFromStack}
      />
    );

    await user.type(screen.getByLabelText('Name'), 'Test Name');
    await user.type(screen.getByLabelText('Api Key'), 'test-api-key');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Api Key')).toHaveValue('');
    expect(mockUpdateFormStack).toHaveBeenCalledWith(null);
  });

  it('masks the API key input', () => {
    const activeProperty = 'secret';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('AnthropicAPIKey');
    const mockUpdateFormStack = vi.fn();
    const mockRefetchUserProperties = vi.fn();
    const mockPopFromStack = vi.fn();

    renderInContext(
      <DynamicForm
        parser={parser}
        updateFormStack={mockUpdateFormStack}
        refetchUserProperties={mockRefetchUserProperties}
        popFromStack={mockPopFromStack}
      />
    );

    const apiKeyInput = screen.getByLabelText('Api Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });
});
