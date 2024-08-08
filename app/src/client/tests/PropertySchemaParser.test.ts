import { test, expect, describe } from 'vitest';

import { PropertySchemaParser } from '../components/buildPage/PropertySchemaParser';

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

    // @ts-ignore
    const defaultValues = propertySchemaParser.getDefaultValues(schema);
    const expectedDefaultValues = { name: '', api_key: '' };
    expect(defaultValues).toEqual(expectedDefaultValues);
  });
});
