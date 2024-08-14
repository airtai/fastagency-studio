import React from 'react';

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { renderInContext } from 'wasp/client/test';
import selectEvent from 'react-select-event';

import { ModelSelector } from '../components/buildPage/ModelSelector';
import { PropertySchemaParser, SetActiveModelType } from '../components/buildPage/PropertySchemaParser';
import { mockPropertieSchemas } from './mocks';

const activeProperty = 'secret';
const parser = new PropertySchemaParser(mockPropertieSchemas, activeProperty);
const mockSetActiveModel: SetActiveModelType = vi.fn();

describe('ModelSelector', () => {
  it('renders correct number of options', () => {
    const { getByRole } = renderInContext(<ModelSelector parser={parser} setActiveModel={mockSetActiveModel} />);

    expect(screen.getByText('Select Secret')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(mockPropertieSchemas.list_of_schemas[0].schemas.length);
  });

  it('renders correct number of options', () => {
    const { getByRole } = renderInContext(<ModelSelector parser={parser} setActiveModel={mockSetActiveModel} />);

    expect(screen.getByText('Select Secret')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(mockPropertieSchemas.list_of_schemas[0].schemas.length);
  });

  it('calls setActiveModel with correct value when option is selected', async () => {
    const { getByRole, getByText } = renderInContext(
      <ModelSelector parser={parser} setActiveModel={mockSetActiveModel} />
    );

    expect(getByText('AnthropicAPIKey')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'AzureOAIAPIKey');

    expect(mockSetActiveModel).toHaveBeenCalledWith('AzureOAIAPIKey');
  });
});
