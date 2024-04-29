import { test, expect, describe } from 'vitest';
import _ from 'lodash';

import { filerOutComponentData, capitalizeFirstLetter, formatApiKey, getSchemaByName } from '../utils/buildPageUtils';
import { SchemaCategory, ApiResponse } from '../interfaces/BuildPageInterfaces';

describe('buildPageUtils', () => {
  test('filerOutComponentData', () => {
    const input: ApiResponse = {
      list_of_schemas: [
        {
          name: 'secret',
          schemas: [
            {
              name: 'AzureOAIAPIKey',
              json_schema: {
                properties: {
                  api_key: {
                    description: 'The API Key from OpenAI',
                    title: 'Api Key',
                    type: 'string',
                  },
                },
                required: ['api_key'],
                title: 'AzureOAIAPIKey',
                type: 'object',
              },
            },
            {
              name: 'OpenAIAPIKey',
              json_schema: {
                properties: {
                  api_key: {
                    description: 'The API Key from OpenAI',
                    title: 'Api Key',
                    type: 'string',
                  },
                },
                required: ['api_key'],
                title: 'OpenAIAPIKey',
                type: 'object',
              },
            },
          ],
        },
        {
          name: 'llm',
          schemas: [
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
                      uuid: {
                        description: 'The unique identifier',
                        format: 'uuid',
                        title: 'UUID',
                        type: 'string',
                      },
                    },
                    required: ['uuid'],
                    title: 'AzureOAIAPIKeyRef',
                    type: 'object',
                  },
                },
                properties: {
                  model: {
                    default: 'gpt-3.5-turbo',
                    description: "The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'",
                    title: 'Model',
                    type: 'string',
                  },
                  api_key: {
                    $ref: '#/$defs/AzureOAIAPIKeyRef',
                  },
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
                    default: 'latest',
                    description: "The version of the Azure OpenAI API, e.g. '2024-02-15-preview' or 'latest",
                    enum: ['2024-02-15-preview', 'latest'],
                    title: 'Api Version',
                    type: 'string',
                  },
                },
                required: ['api_key'],
                title: 'AzureOAI',
                type: 'object',
              },
            },
            {
              name: 'OpenAI',
              json_schema: {
                $defs: {
                  OpenAIAPIKeyRef: {
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
                        const: 'OpenAIAPIKey',
                        default: 'OpenAIAPIKey',
                        description: 'The name of the data',
                        enum: ['OpenAIAPIKey'],
                        title: 'Name',
                        type: 'string',
                      },
                      uuid: {
                        description: 'The unique identifier',
                        format: 'uuid',
                        title: 'UUID',
                        type: 'string',
                      },
                    },
                    required: ['uuid'],
                    title: 'OpenAIAPIKeyRef',
                    type: 'object',
                  },
                },
                properties: {
                  model: {
                    default: 'gpt-3.5-turbo',
                    description: "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
                    enum: ['gpt-4', 'gpt-3.5-turbo'],
                    title: 'Model',
                    type: 'string',
                  },
                  api_key: {
                    $ref: '#/$defs/OpenAIAPIKeyRef',
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
                required: ['api_key'],
                title: 'OpenAI',
                type: 'object',
              },
            },
          ],
        },
        {
          name: 'agent',
          schemas: [
            {
              name: 'AssistantAgent',
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
                      uuid: {
                        description: 'The unique identifier',
                        format: 'uuid',
                        title: 'UUID',
                        type: 'string',
                      },
                    },
                    required: ['uuid'],
                    title: 'AzureOAIAPIKeyRef',
                    type: 'object',
                  },
                  OpenAIAPIKeyRef: {
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
                        const: 'OpenAIAPIKey',
                        default: 'OpenAIAPIKey',
                        description: 'The name of the data',
                        enum: ['OpenAIAPIKey'],
                        title: 'Name',
                        type: 'string',
                      },
                      uuid: {
                        description: 'The unique identifier',
                        format: 'uuid',
                        title: 'UUID',
                        type: 'string',
                      },
                    },
                    required: ['uuid'],
                    title: 'OpenAIAPIKeyRef',
                    type: 'object',
                  },
                },
                properties: {
                  name: {
                    description: 'The name of the agent',
                    title: 'Name',
                    type: 'string',
                  },
                  llm: {
                    anyOf: [
                      {
                        $ref: '#/$defs/OpenAIAPIKeyRef',
                      },
                      {
                        $ref: '#/$defs/AzureOAIAPIKeyRef',
                      },
                    ],
                    description: 'LLM used by the agent for producing responses',
                    title: 'LLM',
                  },
                  system_message: {
                    description:
                      'The system message of the agent. This message is used to inform the agent about his role in the conversation',
                    title: 'System Message',
                    type: 'string',
                  },
                },
                required: ['name', 'llm', 'system_message'],
                title: 'AssistantAgent',
                type: 'object',
              },
            },
            {
              name: 'WebSurferAgent',
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
                      uuid: {
                        description: 'The unique identifier',
                        format: 'uuid',
                        title: 'UUID',
                        type: 'string',
                      },
                    },
                    required: ['uuid'],
                    title: 'AzureOAIAPIKeyRef',
                    type: 'object',
                  },
                  OpenAIAPIKeyRef: {
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
                        const: 'OpenAIAPIKey',
                        default: 'OpenAIAPIKey',
                        description: 'The name of the data',
                        enum: ['OpenAIAPIKey'],
                        title: 'Name',
                        type: 'string',
                      },
                      uuid: {
                        description: 'The unique identifier',
                        format: 'uuid',
                        title: 'UUID',
                        type: 'string',
                      },
                    },
                    required: ['uuid'],
                    title: 'OpenAIAPIKeyRef',
                    type: 'object',
                  },
                },
                properties: {
                  name: {
                    description: 'The name of the agent',
                    title: 'Name',
                    type: 'string',
                  },
                  llm: {
                    anyOf: [
                      {
                        $ref: '#/$defs/OpenAIAPIKeyRef',
                      },
                      {
                        $ref: '#/$defs/AzureOAIAPIKeyRef',
                      },
                    ],
                    description: 'LLM used by the agent for producing responses',
                    title: 'LLM',
                  },
                  summarizer_llm: {
                    anyOf: [
                      {
                        $ref: '#/$defs/OpenAIAPIKeyRef',
                      },
                      {
                        $ref: '#/$defs/AzureOAIAPIKeyRef',
                      },
                    ],
                    description: 'This LLM will be used to generated summary of all pages visited',
                    title: 'Summarizer LLM',
                  },
                  viewport_size: {
                    default: 1080,
                    description: 'The viewport size of the browser',
                    title: 'Viewport Size',
                    type: 'integer',
                  },
                  bing_api_key: {
                    anyOf: [
                      {
                        type: 'string',
                      },
                      {
                        type: 'null',
                      },
                    ],
                    default: null,
                    description: 'The Bing API key for the browser',
                    title: 'Bing Api Key',
                  },
                },
                required: ['name', 'llm', 'summarizer_llm'],
                title: 'WebSurferAgent',
                type: 'object',
              },
            },
          ],
        },
      ],
    };
    const expected: SchemaCategory = {
      name: 'secret',
      schemas: [
        {
          name: 'AzureOAIAPIKey',
          json_schema: {
            properties: {
              api_key: {
                description: 'The API Key from OpenAI',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['api_key'],
            title: 'AzureOAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'OpenAIAPIKey',
          json_schema: {
            properties: {
              api_key: {
                description: 'The API Key from OpenAI',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['api_key'],
            title: 'OpenAIAPIKey',
            type: 'object',
          },
        },
      ],
    };
    const actual = filerOutComponentData(input, 'secret');
    expect(actual).toEqual(expected);
  });
  test('capitalizeFirstLetter', () => {
    const input = 'hello';
    const expected = 'Hello';
    const actual = capitalizeFirstLetter(input);
    expect(actual).toEqual(expected);
  });
  test('formatApiKey with input less that 7 characters', () => {
    const input = 'hello';
    const expected = 'he***';
    const actual = formatApiKey(input);
    expect(actual).toEqual(expected);
  });
  test('formatApiKey with input more that 7 characters', () => {
    const input = 'this-is-a-strong-secret-key';
    const expected = 'thi...-key';
    const actual = formatApiKey(input);
    expect(actual).toEqual(expected);
  });
  test('formatApiKey with empty input', () => {
    const input = '';
    const expected = '';
    const actual = formatApiKey(input);
    expect(actual).toEqual(expected);
  });
  test('getSchemaByName', () => {
    const schemaData = {
      schemas: [
        {
          name: 'AzureOAIAPIKey',
          json_schema: {
            properties: {
              api_key: {
                description: 'The API Key from OpenAI',
                title: 'Api Key',
                type: 'string',
                pattern: '',
              },
            },
            required: ['api_key'],
            title: 'AzureOAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'OpenAIAPIKey',
          json_schema: {
            properties: {
              api_key: {
                description: 'The API Key from OpenAI',
                pattern: '^sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}$',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['api_key'],
            title: 'OpenAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'BingAPIKey',
          json_schema: {
            properties: {
              api_key: {
                description: 'The API Key from OpenAI',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['api_key'],
            title: 'BingAPIKey',
            type: 'object',
          },
        },
      ],
    };
    let schemaName = 'OpenAIAPIKey';
    let actual = getSchemaByName(schemaData.schemas, schemaName);
    let expected = {
      properties: {
        api_key: {
          description: 'The API Key from OpenAI',
          pattern: '^sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}$',
          title: 'Api Key',
          type: 'string',
        },
      },
      required: ['api_key'],
      title: 'OpenAIAPIKey',
      type: 'object',
    };
    expect(_.isEqual(actual, expected)).toBe(true);

    schemaName = 'some invalid schema';
    actual = getSchemaByName(schemaData.schemas, schemaName);
    expected = {
      properties: {
        api_key: {
          description: 'The API Key from OpenAI',
          title: 'Api Key',
          type: 'string',
          pattern: '',
        },
      },
      required: ['api_key'],
      title: 'AzureOAIAPIKey',
      type: 'object',
    };
    expect(_.isEqual(actual, expected)).toBe(true);
  });
});
