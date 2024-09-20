import { vi } from 'vitest';

import { ListOfSchemas, PropertiesSchema } from '../interfaces/BuildPageInterfaces';

import { UserProperties } from '../components/buildPage/PropertySchemaParser';
import _ from 'lodash';

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
                metadata: {
                  tooltip_message:
                    'The API key specified here will be used to authenticate requests to Anthropic services.',
                },
                title: 'API Key',
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
                metadata: {
                  tooltip_message:
                    'The API key specified here will be used to authenticate requests to Azure OpenAI services.',
                },
                title: 'API Key',
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
                metadata: {
                  tooltip_message:
                    'The API key specified here will be used to authenticate requests to OpenAI services.',
                },
                title: 'API Key',
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
                description: 'The API Key from Together AI',
                maxLength: 64,
                metadata: {
                  tooltip_message:
                    'The API key specified here will be used to authenticate requests to Together AI services.',
                },
                minLength: 64,
                title: 'API Key',
                type: 'string',
              },
            },
            required: ['name', 'api_key'],
            title: 'TogetherAIAPIKey',
            type: 'object',
          },
        },
        {
          name: 'OpenAPIAuthToken',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              token: {
                description: 'Authentication token for OpenAPI routes',
                metadata: {
                  tooltip_message: 'The token specified here will be used to authenticate requests to OpenAPI routes.',
                },
                title: 'Token',
                type: 'string',
              },
            },
            required: ['name', 'token'],
            title: 'OpenAPIAuthToken',
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
                description: 'Username for OpenAPI routes authentication',
                title: 'Username',
                type: 'string',
              },
              password: {
                description: 'Password for OpenAPI routes authentication',
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
                metadata: {
                  tooltip_message: 'The API key specified here will be used to authenticate requests to Bing services.',
                },
                title: 'API Key',
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
                metadata: {
                  tooltip_message:
                    'The token specified here will be used to authenticate your access to Fly.io services.',
                },
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
                metadata: {
                  tooltip_message:
                    'The token specified here will be used to authenticate your access to GitHub services.',
                },
                title: 'GH Token',
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
                  uuid: {
                    description: 'The unique identifier',
                    format: 'uuid',
                    title: 'UUID',
                    type: 'string',
                  },
                },
                required: ['uuid'],
                title: 'AnthropicAPIKeyRef',
                type: 'object',
              },
            },
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              model: {
                default: 'claude-3-5-sonnet-20240620',
                description: "The model to use for the Anthropic API, e.g. 'claude-3-5-sonnet-20240620'",
                enum: [
                  'claude-3-5-sonnet-20240620',
                  'claude-3-opus-20240229',
                  'claude-3-sonnet-20240229',
                  'claude-3-haiku-20240307',
                ],
                metadata: {
                  tooltip_message: 'Choose the model that the LLM should use to generate responses.',
                },
                title: 'Model',
                type: 'string',
              },
              api_key: {
                allOf: [
                  {
                    $ref: '#/$defs/AnthropicAPIKeyRef',
                  },
                ],
                description: 'The API Key from Anthropic',
                metadata: {
                  tooltip_message:
                    'Choose the API key that will be used to authenticate requests to Anthropic services.',
                },
                title: 'API Key',
              },
              base_url: {
                default: 'https://api.anthropic.com/v1',
                description: 'The base URL of the Anthropic API',
                format: 'uri',
                maxLength: 2083,
                metadata: {
                  tooltip_message: 'The base URL that the LLM uses to interact with Anthropic services.',
                },
                minLength: 1,
                title: 'Base URL',
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
                metadata: {
                  tooltip_message:
                    'Adjust the temperature to change the response style. Lower values lead to more consistent answers, while higher values make the responses more creative. The values must be between 0 and 2.',
                },
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
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              model: {
                default: 'gpt-3.5-turbo',
                description: "The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'",
                metadata: {
                  tooltip_message: 'The model that the LLM uses to interact with Azure OpenAI services.',
                },
                title: 'Model',
                type: 'string',
              },
              api_key: {
                allOf: [
                  {
                    $ref: '#/$defs/AzureOAIAPIKeyRef',
                  },
                ],
                description: 'The API Key from Azure OpenAI',
                metadata: {
                  tooltip_message:
                    'Choose the API key that will be used to authenticate requests to Azure OpenAI services.',
                },
                title: 'API Key',
              },
              base_url: {
                default: 'https://{your-resource-name}.openai.azure.com',
                description: 'The base URL of the Azure OpenAI API',
                format: 'uri',
                maxLength: 2083,
                metadata: {
                  tooltip_message: 'The base URL that the LLM uses to interact with Azure OpenAI services.',
                },
                minLength: 1,
                title: 'Base URL',
                type: 'string',
              },
              api_type: {
                const: 'azure',
                default: 'azure',
                description: "The type of the API, must be 'azure'",
                enum: ['azure'],
                title: 'API Type',
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
                metadata: {
                  tooltip_message:
                    'The version of the Azure OpenAI API that the LLM uses to interact with Azure OpenAI services.',
                },
                title: 'API Version',
                type: 'string',
              },
              temperature: {
                default: 0.8,
                description: 'The temperature to use for the model, must be between 0 and 2',
                maximum: 2,
                metadata: {
                  tooltip_message:
                    'Adjust the temperature to change the response style. Lower values lead to more consistent answers, while higher values make the responses more creative. The values must be between 0 and 2.',
                },
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
                  uuid: {
                    description: 'The unique identifier',
                    format: 'uuid',
                    title: 'UUID',
                    type: 'string',
                  },
                },
                required: ['uuid'],
                title: 'OpenAPIAuthRef',
                type: 'object',
              },
              OpenAPIAuthTokenRef: {
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
                    const: 'OpenAPIAuthToken',
                    default: 'OpenAPIAuthToken',
                    description: 'The name of the data',
                    enum: ['OpenAPIAuthToken'],
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
                title: 'OpenAPIAuthTokenRef',
                type: 'object',
              },
            },
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              openapi_url: {
                description: 'The URL of OpenAPI specification file',
                format: 'uri',
                maxLength: 2083,
                metadata: {
                  tooltip_message:
                    "Enter the URL of the openapi.json file for your hosted OpenAPI docs. For example, if your docs are hosted at 'https://weather.tools.fastagency.ai/docs', enter 'https://weather.tools.fastagency.ai/openapi.json'.",
                },
                minLength: 1,
                title: 'OpenAPI URL',
                type: 'string',
              },
              openapi_auth: {
                anyOf: [
                  {
                    $ref: '#/$defs/OpenAPIAuthTokenRef',
                  },
                  {
                    $ref: '#/$defs/OpenAPIAuthRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Authentication information for the API mentioned in the OpenAPI specification',
                metadata: {
                  tooltip_message:
                    'Choose the authentication method that will be used to authenticate requests to the above OpenAPI routes. Leave this field as it is if the OpenAPI routes do not require authentication.',
                },
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
    {
      name: 'agent',
      schemas: [
        {
          name: 'AssistantAgent',
          json_schema: {
            $defs: {
              AnthropicRef: {
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
                    const: 'Anthropic',
                    default: 'Anthropic',
                    description: 'The name of the data',
                    enum: ['Anthropic'],
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
                title: 'AnthropicRef',
                type: 'object',
              },
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
              TogetherAIRef: {
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
                    const: 'TogetherAI',
                    default: 'TogetherAI',
                    description: 'The name of the data',
                    enum: ['TogetherAI'],
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
                title: 'TogetherAIRef',
                type: 'object',
              },
              ToolboxRef: {
                properties: {
                  type: {
                    const: 'toolbox',
                    default: 'toolbox',
                    description: 'The name of the type of the data',
                    enum: ['toolbox'],
                    title: 'Type',
                    type: 'string',
                  },
                  name: {
                    const: 'Toolbox',
                    default: 'Toolbox',
                    description: 'The name of the data',
                    enum: ['Toolbox'],
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
                title: 'ToolboxRef',
                type: 'object',
              },
            },
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              llm: {
                anyOf: [
                  {
                    $ref: '#/$defs/AnthropicRef',
                  },
                  {
                    $ref: '#/$defs/AzureOAIRef',
                  },
                  {
                    $ref: '#/$defs/OpenAIRef',
                  },
                  {
                    $ref: '#/$defs/TogetherAIRef',
                  },
                ],
                description: 'LLM used by the agent for producing responses',
                metadata: {
                  tooltip_message: 'Choose the LLM the agent will use to generate responses.',
                },
                title: 'LLM',
              },
              toolbox_1: {
                anyOf: [
                  {
                    $ref: '#/$defs/ToolboxRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Toolbox used by the agent for producing responses',
                metadata: {
                  tooltip_message:
                    'Choose the toolbox that the agent will use automatically when needed to solve user queries.',
                },
                title: 'Toolbox',
              },
              toolbox_2: {
                anyOf: [
                  {
                    $ref: '#/$defs/ToolboxRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Toolbox used by the agent for producing responses',
                metadata: {
                  tooltip_message:
                    'Choose the toolbox that the agent will use automatically when needed to solve user queries.',
                },
                title: 'Toolbox',
              },
              toolbox_3: {
                anyOf: [
                  {
                    $ref: '#/$defs/ToolboxRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Toolbox used by the agent for producing responses',
                metadata: {
                  tooltip_message:
                    'Choose the toolbox that the agent will use automatically when needed to solve user queries.',
                },
                title: 'Toolbox',
              },
              system_message: {
                default:
                  "You are a helpful assistant. After you successfully answer all questions and there are no new questions asked after your response (e.g. there is no specific direction or question asked after you give a response), terminate the chat by outputting 'TERMINATE' (IMPORTANT: use all caps)",
                description:
                  'The system message of the agent. This message is used to inform the agent about his role in the conversation',
                metadata: {
                  tooltip_message:
                    "The system message defines the agent's role and influences its responses. For example, telling the agent 'You are an expert in travel advice' will make its responses focus on travel.",
                },
                title: 'System Message',
                type: 'string',
              },
            },
            required: ['name', 'llm'],
            title: 'AssistantAgent',
            type: 'object',
          },
        },
        {
          name: 'UserProxyAgent',
          json_schema: {
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              max_consecutive_auto_reply: {
                anyOf: [
                  {
                    type: 'integer',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'The maximum number of consecutive auto-replies the agent can make',
                metadata: {
                  tooltip_message:
                    'Set the maximum number of consecutive auto replies the agent can make before requiring human approval. A higher value gives the agent more autonomy, while leaving it blank prompts permission for each reply. For example, if you set this to 2, the agent will reply twice and then require human approval before replying again.',
                },
                title: 'Max Consecutive Auto Reply',
              },
            },
            required: ['name'],
            title: 'UserProxyAgent',
            type: 'object',
          },
        },
        {
          name: 'WebSurferAgent',
          json_schema: {
            $defs: {
              AnthropicRef: {
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
                    const: 'Anthropic',
                    default: 'Anthropic',
                    description: 'The name of the data',
                    enum: ['Anthropic'],
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
                title: 'AnthropicRef',
                type: 'object',
              },
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
              TogetherAIRef: {
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
                    const: 'TogetherAI',
                    default: 'TogetherAI',
                    description: 'The name of the data',
                    enum: ['TogetherAI'],
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
                title: 'TogetherAIRef',
                type: 'object',
              },
              ToolboxRef: {
                properties: {
                  type: {
                    const: 'toolbox',
                    default: 'toolbox',
                    description: 'The name of the type of the data',
                    enum: ['toolbox'],
                    title: 'Type',
                    type: 'string',
                  },
                  name: {
                    const: 'Toolbox',
                    default: 'Toolbox',
                    description: 'The name of the data',
                    enum: ['Toolbox'],
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
                title: 'ToolboxRef',
                type: 'object',
              },
            },
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              llm: {
                anyOf: [
                  {
                    $ref: '#/$defs/AnthropicRef',
                  },
                  {
                    $ref: '#/$defs/AzureOAIRef',
                  },
                  {
                    $ref: '#/$defs/OpenAIRef',
                  },
                  {
                    $ref: '#/$defs/TogetherAIRef',
                  },
                ],
                description: 'LLM used by the agent for producing responses',
                metadata: {
                  tooltip_message: 'Choose the LLM the agent will use to generate responses.',
                },
                title: 'LLM',
              },
              toolbox_1: {
                anyOf: [
                  {
                    $ref: '#/$defs/ToolboxRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Toolbox used by the agent for producing responses',
                metadata: {
                  tooltip_message:
                    'Choose the toolbox that the agent will use automatically when needed to solve user queries.',
                },
                title: 'Toolbox',
              },
              toolbox_2: {
                anyOf: [
                  {
                    $ref: '#/$defs/ToolboxRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Toolbox used by the agent for producing responses',
                metadata: {
                  tooltip_message:
                    'Choose the toolbox that the agent will use automatically when needed to solve user queries.',
                },
                title: 'Toolbox',
              },
              toolbox_3: {
                anyOf: [
                  {
                    $ref: '#/$defs/ToolboxRef',
                  },
                  {
                    type: 'null',
                  },
                ],
                default: null,
                description: 'Toolbox used by the agent for producing responses',
                metadata: {
                  tooltip_message:
                    'Choose the toolbox that the agent will use automatically when needed to solve user queries.',
                },
                title: 'Toolbox',
              },
              summarizer_llm: {
                anyOf: [
                  {
                    $ref: '#/$defs/AnthropicRef',
                  },
                  {
                    $ref: '#/$defs/AzureOAIRef',
                  },
                  {
                    $ref: '#/$defs/OpenAIRef',
                  },
                  {
                    $ref: '#/$defs/TogetherAIRef',
                  },
                ],
                description: 'This LLM will be used to generated summary of all pages visited',
                metadata: {
                  tooltip_message:
                    'Select the summarizer LLM, which is used for generating precise and accurate summaries of web pages, while the LLM chosen above is used for handling regular web searches.',
                },
                title: 'Summarizer LLM',
              },
              viewport_size: {
                default: 4096,
                description: 'The viewport size of the browser',
                metadata: {
                  tooltip_message:
                    'Viewport size refers to the visible area of a webpage in the browser. Default is 4096. Modify only if a custom size is needed.',
                },
                title: 'Viewport Size',
                type: 'integer',
              },
              bing_api_key: {
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
                metadata: {
                  tooltip_message:
                    "Choose a Bing API key to allow the browser to access Bing's search and data services, improving information retrieval.",
                },
                title: 'Bing API Key',
              },
            },
            required: ['name', 'llm', 'summarizer_llm'],
            title: 'WebSurferAgent',
            type: 'object',
          },
        },
      ],
    },
    {
      name: 'team',
      schemas: [
        {
          name: 'TwoAgentTeam',
          json_schema: {
            $defs: {
              AssistantAgentRef: {
                properties: {
                  type: {
                    const: 'agent',
                    default: 'agent',
                    description: 'The name of the type of the data',
                    enum: ['agent'],
                    title: 'Type',
                    type: 'string',
                  },
                  name: {
                    const: 'AssistantAgent',
                    default: 'AssistantAgent',
                    description: 'The name of the data',
                    enum: ['AssistantAgent'],
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
                title: 'AssistantAgentRef',
                type: 'object',
              },
              UserProxyAgentRef: {
                properties: {
                  type: {
                    const: 'agent',
                    default: 'agent',
                    description: 'The name of the type of the data',
                    enum: ['agent'],
                    title: 'Type',
                    type: 'string',
                  },
                  name: {
                    const: 'UserProxyAgent',
                    default: 'UserProxyAgent',
                    description: 'The name of the data',
                    enum: ['UserProxyAgent'],
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
                title: 'UserProxyAgentRef',
                type: 'object',
              },
              WebSurferAgentRef: {
                properties: {
                  type: {
                    const: 'agent',
                    default: 'agent',
                    description: 'The name of the type of the data',
                    enum: ['agent'],
                    title: 'Type',
                    type: 'string',
                  },
                  name: {
                    const: 'WebSurferAgent',
                    default: 'WebSurferAgent',
                    description: 'The name of the data',
                    enum: ['WebSurferAgent'],
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
                title: 'WebSurferAgentRef',
                type: 'object',
              },
            },
            properties: {
              name: {
                description: 'The name of the item',
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              is_termination_msg_regex: {
                default: 'TERMINATE',
                description:
                  'Whether the message is a termination message or not. If it is a termination message, the chat will terminate.',
                metadata: {
                  tooltip_message:
                    'The termination message regular expression format. The LLM uses this pattern to decide when to end the chat if the message matches.',
                },
                title: 'Is Termination Msg Regex',
                type: 'string',
              },
              human_input_mode: {
                default: 'ALWAYS',
                description: 'Mode for human input',
                enum: ['ALWAYS', 'TERMINATE', 'NEVER'],
                metadata: {
                  tooltip_message:
                    'Select the human input mode to control the level of human involvement. Modes include NEVER (full autonomy), TERMINATE (human input requested upon termination), and ALWAYS (input required after every message).',
                },
                title: 'Human Input Mode',
                type: 'string',
              },
              initial_agent: {
                anyOf: [
                  {
                    $ref: '#/$defs/AssistantAgentRef',
                  },
                  {
                    $ref: '#/$defs/UserProxyAgentRef',
                  },
                  {
                    $ref: '#/$defs/WebSurferAgentRef',
                  },
                ],
                description: 'Agent that starts the conversation',
                metadata: {
                  tooltip_message:
                    'Select the Initial Agent, the agent responsible for task orchestration. It interacts with users and assigns tasks to Secondary Agent, enhancing the efficiency of complex operations.',
                },
                title: 'Initial Agent',
              },
              secondary_agent: {
                anyOf: [
                  {
                    $ref: '#/$defs/AssistantAgentRef',
                  },
                  {
                    $ref: '#/$defs/UserProxyAgentRef',
                  },
                  {
                    $ref: '#/$defs/WebSurferAgentRef',
                  },
                ],
                description: 'Agent that continues the conversation',
                metadata: {
                  tooltip_message:
                    'Select the Secondary Agent, the agent responsible for collaborating with the Initial Agent in performing specialized tasks. Secondary Agents enhance efficiency by focusing on specific roles, such as data analysis or code execution.',
                },
                title: 'Secondary Agent',
              },
            },
            required: ['name', 'initial_agent', 'secondary_agent'],
            title: 'TwoAgentTeam',
            type: 'object',
          },
        },
      ],
    },
    {
      name: 'deployment',
      schemas: [
        {
          name: 'Deployment',
          json_schema: {
            $defs: {
              FlyTokenRef: {
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
                    const: 'FlyToken',
                    default: 'FlyToken',
                    description: 'The name of the data',
                    enum: ['FlyToken'],
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
                title: 'FlyTokenRef',
                type: 'object',
              },
              GitHubTokenRef: {
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
                    const: 'GitHubToken',
                    default: 'GitHubToken',
                    description: 'The name of the data',
                    enum: ['GitHubToken'],
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
                title: 'GitHubTokenRef',
                type: 'object',
              },
              TwoAgentTeamRef: {
                properties: {
                  type: {
                    const: 'team',
                    default: 'team',
                    description: 'The name of the type of the data',
                    enum: ['team'],
                    title: 'Type',
                    type: 'string',
                  },
                  name: {
                    const: 'TwoAgentTeam',
                    default: 'TwoAgentTeam',
                    description: 'The name of the data',
                    enum: ['TwoAgentTeam'],
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
                title: 'TwoAgentTeamRef',
                type: 'object',
              },
            },
            properties: {
              name: {
                description: 'The name of the SaaS application.',
                metadata: {
                  tooltip_message: 'The application name to be used in the deployed SaaS application.',
                },
                minLength: 1,
                title: 'Name',
                type: 'string',
              },
              repo_name: {
                description: 'The name of the GitHub repository.',
                metadata: {
                  immutable_after_creation: true,
                  tooltip_message:
                    'The GitHub repository to be created. If the name contains spaces or special characters, GitHub will adjust it according to its naming rules. A random suffix will be added if the repository name already exists.',
                },
                minLength: 1,
                title: 'Repo Name',
                type: 'string',
              },
              fly_app_name: {
                description: 'The name of the Fly.io application.',
                maxLength: 30,
                metadata: {
                  immutable_after_creation: true,
                  tooltip_message:
                    'The Fly.io application. This will be used to create and deploy your React, Node.js, and PostgreSQL apps to Fly.io.',
                },
                minLength: 1,
                title: 'Fly App Name',
                type: 'string',
              },
              team: {
                allOf: [
                  {
                    $ref: '#/$defs/TwoAgentTeamRef',
                  },
                ],
                description: 'The team that is used in the deployment',
                metadata: {
                  tooltip_message:
                    "Choose the team to be used for deployment. User messages are sent to the Initial agent of the chosen team, and the agent's responses are sent back to the user. This field can be updated anytime to switch teams, with changes reflected in real-time in your deployments.",
                },
                title: 'Team Name',
              },
              gh_token: {
                allOf: [
                  {
                    $ref: '#/$defs/GitHubTokenRef',
                  },
                ],
                description: 'The GitHub token to use for creating a new repository',
                metadata: {
                  immutable_after_creation: true,
                  tooltip_message:
                    'Choose the GitHub token used for authenticating and managing access to your GitHub account.',
                },
                title: 'GH Token',
              },
              fly_token: {
                allOf: [
                  {
                    $ref: '#/$defs/FlyTokenRef',
                  },
                ],
                description: 'The Fly.io token to use for deploying the deployment',
                metadata: {
                  immutable_after_creation: true,
                  tooltip_message:
                    'Choose the Fly.io token used for authenticating and managing access to your Fly.io account.',
                },
                title: 'Fly Token',
              },
            },
            required: ['name', 'repo_name', 'fly_app_name', 'team', 'gh_token', 'fly_token'],
            title: 'Deployment',
            type: 'object',
          },
        },
      ],
    },
  ],
};

export const mockProps = {
  activeProperty: 'secret',
  propertiesSchema: mockPropertieSchemas,
  sideNavItemClickCount: 0,
  setActiveProperty: vi.fn(),
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

// @ts-ignore
export const deploymentUserProperties: UserProperties[] = [
  ..._.cloneDeep(llmUserProperties),
  {
    uuid: '42e34575-2029-4055-9460-3bf5e2745ddf',
    user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
    type_name: 'secret',
    model_name: 'GitHubToken',
    json_str: {
      name: 'GitHub Token',
      gh_token: 'ghp-someRadomToken', // pragma: allowlist secret
    },
    created_at: '2024-09-11T10:00:26.817000Z',
    updated_at: '2024-09-11T10:00:26.817000Z',
  },
  {
    uuid: 'e94cf6f2-f82a-4513-81dc-03adfe8ca9c9',
    user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
    type_name: 'secret',
    model_name: 'FlyToken',
    json_str: {
      name: 'Fly Token',
      fly_token: 'Fly-someRadomToken', // pragma: allowlist secret
    },
    created_at: '2024-09-11T10:00:40.198000Z',
    updated_at: '2024-09-11T10:00:40.198000Z',
  },
  {
    uuid: 'b36dabf6-cc06-4673-8060-68d7b58f6c4e',
    user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
    type_name: 'agent',
    model_name: 'AssistantAgent',
    json_str: {
      llm: {
        name: 'AzureOAI',
        type: 'llm',
        uuid: 'db945991-c142-4863-a96b-d81cc03e99de',
      },
      name: 'Standup_Comedian',
      toolbox_1: null,
      toolbox_2: null,
      toolbox_3: null,
      system_message:
        'As a standup comedian, your task is to deliver short jokes in response to user questions. Whenever people ask who are you or what you do, just say you are "standup comedian"',
    },
    created_at: '2024-09-11T09:50:24.914000Z',
    updated_at: '2024-09-11T09:50:24.914000Z',
  },
  {
    uuid: '2329d22e-ced3-417a-9ff6-b09964512344',
    user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
    type_name: 'agent',
    model_name: 'UserProxyAgent',
    json_str: {
      name: 'UserProxy_Agent',
      max_consecutive_auto_reply: null,
    },
    created_at: '2024-09-11T09:50:34.719000Z',
    updated_at: '2024-09-11T09:50:34.719000Z',
  },
  {
    uuid: '31273537-4cd5-4437-b5d0-222e3549259f',
    user_uuid: 'dae81928-8e99-48c2-be5d-61a5b422cf47',
    type_name: 'team',
    model_name: 'TwoAgentTeam',
    json_str: {
      name: 'Standup Comedian',
      initial_agent: {
        name: 'UserProxyAgent',
        type: 'agent',
        uuid: '2329d22e-ced3-417a-9ff6-b09964512344',
      },
      secondary_agent: {
        name: 'AssistantAgent',
        type: 'agent',
        uuid: 'b36dabf6-cc06-4673-8060-68d7b58f6c4e',
      },
      human_input_mode: 'ALWAYS',
      is_termination_msg_regex: 'TERMINATE',
    },
    created_at: '2024-09-11T09:50:44.674000Z',
    updated_at: '2024-09-11T09:50:44.674000Z',
  },
];
