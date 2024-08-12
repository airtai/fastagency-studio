import { test, expect, describe } from 'vitest';
import _ from 'lodash';

import { filerOutComponentData, capitalizeFirstLetter, formatApiKey } from '../components/buildPage/buildPageUtils';
import { ListOfSchemas, PropertiesSchema } from '../interfaces/BuildPageInterfaces';

describe('buildPageUtils', () => {
  describe('filerOutComponentData', () => {
    test('filerOutComponentData', () => {
      const input: PropertiesSchema = {
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
        ],
      };
      const expected: ListOfSchemas = {
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
});
