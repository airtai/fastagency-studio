import { test, expect, describe } from 'vitest';
import _ from 'lodash';

import {
  filerOutComponentData,
  capitalizeFirstLetter,
  formatApiKey,
  getSchemaByName,
  getPropertyReferenceValues,
  getRefValues,
  constructHTMLSchema,
  getFormSubmitValues,
  isDependencyAvailable,
  formatDependencyErrorMessage,
  getKeyType,
  getMatchedUserProperties,
  removeRefSuffix,
} from '../utils/buildPageUtils';
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
  test('getPropertyReferenceValues with invalid defs', async () => {
    const ref = '#/$defs/AzureOAIAPIKeyRef';
    const definitions = {
      inValidRef: {
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
    };
    const expected = {};
    const key = 'api_key';
    const property_type = 'secret';
    const actual = await getPropertyReferenceValues(ref, definitions, key, property_type);
    expect(actual).toEqual(expected);
  });
  // mock the below function
  // test('getPropertyReferenceValues with valid defs', async () => {
  //   const ref = '#/$defs/AzureOAIAPIKeyRef';
  //   const definitions = {
  //     AzureOAIAPIKeyRef: {
  //       properties: {
  //         type: {
  //           const: 'secret',
  //           default: 'secret',
  //           description: 'The name of the type of the data',
  //           enum: ['secret'],
  //           title: 'Type',
  //           type: 'string',
  //         },
  //         name: {
  //           const: 'AzureOAIAPIKey',
  //           default: 'AzureOAIAPIKey',
  //           description: 'The name of the data',
  //           enum: ['AzureOAIAPIKey'],
  //           title: 'Name',
  //           type: 'string',
  //         },
  //         uuid: {
  //           description: 'The unique identifier',
  //           format: 'uuid',
  //           title: 'UUID',
  //           type: 'string',
  //         },
  //       },
  //       required: ['uuid'],
  //       title: 'AzureOAIAPIKeyRef',
  //       type: 'object',
  //     },
  //   };
  //   const expected = {
  //     default: '', //num[0]
  //     description: '',
  //     enum: [
  //       '2024-02-15-preview', // response from the API call
  //       'latest',
  //     ],
  //     title: 'Api Key',
  //     type: 'string',
  //   };
  //   const key = 'api_key';
  //   const property_type = 'secret';
  //   const actual = await getPropertyReferenceValues(ref, definitions, key, property_type);
  //   expect(actual).toEqual(expected);
  // });
  test('constructHTMLSchema', () => {
    const input = [
      {
        uuid: '9e55de08-ad69-4acc-b9d2-5da9d4ae0bf1',
        api_key: '',
        property_type: 'secret',
        property_name: 'AzureOAIAPIKey',
        user_id: 1,
      },
      {
        uuid: '62922092-e7ab-4339-8ded-2e671826edae',
        api_key: '',
        property_type: 'secret',
        property_name: 'BingAPIKey',
        user_id: 1,
      },
      {
        uuid: '286027aa-35ae-4d2d-ad47-62adbbe86d43',
        api_key: '12321321321',
        property_type: 'secret',
        property_name: 'OpenAIAPIKey',
        user_id: 1,
      },
    ];
    const expected = {
      default: 'AzureOAIAPIKey',
      description: '',
      enum: ['AzureOAIAPIKey', 'BingAPIKey', 'OpenAIAPIKey'],
      title: 'Api Key',
      type: 'string',
    };
    const title = 'Api Key';
    const actual = constructHTMLSchema(input, title);
    expect(actual).toEqual(expected);
  });
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
          default: 'AzureOAIAPIKey',
          description: '',
          enum: ['AzureOAIAPIKey', 'BingAPIKey'],
          title: 'Api Key',
          type: 'string',
        },
        userPropertyData: [
          {
            uuid: 'debaa689-a3f8-4d91-9a18-a43916835384',
            api_key: '',
            property_type: 'secret',
            property_name: 'AzureOAIAPIKey',
            user_id: 1,
          },
          {
            uuid: 'b771441b-b216-491e-af32-33232b42ab7f',
            api_key: '',
            property_type: 'secret',
            property_name: 'BingAPIKey',
            user_id: 1,
          },
        ],
      },
    };
    const formData = {
      model: 'gpt-3.5-turbo',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      api_type: 'azure',
      api_version: 'latest',
    };

    const expected = {
      model: 'gpt-3.5-turbo',
      api_key: {
        uuid: 'debaa689-a3f8-4d91-9a18-a43916835384',
        api_key: '',
        property_type: 'secret',
        property_name: 'AzureOAIAPIKey',
        user_id: 1,
      },
      base_url: 'https://api.openai.com/v1',
      api_type: 'azure',
      api_version: 'latest',
    };
    const actual = getFormSubmitValues(refValues, formData);
    expect(actual).toEqual(expected);
  });

  test('getFormSubmitValues - with refs and non-default value', () => {
    const refValues = {
      api_key: {
        htmlSchema: {
          default: 'AzureOAIAPIKey',
          description: '',
          enum: ['AzureOAIAPIKey', 'BingAPIKey'],
          title: 'Api Key',
          type: 'string',
        },
        userPropertyData: [
          {
            uuid: 'debaa689-a3f8-4d91-9a18-a43916835384',
            api_key: '',
            property_type: 'secret',
            property_name: 'AzureOAIAPIKey',
            user_id: 1,
          },
          {
            uuid: 'b771441b-b216-491e-af32-33232b42ab7f',
            api_key: '',
            property_type: 'secret',
            property_name: 'BingAPIKey',
            user_id: 1,
          },
        ],
      },
    };
    const formData = {
      model: 'gpt-3.5-turbo',
      api_key: 'BingAPIKey', // pragma: allowlist secret
      base_url: 'https://api.openai.com/v1',
      api_type: 'azure',
      api_version: 'latest',
    };

    const expected = {
      model: 'gpt-3.5-turbo',
      api_key: {
        uuid: 'b771441b-b216-491e-af32-33232b42ab7f',
        api_key: '',
        property_type: 'secret',
        property_name: 'BingAPIKey',
        user_id: 1,
      },
      base_url: 'https://api.openai.com/v1',
      api_type: 'azure',
      api_version: 'latest',
    };
    const actual = getFormSubmitValues(refValues, formData);
    expect(actual).toEqual(expected);
  });

  test('getFormSubmitValues - update existing record', () => {
    const refValues = {
      api_key: {
        htmlSchema: {
          default: 'AzureOAIAPIKey',
          description: '',
          enum: ['AzureOAIAPIKey', 'BingAPIKey'],
          title: 'Api Key',
          type: 'string',
        },
        userPropertyData: [
          {
            uuid: 'c45c06d1-bb0e-4481-9c32-7ade1b90fa18',
            api_key: '',
            property_type: 'secret',
            property_name: 'AzureOAIAPIKey',
            user_id: 1,
            base_url: null,
            model: null,
            api_type: null,
            api_version: null,
          },
          {
            uuid: '7fd88128-6846-4d28-a251-2cd7957cfe14',
            api_key: '',
            property_type: 'secret',
            property_name: 'BingAPIKey',
            user_id: 1,
            base_url: null,
            model: null,
            api_type: null,
            api_version: null,
          },
        ],
      },
    };
    const formData = {
      model: 'gpt-3.5-turbo',
      api_key: {
        uuid: '7fd88128-6846-4d28-a251-2cd7957cfe14',
        api_key: '',
        property_type: 'secret',
        property_name: 'BingAPIKey',
        user_id: 1,
        base_url: null,
        model: null,
        api_type: null,
        api_version: null,
      },
      base_url: 'https://api.openai.com/v200',
      api_type: 'azure',
      api_version: 'latest',
    };

    const expected = {
      model: 'gpt-3.5-turbo',
      api_key: {
        uuid: '7fd88128-6846-4d28-a251-2cd7957cfe14',
        api_key: '',
        property_type: 'secret',
        property_name: 'BingAPIKey',
        user_id: 1,
        base_url: null,
        model: null,
        api_type: null,
        api_version: null,
      },
      base_url: 'https://api.openai.com/v200',
      api_type: 'azure',
      api_version: 'latest',
    };
    const actual = getFormSubmitValues(refValues, formData);
    expect(actual).toEqual(expected);
  });

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

  test('getRefValues', () => {
    const input = [{ $ref: '#/$defs/AzureOAIRef' }, { $ref: '#/$defs/OpenAIRef' }];
    const expected = ['#/$defs/AzureOAIRef', '#/$defs/OpenAIRef'];
    const actual = getRefValues(input);
    expect(actual).toEqual(expected);
  });
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
      const allUserProperties = {
        secret: [
          {
            uuid: '9ef4fcec-fa6f-4cc7-b1a5-48f82e09336c',
            api_key: '',
            property_type: 'secret',
            property_name: 'AzureOAIAPIKey',
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
          {
            uuid: '25b055d2-732c-45eb-adc2-3406461ba422',
            api_key: '',
            property_type: 'secret',
            property_name: 'OpenAIAPIKey',
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
        ],
      };
      const refName = '#/$defs/AzureOAIAPIKeyRef';
      const expected = [
        {
          uuid: '9ef4fcec-fa6f-4cc7-b1a5-48f82e09336c',
          api_key: '',
          property_type: 'secret',
          property_name: 'AzureOAIAPIKey',
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
      ];

      const actual = getMatchedUserProperties(allUserProperties, refName);
      expect(actual).toEqual(expected);
    });
  });
});
