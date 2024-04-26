import { test, expect, describe } from 'vitest';

import { JsonSchema } from '../interfaces/BuildPageInterfaces';
import { flattenSchema } from '../utils/schemaParser';

describe('NotificationBox', () => {
  test('Flattern JSON schema', () => {
    const input: JsonSchema = {
      $defs: {
        AzureOAIAPIKey: {
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
        data: {
          allOf: [
            {
              $ref: '#/$defs/AzureOAIAPIKey',
            },
          ],
          description: 'The data',
        },
      },
      required: ['uuid', 'data'],
      title: 'AzureOAIAPIKey',
      type: 'object',
    };
    const expected = {
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
        data: [
          {
            AzureOAIAPIKey: {
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
        ],
      },
    };
    const actual = flattenSchema(input);
    expect(actual).toEqual(expected);
  });
});
