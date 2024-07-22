import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';
import { BrowserRouter as Router } from 'react-router-dom';
import _ from 'lodash';

import { useQuery } from 'wasp/client/operations';

import UserPropertyHandler, { getTargetModel } from '../components/buildPage/UserPropertyHandler';

describe('getTargetModel', () => {
  const schemas = [
    {
      name: 'Anthropic',
      json_schema: {
        $defs: {
          AnthropicAPIKeyRef: {
            properties: {
              type: {
                const: 'secret',
                default: 'secret',
                description: 'The name of the type of the data',
                enum: ['secret'],
                title: 'Type',
                type: 'string',
              },
              name: {
                const: 'AnthropicAPIKey',
                default: 'AnthropicAPIKey',
                description: 'The name of the data',
                enum: ['AnthropicAPIKey'],
                title: 'Name',
                type: 'string',
              },
              uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
            },
            required: ['uuid'],
            title: 'AnthropicAPIKeyRef',
            type: 'object',
          },
        },
        properties: {
          name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
          model: {
            default: 'claude-3-5-sonnet-20240620',
            description: "The model to use for the Anthropic API, e.g. 'claude-3-5-sonnet-20240620'",
            enum: [
              'claude-3-5-sonnet-20240620',
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
            ],
            title: 'Model',
            type: 'string',
          },
          api_key: { $ref: '#/$defs/AnthropicAPIKeyRef' },
          base_url: {
            default: 'https://api.anthropic.com/v1',
            description: 'The base URL of the Anthropic API',
            format: 'uri',
            maxLength: 2083,
            minLength: 1,
            title: 'Base Url',
            type: 'string',
          },
          api_type: {
            const: 'anthropic',
            default: 'anthropic',
            description: "The type of the API, must be 'anthropic'",
            enum: ['anthropic'],
            title: 'API Type',
            type: 'string',
          },
          temperature: {
            default: 0.8,
            description: 'The temperature to use for the model, must be between 0 and 2',
            maximum: 2,
            minimum: 0,
            title: 'Temperature',
            type: 'number',
          },
        },
        required: ['name', 'api_key'],
        title: 'Anthropic',
        type: 'object',
      },
    },
    {
      name: 'AzureOAI',
      json_schema: {
        $defs: {
          AzureOAIAPIKeyRef: {
            properties: {
              type: {
                const: 'secret',
                default: 'secret',
                description: 'The name of the type of the data',
                enum: ['secret'],
                title: 'Type',
                type: 'string',
              },
              name: {
                const: 'AzureOAIAPIKey',
                default: 'AzureOAIAPIKey',
                description: 'The name of the data',
                enum: ['AzureOAIAPIKey'],
                title: 'Name',
                type: 'string',
              },
              uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
            },
            required: ['uuid'],
            title: 'AzureOAIAPIKeyRef',
            type: 'object',
          },
        },
        properties: {
          name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
          model: {
            default: 'gpt-3.5-turbo',
            description: "The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'",
            title: 'Model',
            type: 'string',
          },
          api_key: { $ref: '#/$defs/AzureOAIAPIKeyRef' },
          base_url: {
            default: 'https://api.openai.com/v1',
            description: 'The base URL of the Azure OpenAI API',
            format: 'uri',
            maxLength: 2083,
            minLength: 1,
            title: 'Base Url',
            type: 'string',
          },
          api_type: {
            const: 'azure',
            default: 'azure',
            description: "The type of the API, must be 'azure'",
            enum: ['azure'],
            title: 'API type',
            type: 'string',
          },
          api_version: {
            default: '2024-02-01',
            description: "The version of the Azure OpenAI API, e.g. '2024-02-01'",
            enum: [
              '2023-05-15',
              '2023-06-01-preview',
              '2023-10-01-preview',
              '2024-02-15-preview',
              '2024-03-01-preview',
              '2024-04-01-preview',
              '2024-05-01-preview',
              '2024-02-01',
            ],
            title: 'Api Version',
            type: 'string',
          },
          temperature: {
            default: 0.8,
            description: 'The temperature to use for the model, must be between 0 and 2',
            maximum: 2,
            minimum: 0,
            title: 'Temperature',
            type: 'number',
          },
        },
        required: ['name', 'api_key'],
        title: 'AzureOAI',
        type: 'object',
      },
    },
  ];
  it('should return the correct model', () => {
    const selectedModel = 'AzureOAI';
    const key = 'api_key';
    const targetModel = getTargetModel(schemas, selectedModel, key);
    const expected = 'AzureOAIAPIKey';
    expect(targetModel).toEqual(expected);
  });
  it('should return the correct model - By removing ref from the end', () => {
    const test_schemas = _.cloneDeep(schemas);
    test_schemas[1].json_schema.properties.api_key.$ref = '#/$defs/AzureRefOAIAPIKeyRef';
    const selectedModel = 'AzureOAI';
    const key = 'api_key';
    const targetModel = getTargetModel(test_schemas, selectedModel, key);
    const expected = 'AzureRefOAIAPIKey';
    expect(targetModel).toEqual(expected);
  });
  it('should return the empty string when no model is matched', () => {
    const test_schemas = _.cloneDeep(schemas);
    const selectedModel = 'InvalidModel';
    const key = 'api_key';
    const targetModel = getTargetModel(test_schemas, selectedModel, key);
    const expected = '';
    expect(targetModel).toEqual(expected);
  });
  it('should return the empty strign if the model contains anyOf or allOf', () => {
    const test_schemas = _.cloneDeep(schemas);
    test_schemas[1].json_schema.properties.api_key = {
      // @ts-ignore
      anyOf: [
        {
          $ref: '#/$defs/AzureRefOAIAPIKeyRef',
        },
        {
          type: 'null',
        },
      ],
    };
    const selectedModel = 'AzureOAI';
    const key = 'api_key';
    const targetModel = getTargetModel(test_schemas, selectedModel, key);
    const expected = '';
    expect(targetModel).toEqual(expected);
  });
});

// Mock the required hooks and components
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
}));

vi.mock('../components/CustomBreadcrumb', () => ({
  default: ({ pageName }: { pageName: string }) => <div data-testid='custom-breadcrumb'>{pageName}</div>,
}));

vi.mock('../components/ModelsList', () => ({
  default: ({ onSelectModel }: { onSelectModel: (index: number) => void }) => (
    <div data-testid='models-list'>
      <button onClick={() => onSelectModel(0)}>Select Model 1</button>
      <button onClick={() => onSelectModel(1)}>Select Model 2</button>
    </div>
  ),
}));

vi.mock('../components/ModelForm', () => ({
  default: ({
    selectedModel,
    onModelChange,
    onCancelCallback,
  }: {
    selectedModel: string;
    onModelChange: (model: string) => void;
    onCancelCallback: (event: React.FormEvent) => void;
  }) => (
    <div data-testid='model-form'>
      <span>{selectedModel}</span>
      <button onClick={() => onModelChange('NewModel')}>Change Model</button>
      <button onClick={(e) => onCancelCallback(e as React.FormEvent)}>Cancel</button>
    </div>
  ),
}));

vi.mock('../components/CustomSidebar', () => ({
  navLinkItems: [{ componentName: 'testProperty', label: 'Test Property' }],
}));

vi.mock('../components/Button', () => ({
  default: ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button onClick={onClick} data-testid='add-button'>
      {label}
    </button>
  ),
}));

vi.mock('../admin/common/Loader', () => ({
  default: () => <div data-testid='loader'>Loader</div>,
}));

vi.mock('../components/NotificationBox', () => ({
  default: ({ message }: { message: string }) => <div data-testid='notification-box'>{message}</div>,
}));

describe('UserPropertyHandler Initial Rendering', () => {
  const mockProps = {
    data: {
      schemas: [{ name: 'TestSchema' }],
      name: 'testProperty',
    },
    togglePropertyList: false,
  };

  it('renders without crashing', () => {
    render(
      <Router>
        <UserPropertyHandler {...mockProps} />
      </Router>
    );
    expect(screen.getByTestId('custom-breadcrumb')).toBeDefined();
  });
  it('displays "Add [propertyHeader]" button when showAddModel is false', () => {
    render(
      <Router>
        <UserPropertyHandler {...mockProps} />
      </Router>
    );
    expect(screen.getByText('Add TestProperty')).toBeDefined();
  });
  it('renders ModelsList when showAddModel is false', () => {
    render(
      <Router>
        <UserPropertyHandler {...mockProps} />
      </Router>
    );
    expect(screen.getByTestId('models-list')).toBeDefined();
  });
  it('does not render ModelForm initially', () => {
    render(
      <Router>
        <UserPropertyHandler {...mockProps} />
      </Router>
    );
    expect(screen.queryByTestId('model-form')).toBeNull();
  });
  describe('UserPropertyHandler State Management', () => {
    it('initializes selectedModel with the first schema name', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      // We can't directly access component state, so we'll check if ModelForm (when shown) has the correct selectedModel
      fireEvent.click(screen.getByTestId('add-button'));
      expect(screen.getByTestId('model-form')).toHaveTextContent('TestSchema');
    });
    it('changes showAddModel state when the Add button is clicked', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      // Initially, ModelForm should not be visible
      expect(screen.queryByTestId('model-form')).toBeNull();

      // Click the Add button
      fireEvent.click(screen.getByTestId('add-button'));

      // Now, ModelForm should be visible
      expect(screen.getByTestId('model-form')).toBeDefined();
    });
    it('initializes updateExistingModel as null', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      // Click the Add button to show ModelForm
      fireEvent.click(screen.getByTestId('add-button'));

      // If updateExistingModel is null, ModelForm should only show the initial selectedModel
      // and not any pre-filled data from an existing model
      const modelForm = screen.getByTestId('model-form');
      expect(modelForm).toHaveTextContent('TestSchema');

      // Check that the ModelForm doesn't contain any unexpected model data
      expect(modelForm).not.toHaveTextContent('Model1');
      expect(modelForm).not.toHaveTextContent('Model2');

      // Verify the presence of the buttons without checking their exact text
      expect(modelForm.querySelector('button')).toBeTruthy();
    });
  });
  describe('UserPropertyHandler User Interactions', () => {
    const mockProps = {
      data: {
        schemas: [{ name: 'TestSchema' }],
        name: 'testProperty',
      },
      togglePropertyList: false,
    };

    it('shows ModelForm when Add button is clicked (handleClick function)', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      expect(screen.queryByTestId('model-form')).toBeNull();
      fireEvent.click(screen.getByTestId('add-button'));
      expect(screen.getByTestId('model-form')).toBeDefined();
    });

    it('updates selectedModel state when handleModelChange is called', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      fireEvent.click(screen.getByTestId('add-button'));
      expect(screen.getByTestId('model-form')).toHaveTextContent('TestSchema');

      fireEvent.click(screen.getByText('Change Model'));
      expect(screen.getByTestId('model-form')).toHaveTextContent('NewModel');
    });

    it('calls updateSelectedModel when a model is selected from the list', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      fireEvent.click(screen.getByText('Select Model 2'));
      expect(screen.getByTestId('model-form')).toBeDefined();
      expect(screen.getByTestId('model-form')).toHaveTextContent('Model2');
    });

    it('sets showAddModel to false when onCancelCallback is called', () => {
      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      fireEvent.click(screen.getByTestId('add-button'));
      expect(screen.getByTestId('model-form')).toBeDefined();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('model-form')).toBeNull();
    });
  });
  describe('UserPropertyHandler Conditional Rendering', () => {
    const mockProps = {
      data: {
        schemas: [{ name: 'TestSchema' }],
        name: 'testProperty',
      },
      togglePropertyList: false,
    };

    it('shows ModelsList when showAddModel is false', () => {
      (useQuery as Mock).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });

      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      expect(screen.getByTestId('models-list')).toBeDefined();
      expect(screen.queryByTestId('model-form')).toBeNull();
    });

    it('shows ModelForm when showAddModel is true', () => {
      (useQuery as Mock).mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() });

      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      fireEvent.click(screen.getByTestId('add-button'));

      expect(screen.queryByTestId('models-list')).toBeNull();
      expect(screen.getByTestId('model-form')).toBeDefined();
    });
  });
});
