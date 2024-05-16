import { test, expect, describe } from 'vitest';
import _ from 'lodash';

import {
  filerOutComponentData,
  capitalizeFirstLetter,
  formatApiKey,
  getSchemaByName,
  getRefValues,
  constructHTMLSchema,
  getFormSubmitValues,
  isDependencyAvailable,
  formatDependencyErrorMessage,
  getKeyType,
  getMatchedUserProperties,
  removeRefSuffix,
  getAllRefs,
  checkForDependency,
} from '../utils/buildPageUtils';
import { SchemaCategory, ApiResponse } from '../interfaces/BuildPageInterfaces';

describe('buildPageUtils', () => {
  describe('filerOutComponentData', () => {
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
  });
  describe('capitalizeFirstLetter', () => {
    test('capitalizeFirstLetter', () => {
      const input = 'hello';
      const expected = 'Hello';
      const actual = capitalizeFirstLetter(input);
      expect(actual).toEqual(expected);
    });
  });
  describe('formatApiKey', () => {
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
  });
  describe('getSchemaByName', () => {
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
  describe('constructHTMLSchema', () => {
    test('constructHTMLSchema - with null as default value', () => {
      const input = [
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          json_str: {
            name: 'production azure key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'BingAPIKey',
          json_str: {
            name: 'production bing key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'OpenAIAPIKey',
          json_str: {
            name: 'production openai key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
      ];
      const expected = {
        default: 'None',
        description: '',
        enum: ['None', 'production azure key', 'production bing key', 'production openai key'],
        title: 'Api Key',
        type: 'string',
      };
      const property = {
        anyOf: [
          {
            $ref: '#/$defs/AzureOAIAPIKeyRef',
          },
          {
            $ref: '#/$defs/BingAPIKeyRef',
          },
          {
            $ref: '#/$defs/OpenAIAPIKeyRef',
          },
          {
            type: 'null',
          },
        ],
        default: null,
        description: 'The Bing API key for the browser',
      };
      let title = 'api_key';
      let selectedModelRefValues = null;
      let actual = constructHTMLSchema(input, title, property, selectedModelRefValues);
      expect(actual).toEqual(expected);
      title = 'Api Key';
      actual = constructHTMLSchema(input, title, property, selectedModelRefValues);
      expect(actual).toEqual(expected);
    });
    test('constructHTMLSchema - with non-null as default value', () => {
      const input = [
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          json_str: {
            name: 'production azure key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'BingAPIKey',
          json_str: {
            name: 'production bing key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'OpenAIAPIKey',
          model_uuid: '9ae5cc7e-83c0-4155-84a2-e9d312863c09',
          json_str: {
            name: 'production openai key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
      ];
      const expected = {
        default: 'production bing key',
        description: '',
        enum: ['production bing key', 'production azure key', 'production openai key'],
        title: 'Api Key',
        type: 'string',
      };
      const property = {
        anyOf: [
          {
            $ref: '#/$defs/AzureOAIAPIKeyRef',
          },
          {
            $ref: '#/$defs/OpenAIAPIKeyRef',
          },
          {
            $ref: '#/$defs/BingAPIKeyRef',
          },
        ],
        description: 'LLM used by the agent for producing responses',
        title: 'LLM',
        default: 'BingAPIKeyRef',
      };
      const title = 'api_key';
      const actual = constructHTMLSchema(input, title, property, null);
      expect(_.isEqual(actual, expected)).toBe(true);
    });
    test('constructHTMLSchema - update existing property', () => {
      const input = [
        {
          uuid: '999e3ce9-7b27-4be3-8bf0-b4f7d101e571',
          user_uuid: '4401f7b4-2a28-4e6d-98a2-e210edae8a95',
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          json_str: {
            name: 'Azure staging key',
            api_key: '1234567890',
          },
          created_at: '2024-05-09T08:31:26.735000Z',
          updated_at: '2024-05-09T08:36:09.232000Z',
        },
        {
          uuid: 'd4601f6f-60cd-4056-8c44-5be8b97cc177',
          user_uuid: '4401f7b4-2a28-4e6d-98a2-e210edae8a95',
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          json_str: {
            name: 'production azure key',
            api_key: '0987654321',
          },
          created_at: '2024-05-09T08:31:46.304000Z',
          updated_at: '2024-05-09T08:37:09.981000Z',
        },
      ];
      const expected = {
        default: 'production azure key',
        description: '',
        enum: ['production azure key', 'Azure staging key'],
        title: 'Api Key',
        type: 'string',
      };
      const property = {
        anyOf: [
          {
            $ref: '#/$defs/AzureOAIAPIKeyRef',
          },
        ],
        description: 'LLM used by the agent for producing responses',
        title: 'LLM',
      };
      const title = 'api_key';
      const selectedModelRefValues = {
        name: 'AzureOAIAPIKey',
        type: 'secret',
        uuid: 'd4601f6f-60cd-4056-8c44-5be8b97cc177',
      };
      const actual = constructHTMLSchema(input, title, property, selectedModelRefValues);
      expect(_.isEqual(actual, expected)).toBe(true);
    });
    test('constructHTMLSchema - with no default value', () => {
      const input = [
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          json_str: {
            name: 'production azure key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'BingAPIKey',
          json_str: {
            name: 'production bing key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
        {
          uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'OpenAIAPIKey',
          json_str: {
            name: 'production openai key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:43.150000Z',
          updated_at: '2024-05-07T13:53:43.150000Z',
        },
      ];
      const expected = {
        default: 'production azure key',
        description: '',
        enum: ['production azure key', 'production bing key', 'production openai key'],
        title: 'Api Key',
        type: 'string',
      };
      const property = {
        anyOf: [
          {
            $ref: '#/$defs/AzureOAIAPIKeyRef',
          },
          {
            $ref: '#/$defs/OpenAIAPIKeyRef',
          },
          {
            $ref: '#/$defs/BingAPIKeyRef',
          },
        ],
        description: 'LLM used by the agent for producing responses',
        title: 'LLM',
      };
      const title = 'api_key';
      const actual = constructHTMLSchema(input, title, property, null);
      expect(_.isEqual(actual, expected)).toBe(true);
    });
  });
  describe('getFormSubmitValues', () => {
    test('getFormSubmitValues - without refs', () => {
      const refValues = {};
      const formData = { api_key: '' };
      const actual = getFormSubmitValues(refValues, formData);
      expect(actual).toEqual(formData);
    });

    test('getFormSubmitValues - with refs and default value', () => {
      const refValues = {
        api_key: {
          htmlSchema: {
            default: 'staging azure key',
            description: '',
            enum: ['staging azure key', 'dev azure key', 'prod azure key'],
            title: 'Api Key',
            type: 'string',
          },
          refUserProperties: [
            {
              uuid: '36015a9d-b03a-404b-8a21-a86267e92931',
              user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
              type_name: 'secret',
              model_name: 'AzureOAIAPIKey',
              json_str: {
                name: 'staging azure key',
                api_key: '',
              },
              created_at: '2024-05-07T13:53:43.150000Z',
              updated_at: '2024-05-07T13:53:43.150000Z',
            },
            {
              uuid: 'd68be8a4-7e0a-4b30-a47e-3f3c45f71b1e',
              user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
              type_name: 'secret',
              model_name: 'AzureOAIAPIKey',
              json_str: {
                name: 'dev azure key',
                api_key: '',
              },
              created_at: '2024-05-07T13:53:47.791000Z',
              updated_at: '2024-05-07T13:53:47.791000Z',
            },
            {
              uuid: '9e7afead-12a4-4fcb-bc65-2b5733defb92',
              user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
              type_name: 'secret',
              model_name: 'AzureOAIAPIKey',
              json_str: {
                name: 'prod azure key',
                api_key: '',
              },
              created_at: '2024-05-07T13:53:52.458000Z',
              updated_at: '2024-05-07T13:53:52.458000Z',
            },
          ],
        },
      };
      const formData = {
        name: 'qewqe',
        model: 'gpt-3.5-turbo',
        api_key: 'prod azure key', // pragma: allowlist secret
        base_url: 'https://api.openai.com/v1',
        api_type: 'azure',
        api_version: 'latest',
      };

      const expected = {
        name: 'qewqe',
        model: 'gpt-3.5-turbo',
        api_key: {
          uuid: '9e7afead-12a4-4fcb-bc65-2b5733defb92',
          user_uuid: 'c8371732-c996-4cce-a7b5-9a738dfc62f3',
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          json_str: {
            name: 'prod azure key',
            api_key: '',
          },
          created_at: '2024-05-07T13:53:52.458000Z',
          updated_at: '2024-05-07T13:53:52.458000Z',
        },
        base_url: 'https://api.openai.com/v1',
        api_type: 'azure',
        api_version: 'latest',
      };
      const actual = getFormSubmitValues(refValues, formData);
      expect(actual).toEqual(expected);
    });
  });
  describe('isDependencyAvailable', () => {
    test('isDependencyNotCreated - positive case - without dependencies', () => {
      const input = {};
      const actual = isDependencyAvailable(input);
      expect(actual).toBe(true);
    });

    test('isDependencyNotCreated - positive case - with dependencies', () => {
      const input = { secret: 1 };
      const actual = isDependencyAvailable(input);
      expect(actual).toBe(true);
    });

    test('isDependencyNotCreated - positive case - with multiple dependencies', () => {
      const input = { secret: 5, llm: 10 };
      const actual = isDependencyAvailable(input);
      expect(actual).toBe(true);
    });

    test('isDependencyNotCreated - negative case - with dependencies', () => {
      const input = { secret: 0 };
      const actual = isDependencyAvailable(input);
      expect(actual).toBe(false);
    });

    test('isDependencyNotCreated - negative case - with multiple dependencies', () => {
      const input = { secret: 5, llm: 0 };
      const actual = isDependencyAvailable(input);
      expect(actual).toBe(false);
    });
  });
  describe('formatDependencyErrorMessage', () => {
    test('formatDependencyErrorMessage - empty list', () => {
      const input = [''];
      const actual = formatDependencyErrorMessage(input);
      expect(actual).toBe('');
    });

    test('formatDependencyErrorMessage - with one dependency', () => {
      const input = ['secret'];
      const actual = formatDependencyErrorMessage(input);
      expect(actual).toBe('secret');
    });

    test('formatDependencyErrorMessage - with two dependencies', () => {
      const input = ['secret', 'agent'];
      const actual = formatDependencyErrorMessage(input);
      expect(actual).toBe('secret and one agent');
    });
    test('formatDependencyErrorMessage - with three dependencies', () => {
      const input = ['secret', 'agent', 'llm'];
      const actual = formatDependencyErrorMessage(input);
      expect(actual).toBe('secret, one agent and one llm');
    });

    test('formatDependencyErrorMessage - with four dependencies', () => {
      const input = ['secret', 'agent', 'llm', 'team'];
      const actual = formatDependencyErrorMessage(input);
      expect(actual).toBe('secret, one agent, one llm and one team');
    });
  });
  describe('getRefValues', () => {
    test('getRefValues', () => {
      const input = [{ $ref: '#/$defs/AzureOAIRef' }, { $ref: '#/$defs/OpenAIRef' }];
      const expected = ['#/$defs/AzureOAIRef', '#/$defs/OpenAIRef'];
      const actual = getRefValues(input);
      expect(actual).toEqual(expected);
    });
  });
  describe('getKeyType', () => {
    test('getKeyType - llm', () => {
      const refName = 'AzureOAIRef';
      const definitions = {
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
            uuid: {
              description: 'The unique identifier',
              format: 'uuid',
              title: 'UUID',
              type: 'string',
            },
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
            uuid: {
              description: 'The unique identifier',
              format: 'uuid',
              title: 'UUID',
              type: 'string',
            },
          },
          required: ['uuid'],
          title: 'OpenAIRef',
          type: 'object',
        },
      };
      const expected = 'llm';
      const actual = getKeyType(refName, definitions);
      expect(actual).toEqual(expected);
    });
    test('getKeyType - secret', () => {
      const refName = 'BingAPIKeyRef';
      const definitions = {
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
            uuid: {
              description: 'The unique identifier',
              format: 'uuid',
              title: 'UUID',
              type: 'string',
            },
          },
          required: ['uuid'],
          title: 'AzureOAIRef',
          type: 'object',
        },
        BingAPIKeyRef: {
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
              const: 'BingAPIKey',
              default: 'BingAPIKey',
              description: 'The name of the data',
              enum: ['BingAPIKey'],
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
          title: 'BingAPIKeyRef',
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
            uuid: {
              description: 'The unique identifier',
              format: 'uuid',
              title: 'UUID',
              type: 'string',
            },
          },
          required: ['uuid'],
          title: 'OpenAIRef',
          type: 'object',
        },
      };
      const expected = 'secret';
      const actual = getKeyType(refName, definitions);
      expect(actual).toEqual(expected);
    });
  });
  describe('removeRefSuffix', () => {
    test('removeRefSuffix with ref', () => {
      const ref = '#/$defs/AzureOAIAPIKeyRef';
      const expected = 'AzureOAIAPIKey';
      const actual = removeRefSuffix(ref);
      expect(actual).toEqual(expected);
    });
    test('removeRefSuffix without ref', () => {
      const ref = '#/$defs/hello';
      const expected = 'hello';
      const actual = removeRefSuffix(ref);
      expect(actual).toEqual(expected);
    });
  });
  describe('getMatchedUserProperties', () => {
    test('getMatchedUserProperties with one ref', () => {
      const allUserProperties = [
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          user_id: 1,
        },
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'OpenAIAPIKey',
          user_id: 1,
        },
      ];
      const refName = ['#/$defs/AzureOAIAPIKey'];
      const expected = [
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          user_id: 1,
        },
      ];

      const actual = getMatchedUserProperties(allUserProperties, refName);
      expect(actual).toEqual(expected);
    });
    test('getMatchedUserProperties with two refs', () => {
      const allUserProperties = [
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          user_id: 1,
        },
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'OpenAIAPIKey',
          user_id: 1,
        },
      ];
      const refName = ['#/$defs/AzureOAIAPIKeyRef', '#/$defs/OpenAIAPIKeyRef'];
      const expected = [
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'AzureOAIAPIKey',
          user_id: 1,
        },
        {
          uuid: 'f55171f6-daf1-4274-8b87-e5bb3b6dcd6b',
          model: {
            api_key: '',
          },
          type_name: 'secret',
          model_name: 'OpenAIAPIKey',
          user_id: 1,
        },
      ];
      const actual = getMatchedUserProperties(allUserProperties, refName);
      expect(actual).toEqual(expected);
    });
  });
  describe('getAllRefs', () => {
    test('getAllRefs - with refs only', () => {
      const input = {
        anyOf: [
          {
            $ref: '#/$defs/AzureOAIRef',
          },
          {
            $ref: '#/$defs/OpenAIRef',
          },
        ],
        description: 'This LLM will be used to generated summary of all pages visited',
        title: 'Summarizer LLM',
      };
      const expected = ['#/$defs/AzureOAIRef', '#/$defs/OpenAIRef'];
      const actual = getAllRefs(input);
      expect(actual).toEqual(expected);
    });
    test('getAllRefs - with refs and type', () => {
      const input = {
        anyOf: [
          {
            $ref: '#/$defs/BingAPIKeyRef',
          },
          {
            type: 'null',
          },
        ],
        default: null,
        description: 'The Bing API key for the browser',
      };
      const expected = ['#/$defs/BingAPIKeyRef', 'null'];
      const actual = getAllRefs(input);
      expect(actual).toEqual(expected);
    });
  });
  describe('checkForDependency', () => {
    test('checkForDependency - with empty userPropertyData', () => {
      const userPropertyData: object[] = [];
      const allRefList = ['#/$defs/AzureOAIAPIKeyRef', '#/$defs/OpenAIAPIKeyRef'];
      const actual = checkForDependency(userPropertyData, allRefList);
      const expected = ['AzureOAIAPIKey', 'OpenAIAPIKey'];
      expect(_.isEqual(actual, expected)).toBe(true);
    });
    test('checkForDependency - with empty userPropertyData and null in allRefList', () => {
      const userPropertyData: object[] = [];
      const allRefList = ['#/$defs/AzureOAIAPIKeyRef', 'null'];
      const actual = checkForDependency(userPropertyData, allRefList);
      const expected: string[] = [];
      expect(_.isEqual(actual, expected)).toBe(true);
    });
    test('checkForDependency - with non-empty userPropertyData', () => {
      const userPropertyData: object[] = [
        {
          uuid: 'd01b841a-2b64-47c8-82a6-8855202e8062',
          api_key: {
            uuid: '9c6735e9-cc23-4831-9688-6bc277da9e40',
            api_key: '',
            type_name: 'secret',
            model_name: 'AzureOAIAPIKey',
            user_id: 1,
            base_url: null,
            model: null,
            api_type: null,
            api_version: null,
            llm: null,
            summarizer_llm: null,
            bing_api_key: null,
            system_message: null,
            viewport_size: null,
          },
          type_name: 'llm',
          model_name: 'AzureOAI',
          user_id: 1,
          base_url: 'https://api.openai.com/v1',
          model: 'gpt-3.5-turbo',
          api_type: 'azure',
          api_version: 'latest',
          llm: null,
          summarizer_llm: null,
          bing_api_key: null,
          system_message: null,
          viewport_size: null,
        },
      ];
      const allRefList = ['#/$defs/AzureOAIAPIKeyRef', '#/$defs/OpenAIAPIKeyRef'];
      const actual = checkForDependency(userPropertyData, allRefList);
      const expected: string[] = [];
      expect(_.isEqual(actual, expected)).toBe(true);
    });
  });
});
