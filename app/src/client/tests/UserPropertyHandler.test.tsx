import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { BrowserRouter as Router } from 'react-router-dom';
import _ from 'lodash';

import { useQuery } from 'wasp/client/operations';

import UserPropertyHandler, {
  getTargetModel,
  storeFormData,
  processFormDataStack,
  FORM_DATA_STORAGE_KEY,
} from '../components/buildPage/UserPropertyHandler';

describe('storeFormData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores form data correctly in an empty stack while updading existing model', () => {
    const propertyName = 'llm';
    const selectedModel = 'OpenAI';
    const targetPropertyName = 'secret';
    const targetModel = 'OpenAIAPIKey';
    const formData = {
      name: '',
      model: 'gpt-3.5-turbo',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      api_type: 'openai',
      temperature: 0.8,
    };
    const key = 'api_key';
    const updateExistingModel = {
      uuid: 'test-uuid',
    };
    const expectedFormData = { ...formData, ...{ uuid: 'test-uuid' } };

    storeFormData(propertyName, selectedModel, targetPropertyName, targetModel, formData, key, updateExistingModel);
    const savedFormData = localStorage.getItem('formDataStack');
    // @ts-ignore
    const storedData = JSON.parse(savedFormData);

    expect(storedData).toEqual([
      {
        source: { propertyName, selectedModel },
        target: { propertyName: targetPropertyName, selectedModel: targetModel },
        formData: expectedFormData,
        key,
      },
    ]);
  });

  it('stores form data correctly in an empty stack', () => {
    const propertyName = 'llm';
    const selectedModel = 'OpenAI';
    const targetPropertyName = 'secret';
    const targetModel = 'OpenAIAPIKey';
    const formData = {
      name: '',
      model: 'gpt-3.5-turbo',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      api_type: 'openai',
      temperature: 0.8,
    };
    const key = 'api_key';
    const updateExistingModel = null;

    storeFormData(propertyName, selectedModel, targetPropertyName, targetModel, formData, key, updateExistingModel);
    const savedFormData = localStorage.getItem('formDataStack');
    // @ts-ignore
    const storedData = JSON.parse(savedFormData);

    expect(storedData).toEqual([
      {
        source: { propertyName, selectedModel },
        target: { propertyName: targetPropertyName, selectedModel: targetModel },
        formData,
        key,
      },
    ]);
  });
  it('adds form data to an existing stack', () => {
    // Pre-existing data
    const existingData = [
      {
        source: { propertyName: 'team', selectedModel: 'TeamModel' },
        target: { propertyName: 'agent', selectedModel: 'AgentModel' },
        formData: { name: 'Team1' },
        key: 'name',
      },
    ];
    localStorage.setItem('formDataStack', JSON.stringify(existingData));

    // New data to add
    const propertyName = 'agent';
    const selectedModel = 'AgentModel';
    const targetPropertyName = 'llm';
    const targetModel = 'OpenAI';
    const formData = { name: 'Agent1' };
    const key = 'name';

    const updateExistingModel = null;

    storeFormData(propertyName, selectedModel, targetPropertyName, targetModel, formData, key, updateExistingModel);
    const savedFormData = localStorage.getItem('formDataStack');
    // @ts-ignore
    const storedData = JSON.parse(savedFormData);

    expect(storedData).toEqual([
      ...existingData,
      {
        source: { propertyName, selectedModel },
        target: { propertyName: targetPropertyName, selectedModel: targetModel },
        formData,
        key,
      },
    ]);
  });
  it('handles multiple additions to the stack', () => {
    const additions = [
      {
        propertyName: 'team',
        selectedModel: 'TeamModel',
        targetPropertyName: 'agent',
        targetModel: 'AgentModel',
        formData: { name: 'Team1' },
        key: 'name',
      },
      {
        propertyName: 'agent',
        selectedModel: 'AgentModel',
        targetPropertyName: 'llm',
        targetModel: 'OpenAI',
        formData: { name: 'Agent1' },
        key: 'name',
      },
      {
        propertyName: 'llm',
        selectedModel: 'OpenAI',
        targetPropertyName: 'secret',
        targetModel: 'OpenAIAPIKey',
        formData: { name: 'LLM1' },
        key: 'name',
      },
    ];
    const updateExistingModel = null;
    additions.forEach(({ propertyName, selectedModel, targetPropertyName, targetModel, formData, key }) => {
      storeFormData(propertyName, selectedModel, targetPropertyName, targetModel, formData, key, updateExistingModel);
    });

    const savedFormData = localStorage.getItem('formDataStack');
    // @ts-ignore
    const storedData = JSON.parse(savedFormData);

    expect(storedData).toHaveLength(3);
    expect(storedData).toEqual(
      additions.map(({ propertyName, selectedModel, targetPropertyName, targetModel, formData, key }) => ({
        source: { propertyName, selectedModel },
        target: { propertyName: targetPropertyName, selectedModel: targetModel },
        formData,
        key,
      }))
    );
  });

  it('preserves existing data when adding new items', () => {
    // Add initial data
    const updateExistingModel = null;
    storeFormData('team', 'TeamModel', 'agent', 'AgentModel', { name: 'Team1' }, 'name', updateExistingModel);

    // Add new data
    storeFormData('agent', 'AgentModel', 'llm', 'OpenAI', { name: 'Agent1' }, 'name', updateExistingModel);

    const savedFormData = localStorage.getItem('formDataStack');
    // @ts-ignore
    const storedData = JSON.parse(savedFormData);

    expect(storedData).toHaveLength(2);
    expect(storedData[0].source.propertyName).toBe('team');
    expect(storedData[1].source.propertyName).toBe('agent');
  });
});

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
  it('should return null when no model is matched', () => {
    const test_schemas = _.cloneDeep(schemas);
    const selectedModel = 'InvalidModel';
    const key = 'api_key';
    const targetModel = getTargetModel(test_schemas, selectedModel, key);
    const expected = null;
    expect(targetModel).toEqual(expected);
  });
  it('should return null if the model contains anyOf or allOf', () => {
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
    const expected = null;
    expect(targetModel).toEqual(expected);
  });
});

describe('processFormDataStack', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles empty form data stack', () => {
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify([]));

    const result = processFormDataStack({ uuid: 'test-uuid' });

    expect(result).toEqual({
      currentItem: null,
      nextRoute: null,
      updatedStack: [],
    });
  });
  it('processes single item in form data stack', () => {
    const formDataStack = [
      {
        source: { propertyName: 'llm', selectedModel: 'OpenAI' },
        target: { propertyName: 'secret', selectedModel: 'OpenAIAPIKey' },
        formData: { name: '', api_key: '' },
        key: 'api_key',
      },
    ];
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formDataStack));

    const result = processFormDataStack({ uuid: 'test-uuid' });

    expect(result.currentItem).toEqual({
      source: { propertyName: 'llm', selectedModel: 'OpenAI' },
      target: { propertyName: 'secret', selectedModel: 'OpenAIAPIKey' },
      formData: {
        name: '',
        api_key: { name: 'OpenAIAPIKey', type: 'secret', uuid: 'test-uuid' },
      },
      key: 'api_key',
    });
    expect(result.nextRoute).toBe('/build/llm');
    expect(result.updatedStack).toEqual([]);
  });
  it('processes multiple items in form data stack', () => {
    const formDataStack = [
      {
        source: { propertyName: 'team', selectedModel: 'TeamModel' },
        target: { propertyName: 'agent', selectedModel: 'AgentModel' },
        formData: { name: '' },
        key: 'name',
      },
      {
        source: { propertyName: 'agent', selectedModel: 'AgentModel' },
        target: { propertyName: 'llm', selectedModel: 'OpenAI' },
        formData: { name: '' },
        key: 'name',
      },
    ];
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formDataStack));

    const result = processFormDataStack({ uuid: 'test-uuid' });

    expect(result.currentItem).toEqual({
      source: { propertyName: 'agent', selectedModel: 'AgentModel' },
      target: { propertyName: 'llm', selectedModel: 'OpenAI' },
      formData: { name: { name: 'OpenAI', type: 'llm', uuid: 'test-uuid' } },
      key: 'name',
    });
    expect(result.nextRoute).toBe('/build/agent');
    expect(result.updatedStack).toEqual([formDataStack[0]]);
  });

  it('handles last item in form data stack', () => {
    const formDataStack = [
      {
        source: { propertyName: 'secret', selectedModel: 'OpenAIAPIKey' },
        target: { propertyName: '', selectedModel: '' },
        formData: { name: '', value: '' },
        key: 'value',
      },
    ];
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formDataStack));

    const result = processFormDataStack({ uuid: 'test-uuid' });

    expect(result.currentItem).toEqual({
      source: { propertyName: 'secret', selectedModel: 'OpenAIAPIKey' },
      target: { propertyName: '', selectedModel: '' },
      formData: {
        name: '',
        value: { name: '', type: '', uuid: 'test-uuid' },
      },
      key: 'value',
    });
    expect(result.nextRoute).toBe('/build/secret');
    expect(result.updatedStack).toEqual([]);
  });
  it('processes multiple items and deletes finished key', () => {
    const formDataStack = [
      {
        source: { propertyName: 'team', selectedModel: 'TeamModel' },
        target: { propertyName: 'agent', selectedModel: 'AgentModel' },
        formData: { name: 'Team1', agent: '' },
        key: 'agent',
      },
      {
        source: { propertyName: 'agent', selectedModel: 'AgentModel' },
        target: { propertyName: 'llm', selectedModel: 'OpenAI' },
        formData: { name: 'Agent1', llm: '' },
        key: 'llm',
      },
    ];
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formDataStack));

    const result = processFormDataStack({ uuid: 'test-uuid' });
    expect(result.currentItem).toEqual({
      source: { propertyName: 'agent', selectedModel: 'AgentModel' },
      target: { propertyName: 'llm', selectedModel: 'OpenAI' },
      formData: { name: 'Agent1', llm: { name: 'OpenAI', type: 'llm', uuid: 'test-uuid' } }, // llm should be deleted
      key: 'llm',
    });
    expect(result.nextRoute).toBe('/build/agent');
    expect(result.updatedStack).toEqual([
      {
        source: { propertyName: 'team', selectedModel: 'TeamModel' },
        target: { propertyName: 'agent', selectedModel: 'AgentModel' },
        formData: { name: 'Team1', agent: '' },
        key: 'agent',
      },
    ]);
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
      localStorage.clear();
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
    it('sets showAddModel to true when onCancelCallback is called and the form data is available in the local storage', () => {
      const existingData = [
        {
          source: { propertyName: 'team', selectedModel: 'TeamModel' },
          target: { propertyName: 'agent', selectedModel: 'AgentModel' },
          formData: { name: 'Team1' },
          key: 'name',
        },
      ];
      localStorage.setItem('formDataStack', JSON.stringify(existingData));

      render(
        <Router>
          <UserPropertyHandler {...mockProps} />
        </Router>
      );

      fireEvent.click(screen.getByTestId('add-button'));
      expect(screen.getByTestId('model-form')).toBeDefined();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByTestId('model-form')).not.toBeNull();

      localStorage.clear();
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
