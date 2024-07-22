// import { renderHook, waitFor } from '@testing-library/react';
import { test, expect, describe, it } from 'vitest';
import { getTargetModel } from '../components/buildPage/UserPropertyHandler';
import _ from 'lodash';

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
