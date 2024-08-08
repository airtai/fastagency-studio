import { test, expect, describe } from 'vitest';

import { PropertySchemaParser, UserProperties } from '../components/buildPage/PropertySchemaParser';
import { ListOfSchemas } from '../interfaces/BuildPageInterfacesNew';

describe('PropertySchemaParser', () => {
  test('Should parse secret', () => {
    const property = {
      name: 'secret',
      schemas: [
        {
          name: 'AnthropicAPIKey',
          json_schema: {
            properties: {
              name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
              api_key: { description: 'The API Key from Anthropic', title: 'Api Key', type: 'string' },
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
              name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
              api_key: { description: 'The API Key from Azure OpenAI', title: 'Api Key', type: 'string' },
            },
            required: ['name', 'api_key'],
            title: 'AzureOAIAPIKey',
            type: 'object',
          },
        },
      ],
    };
    const propertySchemaParser = new PropertySchemaParser(property);
    propertySchemaParser.setActiveModel('AzureOAIAPIKey');
    expect(propertySchemaParser).toBeInstanceOf(PropertySchemaParser);

    const expectedSchema = {
      name: 'AzureOAIAPIKey',
      json_schema: {
        properties: {
          name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
          api_key: { description: 'The API Key from Azure OpenAI', title: 'Api Key', type: 'string' },
        },
        required: ['name', 'api_key'],
        title: 'AzureOAIAPIKey',
        type: 'object',
      },
    };

    const schema = propertySchemaParser.getSchemaForModel();
    expect(schema).toEqual(expectedSchema);

    const defaultValues = propertySchemaParser.getDefaultValues();
    const expectedDefaultValues = { name: '', api_key: '' };
    expect(defaultValues).toEqual(expectedDefaultValues);

    const refFields = propertySchemaParser.getRefFields();
    expect(Object.keys(refFields)).toHaveLength(0);
  });
  test('Should parse llm', () => {
    const property: ListOfSchemas = {
      name: 'llm',
      schemas: [
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
                title: 'Temperature',
                type: 'number',
              },
            },
            required: ['name', 'api_key'],
            title: 'AzureOAI',
            type: 'object',
          },
        },
      ],
    };
    // @ts-ignore
    const userProperties: UserProperties[] = [
      {
        uuid: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b',
        user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
        type_name: 'secret',
        model_name: 'AzureOAIAPIKey',
        json_str: { name: 'secret', api_key: 'asd*****dasd' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
      {
        uuid: 'db945991-c142-4863-a96b-d81cc03e99de',
        user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
        type_name: 'llm',
        model_name: 'AzureOAI',
        json_str: {
          name: 'LLM',
          model: 'gpt-3.5-turbo',
          api_key: { name: 'AzureOAIAPIKey', type: 'secret', uuid: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b' },
          api_type: 'azure',
          base_url: 'https://api.openai.com/v1',
          api_version: '2024-02-01',
          temperature: 0.8,
        },
        created_at: '2024-08-08T09:09:52.523000Z',
        updated_at: '2024-08-08T09:09:52.523000Z',
      },
    ];
    const propertySchemaParser = new PropertySchemaParser(property);
    propertySchemaParser.setActiveModel('AzureOAI');
    expect(propertySchemaParser).toBeInstanceOf(PropertySchemaParser);

    propertySchemaParser.setUserProperties(userProperties);
    expect(propertySchemaParser.getUserProperties()).toEqual(userProperties);

    const schema = propertySchemaParser.getSchemaForModel();
    expect(schema).toEqual(property.schemas[1]);

    const defaultValues = propertySchemaParser.getDefaultValues();
    const expectedDefaultValues = {
      name: '',
      model: 'gpt-3.5-turbo',
      api_key: 'secret', // pragma: allowlist secret
      base_url: 'https://api.openai.com/v1',
      api_type: 'azure',
      api_version: '2024-02-01',
      temperature: 0.8,
    };
    expect(defaultValues).toEqual(expectedDefaultValues);

    const refFields = propertySchemaParser.getRefFields();
    expect(refFields).toEqual({
      api_key: {
        property: [userProperties[0]],
        htmlForSelectBox: { default: 'secret', description: '', enum: ['secret'], title: 'Api Key' },
      },
    });
  });

  test('Should handle schema with multiple reference fields', () => {
    const property: ListOfSchemas = {
      name: 'multiref',
      schemas: [
        {
          name: 'MultiRefSchema',
          json_schema: {
            $defs: {
              Ref1: {
                properties: {
                  type: {
                    const: 'secret',
                    default: 'secret',
                    enum: ['secret'],
                    type: 'string',
                    title: 'Type',
                    description: 'The name of the type of the data',
                  },
                  name: {
                    const: 'Ref1',
                    default: 'Ref1',
                    enum: ['Ref1'],
                    type: 'string',
                    title: 'Name',
                    description: 'The name of the data',
                  },
                  uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
                },
                required: ['uuid'],
                type: 'object',
                title: 'Ref1',
              },
              Ref2: {
                properties: {
                  type: { const: 'secret', default: 'secret', enum: ['secret'], type: 'string' },
                  name: { const: 'Ref2', default: 'Ref2', enum: ['Ref2'], type: 'string' },
                  uuid: { type: 'string', format: 'uuid' },
                },
                required: ['uuid'],
                type: 'object',
                title: 'Ref2',
              },
            },
            properties: {
              name: { type: 'string', minLength: 1 },
              ref1: { $ref: '#/$defs/Ref1' },
              ref2: { $ref: '#/$defs/Ref2' },
              api_type: { const: 'multiref', default: 'multiref', enum: ['multiref'], type: 'string' },
            },
            required: ['name', 'ref1', 'ref2'],
            type: 'object',
            title: 'MultiRefSchema',
          },
        },
      ],
    };

    const userProperties: UserProperties[] = [
      {
        uuid: '1',
        user_uuid: 'user1',
        type_name: 'secret',
        model_name: 'Ref1',
        json_str: { name: 'Ref1 Instance', api_key: 'secret1' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
      {
        uuid: '2',
        user_uuid: 'user1',
        type_name: 'secret',
        model_name: 'Ref2',
        json_str: { name: 'Ref2 Instance', api_key: 'secret2' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
    ];

    const parser = new PropertySchemaParser(property);
    parser.setActiveModel('MultiRefSchema');
    parser.setUserProperties(userProperties);

    const defaultValues = parser.getDefaultValues();
    const refFields = parser.getRefFields();
    console.log(refFields);
    expect(refFields).toEqual({
      ref1: {
        property: [userProperties[0]],
        htmlForSelectBox: { default: 'Ref1 Instance', description: '', enum: ['Ref1 Instance'], title: 'Ref1' },
      },
      ref2: {
        property: [userProperties[1]],
        htmlForSelectBox: { default: 'Ref2 Instance', description: '', enum: ['Ref2 Instance'], title: 'Ref2' },
      },
    });

    expect(Object.keys(refFields)).toHaveLength(2);
    expect(defaultValues).toEqual({
      name: '',
      ref1: 'Ref1 Instance',
      ref2: 'Ref2 Instance',
      api_type: 'multiref',
    });
  });

  test('Should handle when no matching user properties are found for a reference field', () => {
    const property: ListOfSchemas = {
      name: 'nomatch',
      schemas: [
        {
          name: 'NoMatchSchema',
          json_schema: {
            $defs: {
              NonExistentRef: {
                properties: {
                  type: {
                    const: 'secret',
                    default: 'secret',
                    enum: ['secret'],
                    type: 'string',
                    title: 'Type',
                    description: 'The name of the type of the data',
                  },
                  name: {
                    const: 'NonExistentRef',
                    default: 'NonExistentRef',
                    enum: ['NonExistentRef'],
                    type: 'string',
                    title: 'Name',
                    description: 'The name of the data',
                  },
                  uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
                },
                required: ['uuid'],
                type: 'object',
                title: 'NonExistentRef',
              },
            },
            properties: {
              name: { type: 'string', minLength: 1 },
              ref: { $ref: '#/$defs/NonExistentRef' },
              api_type: { const: 'nomatch', default: 'nomatch', enum: ['nomatch'], type: 'string' },
            },
            required: ['name', 'ref'],
            type: 'object',
            title: 'NoMatchSchema',
          },
        },
      ],
    };

    const userProperties: UserProperties[] = [
      {
        uuid: '1',
        user_uuid: 'user1',
        type_name: 'secret',
        model_name: 'OtherRef',
        json_str: { name: 'Other Instance', api_key: 'secret' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
    ];

    const parser = new PropertySchemaParser(property);
    parser.setActiveModel('NoMatchSchema');
    parser.setUserProperties(userProperties);

    const defaultValues = parser.getDefaultValues();
    const refFields = parser.getRefFields();

    expect(refFields.ref.property).toHaveLength(0);
    expect(refFields.ref.htmlForSelectBox.enum).toBeNull();
    expect(defaultValues).toEqual({
      name: '',
      ref: '',
      api_type: 'nomatch',
    });
  });

  test('Should handle when multiple matching user properties are found for a reference field', () => {
    const property: ListOfSchemas = {
      name: 'multimatch',
      schemas: [
        {
          name: 'MultiMatchSchema',
          json_schema: {
            $defs: {
              MultiRef: {
                properties: {
                  type: { const: 'secret', default: 'secret', enum: ['secret'], type: 'string' },
                  name: { const: 'MultiRef', default: 'MultiRef', enum: ['MultiRef'], type: 'string' },
                  uuid: { type: 'string', format: 'uuid' },
                },
                required: ['uuid'],
                type: 'object',
                title: 'MultiRef',
              },
            },
            properties: {
              name: { type: 'string', minLength: 1 },
              ref: { $ref: '#/$defs/MultiRefRef' },
              api_type: { const: 'multimatch', default: 'multimatch', enum: ['multimatch'], type: 'string' },
            },
            required: ['name', 'ref'],
            type: 'object',
            title: 'MultiMatchSchema',
          },
        },
      ],
    };

    const userProperties: UserProperties[] = [
      {
        uuid: '1',
        user_uuid: 'user1',
        type_name: 'secret',
        model_name: 'MultiRef',
        json_str: { name: 'MultiRef Instance 1', api_key: 'secret1' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
      {
        uuid: '2',
        user_uuid: 'user1',
        type_name: 'secret',
        model_name: 'MultiRef',
        json_str: { name: 'MultiRef Instance 2', api_key: 'secret2' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
    ];

    const parser = new PropertySchemaParser(property);
    parser.setActiveModel('MultiMatchSchema');
    parser.setUserProperties(userProperties);

    const defaultValues = parser.getDefaultValues();
    const refFields = parser.getRefFields();

    expect(refFields.ref.property).toHaveLength(2);
    expect(refFields.ref.htmlForSelectBox.enum).toEqual(['MultiRef Instance 1', 'MultiRef Instance 2']);
    expect(defaultValues).toEqual({
      name: '',
      ref: 'MultiRef Instance 1',
      api_type: 'multimatch',
    });
  });
});
