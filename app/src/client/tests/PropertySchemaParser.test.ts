import { test, expect, describe } from 'vitest';
import _ from 'lodash';

import { PropertySchemaParser, UserProperties, UserFlow } from '../components/buildPage/PropertySchemaParser';
import { PropertiesSchema } from '../interfaces/BuildPageInterfaces';
import { llmUserProperties, mockPropertieSchemas } from './mocks';

describe('PropertySchemaParser', () => {
  test('Should parse secret', () => {
    const activeProperty = 'secret';
    const propertySchemaParser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
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
    // const property: ListOfSchemas = _.cloneDeep(llmProperty);
    const userProperties: UserProperties[] = _.cloneDeep(llmUserProperties);
    const activeProperty = 'llm';
    const propertySchemaParser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    propertySchemaParser.setActiveModel('AzureOAI');

    expect(propertySchemaParser).toBeInstanceOf(PropertySchemaParser);
    expect(propertySchemaParser.getActiveModel()).toBe('AzureOAI');

    propertySchemaParser.setUserProperties(userProperties);
    expect(propertySchemaParser.getUserProperties()).toEqual(userProperties);

    const schema = propertySchemaParser.getSchemaForModel();
    expect(schema).toEqual(mockPropertieSchemas.list_of_schemas[1].schemas[1]);

    const defaultValues = propertySchemaParser.getDefaultValues();
    const expectedDefaultValues = {
      name: '',
      model: 'gpt-3.5-turbo',
      api_key: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b', // pragma: allowlist secret
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
        htmlForSelectBox: {
          default: { value: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b', label: 'secret' },
          description: '',
          enum: [{ value: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b', label: 'secret' }],
          title: 'Api Key',
        },
        isOptional: false,
        initialFormValue: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b',
      },
    });
  });

  test('Should delete a property only if its is not referred by any other property', () => {
    const userProperties: UserProperties[] = _.cloneDeep(llmUserProperties);

    const activeProperty = 'llm';
    const propertySchemaParser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    propertySchemaParser.setActiveModel('AzureOAIAPIKey');
    expect(propertySchemaParser).toBeInstanceOf(PropertySchemaParser);

    propertySchemaParser.setUserProperties(userProperties);
    expect(propertySchemaParser.getUserProperties()).toEqual(userProperties);

    propertySchemaParser.setUserFlow(UserFlow.UPDATE_MODEL);
    expect(userProperties[0].type_name).toBe('secret');
    propertySchemaParser.setActiveModelObj(userProperties[0]);

    let propName = propertySchemaParser.findFirstReferringPropertyName(userProperties[0].uuid);
    const expectedProperty = {
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
    };
    expect(propName).toStrictEqual(expectedProperty);

    userProperties.push({
      uuid: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b',
      user_uuid: 'b0014b3f-bb43-4f64-8732-bb9444d13f7b',
      type_name: 'secret',
      model_name: 'AzureOAIAPIKey',
      json_str: { name: 'secret 2', api_key: 'asd*****dasd' }, // pragma: allowlist secret
      created_at: '2024-08-08T08:59:02.111000Z',
      updated_at: '2024-08-08T08:59:02.111000Z',
    });

    expect(userProperties[2].type_name).toBe('secret');
    propertySchemaParser.setActiveModelObj(userProperties[2]);

    propName = propertySchemaParser.findFirstReferringPropertyName(userProperties[2].uuid);
    expect(propName).toBe(null);

    userProperties.push({
      uuid: 'ca945991-c142-4863-a96b-d81cc03e99de',
      user_uuid: 'ace81928-8e99-48c2-be5d-61a5b422cf47',
      type_name: 'llm',
      model_name: 'AzureOAI',
      json_str: {
        name: 'LLM 2',
        model: 'gpt-3.5-turbo',
        api_key: { name: 'AzureOAIAPIKey', type: 'secret', uuid: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b' },
        api_type: 'azure',
        base_url: 'https://api.openai.com/v1',
        api_version: '2024-02-01',
        temperature: 0.8,
      },
      created_at: '2024-08-08T09:09:52.523000Z',
      updated_at: '2024-08-08T09:09:52.523000Z',
    });

    expect(userProperties[0].type_name).toBe('secret');
    propertySchemaParser.setActiveModelObj(userProperties[0]);

    propName = propertySchemaParser.findFirstReferringPropertyName(userProperties[0].uuid);
    expect(propName).toStrictEqual(expectedProperty);
  });

  test('Should update the default value of ref and non-fields dropdowns for LLM', () => {
    const userProperties: UserProperties[] = _.cloneDeep(llmUserProperties);
    // append the following to the userProperties
    userProperties.push(
      {
        uuid: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b',
        user_uuid: 'b0014b3f-bb43-4f64-8732-bb9444d13f7b',
        type_name: 'secret',
        model_name: 'AzureOAIAPIKey',
        json_str: { name: 'secret 2', api_key: 'asd*****dasd' }, // pragma: allowlist secret
        created_at: '2024-08-08T08:59:02.111000Z',
        updated_at: '2024-08-08T08:59:02.111000Z',
      },
      {
        uuid: 'bd945991-c142-4863-a96b-d81cc03e99de',
        user_uuid: 'b0014b3f-bb43-4f64-8732-bb9444d13f7b',
        type_name: 'llm',
        model_name: 'AzureOAI',
        json_str: {
          name: 'LLM 2',
          model: 'gpt-4',
          api_key: { name: 'AzureOAIAPIKey', type: 'secret', uuid: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b' },
          api_type: 'azure',
          base_url: 'https://api.openai.com/v1',
          api_version: '2024-03-01-preview',
          temperature: 2,
        },
        created_at: '2024-08-08T09:09:52.523000Z',
        updated_at: '2024-08-08T09:09:52.523000Z',
      }
    );

    const activeProperty = 'llm';
    const propertySchemaParser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    propertySchemaParser.setActiveModel('AzureOAI');
    expect(propertySchemaParser).toBeInstanceOf(PropertySchemaParser);

    propertySchemaParser.setUserProperties(userProperties);
    expect(propertySchemaParser.getUserProperties()).toEqual(userProperties);

    const schema = propertySchemaParser.getSchemaForModel();
    expect(schema).toEqual(mockPropertieSchemas.list_of_schemas[1].schemas[1]);

    propertySchemaParser.setUserFlow(UserFlow.UPDATE_MODEL);
    expect(userProperties[3].type_name).toBe('llm');
    propertySchemaParser.setActiveModelObj(userProperties[3]);

    let defaultValues = propertySchemaParser.getDefaultValues();
    let expectedDefaultValues = {
      name: 'LLM 2',
      model: 'gpt-4',
      api_key: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b', // pragma: allowlist secret
      base_url: 'https://api.openai.com/v1',
      api_type: 'azure',
      api_version: '2024-03-01-preview',
      temperature: 2,
    };
    expect(defaultValues).toEqual(expectedDefaultValues);

    let refFields = propertySchemaParser.getRefFields();
    expect(refFields).toEqual({
      api_key: {
        property: [userProperties[0], userProperties[2]],
        htmlForSelectBox: {
          default: { value: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b', label: 'secret 2' },
          description: '',
          enum: [
            { value: 'b9714b3f-bb43-4f64-8732-bb9444d13f7b', label: 'secret' },
            { value: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b', label: 'secret 2' },
          ],
          title: 'Api Key',
        },
        isOptional: false,
        initialFormValue: 'a0014b3f-bb43-4f64-8732-bb9444d13f7b',
      },
    });

    let nonRefButDropdownFields = propertySchemaParser.getNonRefButDropdownFields();
    expect(nonRefButDropdownFields).toEqual({
      api_type: {
        htmlForSelectBox: {
          description: '',
          title: 'Api Type',
          default: { value: 'azure', label: 'azure' },
          enum: [{ value: 'azure', label: 'azure' }],
        },
        initialFormValue: 'azure',
      },
      api_version: {
        htmlForSelectBox: {
          description: '',
          title: 'Api Version',
          default: { value: '2024-03-01-preview', label: '2024-03-01-preview' },
          enum: [
            {
              label: '2023-05-15',
              value: '2023-05-15',
            },
            {
              label: '2023-06-01-preview',
              value: '2023-06-01-preview',
            },
            {
              label: '2023-10-01-preview',
              value: '2023-10-01-preview',
            },
            {
              label: '2024-02-15-preview',
              value: '2024-02-15-preview',
            },
            {
              label: '2024-03-01-preview',
              value: '2024-03-01-preview',
            },
            {
              label: '2024-04-01-preview',
              value: '2024-04-01-preview',
            },
            {
              label: '2024-05-01-preview',
              value: '2024-05-01-preview',
            },
            {
              label: '2024-02-01',
              value: '2024-02-01',
            },
          ],
        },
        initialFormValue: '2024-03-01-preview',
      },
    });
  });

  test('Should update the default value of non-fields dropdowns for LLM', () => {
    const userProperties: UserProperties[] = _.cloneDeep(llmUserProperties);
    userProperties.push(
      {
        uuid: '33b3b1f2-572b-4f55-86c8-3b906442040d',
        user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
        type_name: 'secret',
        model_name: 'AnthropicAPIKey',
        json_str: {
          name: 'Anthropic 2',
          api_key: 'sk-***********-gAA', // pragma: allowlist secret
        },
        created_at: '2024-08-09T04:41:26.873000Z',
        updated_at: '2024-08-09T04:41:26.873000Z',
      },
      {
        uuid: '41cd9228-aca4-4429-8f28-08cedcfbfe49',
        user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
        type_name: 'llm',
        model_name: 'Anthropic',
        json_str: {
          name: 'Anthropic',
          model: 'claude-3-opus-20240229',
          api_key: { name: 'AnthropicAPIKey', type: 'secret', uuid: '33b3b1f2-572b-4f55-86c8-3b906442040d' },
          api_type: 'anthropic',
          base_url: 'https://api.anthropic.com/v1',
          temperature: 0.8,
        },
        created_at: '2024-08-09T05:21:29.518000Z',
        updated_at: '2024-08-09T05:21:36.981000Z',
      }
    );

    const activeProperty = 'llm';
    const propertySchemaParser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    propertySchemaParser.setActiveModelObj(userProperties[3]);
    expect(propertySchemaParser).toBeInstanceOf(PropertySchemaParser);

    propertySchemaParser.setUserProperties(userProperties);
    expect(propertySchemaParser.getUserProperties()).toEqual(userProperties);

    propertySchemaParser.setUserFlow(UserFlow.UPDATE_MODEL);
    expect(userProperties[3].type_name).toBe('llm');

    let defaultValues = propertySchemaParser.getDefaultValues();
    // @ts-ignore
    const expectedDefaultValues = {
      name: 'Anthropic',
      model: 'claude-3-opus-20240229',
      api_key: '33b3b1f2-572b-4f55-86c8-3b906442040d', // pragma: allowlist secret
      base_url: 'https://api.anthropic.com/v1',
      api_type: 'anthropic',
      temperature: 0.8,
    };
    expect(defaultValues).toEqual(expectedDefaultValues);

    const nonRefButDropdownFields = propertySchemaParser.getNonRefButDropdownFields();
    expect(nonRefButDropdownFields).toEqual({
      model: {
        htmlForSelectBox: {
          description: '',
          enum: [
            {
              label: 'claude-3-5-sonnet-20240620',
              value: 'claude-3-5-sonnet-20240620',
            },
            {
              label: 'claude-3-opus-20240229',
              value: 'claude-3-opus-20240229',
            },
            {
              label: 'claude-3-sonnet-20240229',
              value: 'claude-3-sonnet-20240229',
            },
            {
              label: 'claude-3-haiku-20240307',
              value: 'claude-3-haiku-20240307',
            },
          ],
          default: {
            label: 'claude-3-opus-20240229',
            value: 'claude-3-opus-20240229',
          },
          title: 'Model',
        },
        initialFormValue: 'claude-3-opus-20240229',
      },
      api_type: {
        htmlForSelectBox: {
          description: '',
          enum: [
            {
              label: 'anthropic',
              value: 'anthropic',
            },
          ],
          default: {
            label: 'anthropic',
            value: 'anthropic',
          },
          title: 'Api Type',
        },
        initialFormValue: 'anthropic',
      },
    });
  });

  test('Should handle schema with multiple reference fields', () => {
    const property: PropertiesSchema = {
      list_of_schemas: [
        {
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

    const activeProperty = 'multiref';
    const parser = new PropertySchemaParser(property, activeProperty);
    parser.setActiveModel('MultiRefSchema');
    parser.setUserProperties(userProperties);

    const defaultValues = parser.getDefaultValues();
    const refFields = parser.getRefFields();
    expect(refFields).toEqual({
      ref1: {
        property: [userProperties[0]],
        htmlForSelectBox: {
          default: { value: '1', label: 'Ref1 Instance' },
          description: '',
          enum: [{ value: '1', label: 'Ref1 Instance' }],
          title: 'Ref1',
        },
        isOptional: false,
        initialFormValue: '1',
      },
      ref2: {
        property: [userProperties[1]],
        htmlForSelectBox: {
          default: { value: '2', label: 'Ref2 Instance' },
          description: '',
          enum: [{ value: '2', label: 'Ref2 Instance' }],
          title: 'Ref2',
        },
        isOptional: false,
        initialFormValue: '2',
      },
    });

    expect(Object.keys(refFields)).toHaveLength(2);
    expect(defaultValues).toEqual({
      name: '',
      ref1: '1',
      ref2: '2',
      api_type: 'multiref',
    });
  });

  test('Should handle when no matching user properties are found for a reference field', () => {
    const property: PropertiesSchema = {
      list_of_schemas: [
        {
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
    const activeProperty = 'nomatch';
    const parser = new PropertySchemaParser(property, activeProperty);
    parser.setActiveModel('NoMatchSchema');
    parser.setUserProperties(userProperties);

    const defaultValues = parser.getDefaultValues();
    const refFields = parser.getRefFields();

    expect(refFields.ref.property).toHaveLength(0);
    expect(refFields.ref.htmlForSelectBox.enum).toStrictEqual([]);
    expect(defaultValues).toEqual({
      name: '',
      ref: null,
      api_type: 'nomatch',
    });
  });

  test('Should handle when multiple matching user properties are found for a reference field', () => {
    const property: PropertiesSchema = {
      list_of_schemas: [
        {
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
    const activeProperty = 'multimatch';
    const parser = new PropertySchemaParser(property, activeProperty);
    parser.setActiveModel('MultiMatchSchema');
    parser.setUserProperties(userProperties);

    const defaultValues = parser.getDefaultValues();
    const refFields = parser.getRefFields();

    expect(refFields.ref.property).toHaveLength(2);
    expect(refFields.ref.htmlForSelectBox.enum).toEqual([
      { value: '1', label: 'MultiRef Instance 1' },
      { value: '2', label: 'MultiRef Instance 2' },
    ]);
    expect(defaultValues).toEqual({
      name: '',
      ref: '1',
      api_type: 'multimatch',
    });
  });

  test('Should render toolbox - without reference', () => {
    const activeProperty = 'toolbox';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('toolbox');

    let defaultValues = parser.getDefaultValues();
    expect(defaultValues).toEqual({ name: '', openapi_url: '', openapi_auth: null });
    let refFields = parser.getRefFields();
    expect(refFields).toEqual({
      openapi_auth: {
        property: [],
        htmlForSelectBox: { description: '', enum: [], default: null, title: 'Openapi Auth' },
        initialFormValue: null,
        isOptional: true,
      },
    });
  });
  test('Should render toolbox - with reference', () => {
    const userProperties: UserProperties[] = [
      {
        uuid: '06936c73-f22b-4c69-b107-6f8f9a4982bc',
        user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
        type_name: 'secret',
        model_name: 'OpenAPIAuth',
        json_str: {
          name: 'OpenAIAPI Auth Key',
          password: 'password', // pragma: allowlist secret
          username: 'username',
        },
        created_at: '2024-08-09T11:38:45.093000Z',
        updated_at: '2024-08-09T11:38:45.093000Z',
      },
    ];

    const activeProperty = 'toolbox';
    const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
    parser.setActiveModel('toolbox');
    parser.setUserProperties(userProperties);

    let defaultValues = parser.getDefaultValues();
    expect(defaultValues).toEqual({ name: '', openapi_url: '', openapi_auth: null });

    const refFields = parser.getRefFields();
    expect(refFields).toEqual({
      openapi_auth: {
        property: [userProperties[0]],
        htmlForSelectBox: {
          description: '',
          enum: [{ label: 'OpenAIAPI Auth Key', value: '06936c73-f22b-4c69-b107-6f8f9a4982bc' }],
          default: null,
          title: 'Openapi Auth',
        },
        initialFormValue: null,
        isOptional: true,
      },
    });
  });
});
