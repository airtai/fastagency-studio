import { ListOfSchemas, PropertiesSchema } from '../interfaces/BuildPageInterfaces';

import { UserProperties } from '../components/buildPage/PropertySchemaParser';

export const mockProps = {
  activeProperty: 'secret',
  propertiesSchema: {
    list_of_schemas: [
      {
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
      },
      {
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
        ],
      },
    ],
  },
  sideNavItemClickCount: 0,
};

export const mockPropertieSchemas: PropertiesSchema = {
  list_of_schemas: [
    {
      name: 'secret',
      schemas: [
        {
          name: 'AnthropicAPIKey',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              api_key: {
                description: 'The API Key from Anthropic',
                title: 'Api Key',
                type: 'string',
              },
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
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              api_key: {
                description: 'The API Key from Azure OpenAI',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['name', 'api_key'],
            title: 'AzureOAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'OpenAIAPIKey',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              api_key: {
                description: 'The API Key from OpenAI',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['name', 'api_key'],
            title: 'OpenAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'TogetherAIAPIKey',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              api_key: {
                description: 'The API Key from Together.ai',
                maxLength: 64,
                minLength: 64,
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['name', 'api_key'],
            title: 'TogetherAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'OpenAPIAuth',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              username: {
                description: 'username for openapi routes authentication',
                title: 'Username',
                type: 'string',
              },
              password: {
                description: 'password for openapi routes authentication',
                title: 'Password',
                type: 'string',
              },
            },
            required: ['name', 'username', 'password'],
            title: 'OpenAPIAuth',
            type: 'object',
          },
        },
        {
          name: 'BingAPIKey',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              api_key: {
                description: 'The API Key from Bing',
                title: 'Api Key',
                type: 'string',
              },
            },
            required: ['name', 'api_key'],
            title: 'BingAPIKey',
            type: 'object',
          },
        },
        {
          name: 'FlyToken',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              fly_token: {
                description: 'The Fly.io token to use for deploying the deployment',
                title: 'Fly Token',
                type: 'string',
              },
            },
            required: ['name', 'fly_token'],
            title: 'FlyToken',
            type: 'object',
          },
        },
        {
          name: 'GitHubToken',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              gh_token: {
                description: 'The GitHub token to use for creating a new repository',
                title: 'Gh Token',
                type: 'string',
              },
            },
            required: ['name', 'gh_token'],
            title: 'GitHubToken',
            type: 'object',
          },
        },
      ],
    },
    {
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
    },
    {
      name: 'toolbox',
      schemas: [
        {
          name: 'Toolbox',
          json_schema: {
            $defs: {
              OpenAPIAuthRef: {
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
                    const: 'OpenAPIAuth',
                    default: 'OpenAPIAuth',
                    description: 'The name of the data',
                    enum: ['OpenAPIAuth'],
                    title: 'Name',
                    type: 'string',
                  },
                  uuid: { description: 'The unique identifier', format: 'uuid', title: 'UUID', type: 'string' },
                },
                required: ['uuid'],
                title: 'OpenAPIAuthRef',
                type: 'object',
              },
            },
            properties: {
              name: { description: 'The name of the item', minLength: 1, title: 'Name', type: 'string' },
              openapi_url: {
                description: 'The URL of OpenAPI specification file',
                format: 'uri',
                maxLength: 2083,
                minLength: 1,
                title: 'OpenAPI URL',
                type: 'string',
              },
              openapi_auth: {
                anyOf: [{ $ref: '#/$defs/OpenAPIAuthRef' }, { type: 'null' }],
                default: null,
                description: 'Authentication information for the API mentioned in the OpenAPI specification',
                title: 'OpenAPI Auth',
              },
            },
            required: ['name', 'openapi_url'],
            title: 'Toolbox',
            type: 'object',
          },
        },
      ],
    },
  ],
};

export const llmProperty: ListOfSchemas = {
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
export const llmUserProperties: UserProperties[] = [
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
