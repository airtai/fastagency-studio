import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useForm } from '../hooks/useForm';

describe('useForm', () => {
  describe('useForm for LLM', () => {
    const jsonSchema = {
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
    };
    it('should initialize form data when the default value is non-null', () => {
      const defaultValues = {
        name: 'Azure LLM',
        model: 'gpt-35-turbo-16k',
        api_key: {
          name: 'AzureOAIAPIKey',
          type: 'secret',
          uuid: '718e1c3a-57d7-49d6-8e96-89351c9e052c',
        },
        api_type: 'azure',
        base_url: 'https://staging.openai.azure.com',
        api_version: '2024-02-01',
        temperature: 0.8,
        uuid: 'a0cfc041-a86f-43a8-8a7f-5bce7d496d3b',
      };
      // @ts-ignore
      const { result } = renderHook(() => useForm({ jsonSchema, defaultValues }));

      const formData = {
        name: 'Azure LLM',
        model: 'gpt-35-turbo-16k',
        api_key: undefined,
        base_url: 'https://staging.openai.azure.com',
        api_type: 'azure',
        api_version: '2024-02-01',
        temperature: 0.8,
      };

      expect(result.current.formData).toEqual(formData);
    });
    it('should initialize form data when the default value is null', () => {
      const { result } = renderHook(() => useForm({ jsonSchema, defaultValues: null }));

      const formData = {
        name: '',
        model: 'gpt-3.5-turbo',
        api_key: '',
        base_url: 'https://api.openai.com/v1',
        api_type: 'azure',
        api_version: '2024-02-01',
        temperature: 0.8,
      };

      console.log(result.current.formData);
      expect(result.current.formData).toEqual(formData);
    });
  });
  describe('useForm for Agent', () => {
    const jsonSchema = {
      $defs: {
        AnthropicRef: {
          properties: {
            type: {
              const: 'llm',
              default: 'llm',
              description: 'The name of the type of the data',
              enum: ['llm'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'Anthropic',
              default: 'Anthropic',
              description: 'The name of the data',
              enum: ['Anthropic'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'AnthropicRef',
          type: 'object',
        },
        AzureOAIRef: {
          properties: {
            type: {
              const: 'llm',
              default: 'llm',
              description: 'The name of the type of the data',
              enum: ['llm'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'AzureOAI',
              default: 'AzureOAI',
              description: 'The name of the data',
              enum: ['AzureOAI'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'AzureOAIRef',
          type: 'object',
        },
        OpenAIRef: {
          properties: {
            type: {
              const: 'llm',
              default: 'llm',
              description: 'The name of the type of the data',
              enum: ['llm'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'OpenAI',
              default: 'OpenAI',
              description: 'The name of the data',
              enum: ['OpenAI'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'OpenAIRef',
          type: 'object',
        },
        TogetherAIRef: {
          properties: {
            type: {
              const: 'llm',
              default: 'llm',
              description: 'The name of the type of the data',
              enum: ['llm'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'TogetherAI',
              default: 'TogetherAI',
              description: 'The name of the data',
              enum: ['TogetherAI'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'TogetherAIRef',
          type: 'object',
        },
        ToolboxRef: {
          properties: {
            type: {
              const: 'toolbox',
              default: 'toolbox',
              description: 'The name of the type of the data',
              enum: ['toolbox'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'Toolbox',
              default: 'Toolbox',
              description: 'The name of the data',
              enum: ['Toolbox'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'ToolboxRef',
          type: 'object',
        },
      },
      properties: {
        name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
        llm: {
          anyOf: [
            { $ref: '#/$defs/AnthropicRef' },
            { $ref: '#/$defs/AzureOAIRef' },
            { $ref: '#/$defs/OpenAIRef' },
            { $ref: '#/$defs/TogetherAIRef' },
          ],
          description: 'LLM used by the agent for producing responses',
          title: 'LLM',
        },
        toolbox_1: {
          anyOf: [{ $ref: '#/$defs/ToolboxRef' }, { type: 'null' }],
          default: null,
          description: 'Toolbox used by the agent for producing responses',
          title: 'Toolbox',
        },
        toolbox_2: {
          anyOf: [{ $ref: '#/$defs/ToolboxRef' }, { type: 'null' }],
          default: null,
          description: 'Toolbox used by the agent for producing responses',
          title: 'Toolbox',
        },
        toolbox_3: {
          anyOf: [{ $ref: '#/$defs/ToolboxRef' }, { type: 'null' }],
          default: null,
          description: 'Toolbox used by the agent for producing responses',
          title: 'Toolbox',
        },
        system_message: {
          default:
            "You are a helpful assistant. After you successfully answer all questions and there are no new questions asked after your response (e.g. there is no specific direction or question asked after you give a response), terminate the chat by outputting 'TERMINATE'",
          description:
            'The system message of the agent. This message is used to inform the agent about his role in the conversation',
          title: 'System Message',
          type: 'string',
        },
      },
      required: ['name', 'llm'],
      title: 'AssistantAgent',
      type: 'object',
    };
    it('should initialize form data when the default value is null', () => {
      const defaultValues = null;
      const formData = {
        name: '',
        llm: '',
        toolbox_1: '',
        toolbox_2: '',
        toolbox_3: '',
        system_message:
          "You are a helpful assistant. After you successfully answer all questions and there are no new questions asked after your response (e.g. there is no specific direction or question asked after you give a response), terminate the chat by outputting 'TERMINATE'",
      };
      const { result } = renderHook(() => useForm({ jsonSchema, defaultValues }));
      expect(result.current.formData).toEqual(formData);
    });
    it('should initialize form data when the default value is non-null', () => {
      const defaultValues = {
        llm: { name: 'AzureOAI', type: 'llm', uuid: 'a0cfc041-a86f-43a8-8a7f-5bce7d496d3b' },
        name: 'Weatherman',
        toolbox_1: { name: 'Toolbox', type: 'toolbox', uuid: '0f686b5e-af80-47fc-b401-c766d551bcda' },
        toolbox_2: null,
        toolbox_3: null,
        system_message:
          'You are Weatherman, a reliable and efficient assistant specializing in providing real-time weather updates for any city. Users will inquire about the weather conditions in specific cities, and your role is to utilize your advanced capabilities to fetch and deliver the most current weather data. You are designed to always have access to live weather information, ensuring that users receive the most accurate and up-to-date weather details at all times.',
        uuid: '624b068c-61b9-4ed2-8766-c9c529dcc9eb',
      };
      const formData = {
        name: 'Weatherman',
        toolbox_2: '',
        toolbox_3: '',
        system_message:
          'You are Weatherman, a reliable and efficient assistant specializing in providing real-time weather updates for any city. Users will inquire about the weather conditions in specific cities, and your role is to utilize your advanced capabilities to fetch and deliver the most current weather data. You are designed to always have access to live weather information, ensuring that users receive the most accurate and up-to-date weather details at all times.',
      };
      // @ts-ignore
      const { result } = renderHook(() => useForm({ jsonSchema, defaultValues }));
      expect(result.current.formData).toEqual(formData);
    });
  });
  describe('useForm for Teams', () => {
    const jsonSchema = {
      $defs: {
        AssistantAgentRef: {
          properties: {
            type: {
              const: 'agent',
              default: 'agent',
              description: 'The name of the type of the data',
              enum: ['agent'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'AssistantAgent',
              default: 'AssistantAgent',
              description: 'The name of the data',
              enum: ['AssistantAgent'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'AssistantAgentRef',
          type: 'object',
        },
        UserProxyAgentRef: {
          properties: {
            type: {
              const: 'agent',
              default: 'agent',
              description: 'The name of the type of the data',
              enum: ['agent'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'UserProxyAgent',
              default: 'UserProxyAgent',
              description: 'The name of the data',
              enum: ['UserProxyAgent'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'UserProxyAgentRef',
          type: 'object',
        },
        WebSurferAgentRef: {
          properties: {
            type: {
              const: 'agent',
              default: 'agent',
              description: 'The name of the type of the data',
              enum: ['agent'],
              title: 'Type',
              type: 'string',
            },
            name: {
              const: 'WebSurferAgent',
              default: 'WebSurferAgent',
              description: 'The name of the data',
              enum: ['WebSurferAgent'],
              title: 'Name',
              type: 'string',
            },
            uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
          },
          required: ['uuid'],
          title: 'WebSurferAgentRef',
          type: 'object',
        },
      },
      properties: {
        name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
        is_termination_msg_regex: {
          default: 'TERMINATE',
          description:
            'Whether the message is a termination message or not. If it is a termination message, the chat will terminate.',
          title: 'Is Termination Msg Regex',
          type: 'string',
        },
        human_input_mode: {
          default: 'ALWAYS',
          description: 'Mode for human input',
          enum: ['ALWAYS', 'TERMINATE', 'NEVER'],
          title: 'Human input mode',
          type: 'string',
        },
        initial_agent: {
          anyOf: [
            { $ref: '#/$defs/AssistantAgentRef' },
            { $ref: '#/$defs/UserProxyAgentRef' },
            { $ref: '#/$defs/WebSurferAgentRef' },
          ],
          description: 'Agent that starts the conversation',
          title: 'Initial agent',
        },
        secondary_agent: {
          anyOf: [
            { $ref: '#/$defs/AssistantAgentRef' },
            { $ref: '#/$defs/UserProxyAgentRef' },
            { $ref: '#/$defs/WebSurferAgentRef' },
          ],
          description: 'Agent that continues the conversation',
          title: 'Secondary agent',
        },
      },
      required: ['name', 'initial_agent', 'secondary_agent'],
      title: 'TwoAgentTeam',
      type: 'object',
    };
    it('should initialize form data when the default value is null', () => {
      const defaultValues = null;
      const formData = {
        name: '',
        is_termination_msg_regex: 'TERMINATE',
        human_input_mode: 'ALWAYS',
        initial_agent: '',
        secondary_agent: '',
      };
      const { result } = renderHook(() => useForm({ jsonSchema, defaultValues }));
      expect(result.current.formData).toEqual(formData);
    });

    it('should initialize form data when the default value is non-null', () => {
      const defaultValues = {
        name: 'Weatherman Team',
        initial_agent: { name: 'UserProxyAgent', type: 'agent', uuid: '65ee9838-41df-4b5f-a78e-794089e64d3d' },
        secondary_agent: { name: 'AssistantAgent', type: 'agent', uuid: '624b068c-61b9-4ed2-8766-c9c529dcc9eb' },
        human_input_mode: 'ALWAYS',
        is_termination_msg_regex: 'TERMINATE',
        uuid: '5076fa60-af71-4bbd-8a86-219da7abc5cc',
      };
      const formData = { name: 'Weatherman Team', is_termination_msg_regex: 'TERMINATE', human_input_mode: 'ALWAYS' };
      // @ts-ignore
      const { result } = renderHook(() => useForm({ jsonSchema, defaultValues }));
      expect(result.current.formData).toEqual(formData);
    });
  });
});
