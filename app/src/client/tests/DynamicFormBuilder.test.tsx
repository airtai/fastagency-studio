import { fireEvent, screen } from '@testing-library/react';
import { test, expect, describe, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { renderInContext } from 'wasp/client/test';

import DynamicFormBuilder from '../components/DynamicFormBuilder';
import { JsonSchema, SelectedModelSchema } from '../interfaces/BuildPageInterfaces';
import { validateForm } from '../services/commonService';
// import { Model } from '../interfaces/ModelInterfaces';

const setFormErrors = vi.fn();
const handleChange = vi.fn();
vi.mock('../hooks/useForm', () => ({
  useForm: () => ({
    formData: {
      model: 'gpt-3.5-turbo',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      api_type: 'openai',
    },
    handleChange,
    formErrors: {},
    setFormErrors,
  }),
}));

vi.mock('../services/commonService', () => ({
  validateForm: vi.fn(() => Promise.resolve({ success: true })),
}));

const jsonSchema: JsonSchema = {
  properties: {
    model: {
      default: 'gpt-3.5-turbo',
      description: "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
      enum: ['gpt-4', 'gpt-3.5-turbo'],
      title: 'Model',
      type: 'string',
    },
    api_key: {
      description: "The API key for the OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
      title: 'API Key',
      type: 'string',
    },
    base_url: {
      default: 'https://api.openai.com/v1',
      description: 'The base URL of the OpenAI API',
      format: 'uri',
      maxLength: 2083,
      minLength: 1,
      title: 'Base Url',
      type: 'string',
    },
    api_type: {
      const: 'openai',
      default: 'openai',
      description: "The type of the API, must be 'openai'",
      enum: ['openai'],
      title: 'API Type',
      type: 'string',
    },
  },
  required: [''],
  title: '',
  type: '',
};

const updateExistingModel: SelectedModelSchema = {
  api_key: '',
  property_name: '',
  property_type: '',
  user_id: 1,
  uuid: '',
};

describe('DynamicFormBuilder', () => {
  test('renders form fields correctly', () => {
    renderInContext(
      <DynamicFormBuilder
        property_type='secret'
        jsonSchema={jsonSchema}
        validationURL='https://some-domain/some-route'
        updateExistingModel={updateExistingModel}
        onSuccessCallback={vi.fn()}
        onCancelCallback={vi.fn()}
        onDeleteCallback={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Base Url')).toBeInTheDocument();
    expect(screen.queryByLabelText('API Type')).toBe(null);
  });
  test('handles form submission successfully', async () => {
    const onSuccessCallback = vi.fn();
    renderInContext(
      <DynamicFormBuilder
        property_type='secret'
        jsonSchema={jsonSchema}
        validationURL='https://some-domain/some-route'
        updateExistingModel={updateExistingModel}
        onSuccessCallback={onSuccessCallback}
        onCancelCallback={vi.fn()}
        onDeleteCallback={vi.fn()}
      />
    );

    const submitButton = screen.getByTestId('form-submit-button');
    await act(async () => {
      await fireEvent.click(submitButton);
    });

    expect(onSuccessCallback).toHaveBeenCalled();
  });

  test('displays validation errors next to form fields', async () => {
    const validationErrorMessage = 'This field is required';
    // Mock validateForm to simulate an API error response
    vi.mocked(validateForm).mockRejectedValueOnce(
      new Error(
        JSON.stringify([
          {
            type: 'string_type',
            loc: ['body', 'api_key'],
            msg: validationErrorMessage,
            input: 1,
            url: 'https://errors.pydantic.dev/2.7/v/string_type',
          },
        ])
      )
    );

    const onSuccessCallback = vi.fn();
    renderInContext(
      <DynamicFormBuilder
        property_type='secret'
        jsonSchema={jsonSchema}
        validationURL='https://some-domain/some-route'
        updateExistingModel={updateExistingModel}
        onSuccessCallback={onSuccessCallback}
        onCancelCallback={vi.fn()}
        onDeleteCallback={vi.fn()}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('form-submit-button'));
    });

    expect(onSuccessCallback).not.toHaveBeenCalled();
    expect(setFormErrors).toHaveBeenCalledWith({
      api_key: 'This field is required', // pragma: allowlist secret
    });
  });
  test('handles field changes', async () => {
    renderInContext(
      <DynamicFormBuilder
        property_type='secret'
        jsonSchema={jsonSchema}
        validationURL='https://some-domain/some-route'
        updateExistingModel={updateExistingModel}
        onSuccessCallback={vi.fn()}
        onCancelCallback={vi.fn()}
        onDeleteCallback={vi.fn()}
      />
    );

    const input = screen.getByLabelText('API Key');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'new-key' } });
    });

    expect(handleChange).toHaveBeenCalledWith('api_key', 'new-key');
  });
});
