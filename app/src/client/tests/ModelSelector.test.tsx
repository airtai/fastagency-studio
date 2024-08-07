import React from 'react';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { renderInContext } from 'wasp/client/test';
import selectEvent from 'react-select-event';

import { ModelSelector } from '../components/buildPage/ModelSelector';
import { ListOfSchemas } from '../interfaces/BuildPageInterfacesNew';

const mockPropertySchemasList: ListOfSchemas = {
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
  ],
};

const mocksetModelName = vi.fn();

describe('ModelSelector', () => {
  it('renders correctly with provided props', () => {
    renderInContext(
      <ModelSelector
        propertySchemasList={mockPropertySchemasList}
        propertyName='Secret'
        setModelName={mocksetModelName}
      />
    );
    expect(screen.getByText('Select Secret')).toBeInTheDocument();
  });

  it('renders correct number of options', () => {
    const { getByRole } = renderInContext(
      <ModelSelector
        propertySchemasList={mockPropertySchemasList}
        propertyName='Secret'
        setModelName={mocksetModelName}
      />
    );

    expect(screen.getByText('Select Secret')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(mockPropertySchemasList.schemas.length);
  });

  it('calls setModelName with correct value when option is selected', async () => {
    const { getByRole, getByText } = renderInContext(
      <ModelSelector
        propertySchemasList={mockPropertySchemasList}
        propertyName='Secret'
        setModelName={mocksetModelName}
      />
    );

    expect(getByText('AnthropicAPIKey')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'AzureOAIAPIKey');

    expect(mocksetModelName).toHaveBeenCalledWith('AzureOAIAPIKey');
  });
});
