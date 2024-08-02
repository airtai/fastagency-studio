import React from 'react';
import { render, screen, fireEvent, prettyDOM } from '@testing-library/react';
import selectEvent from 'react-select-event';
import { describe, it, expect, vi } from 'vitest';
import { SELECT_CLEAR_PLACEHOLDER, SELECT_PLACEHOLDER } from '../utils/constants';

import { getSelectOptions, SelectInput } from '../components/form/SelectInput';

describe('getSelectOptions', () => {
  it('Generate options without refs', () => {
    const options = ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'];
    const propertyTypes = undefined;
    const isRequired = false;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: 'claude-3-5-sonnet-20240620', label: 'claude-3-5-sonnet-20240620' },
      { value: 'claude-3-opus-20240229', label: 'claude-3-opus-20240229' },
    ]);
  });
  it('Generate options with refs and is not required', () => {
    const options = [SELECT_PLACEHOLDER];
    const propertyTypes = ['secret'];
    const isRequired = false;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: "Add new 'Secret'", label: "Add new 'Secret'", isNewOption: true, originalValue: 'secret' },
    ]);
  });

  it('Generate options without refs - placeholder with other options', () => {
    const options = [SELECT_PLACEHOLDER, 'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'];
    const propertyTypes = undefined;
    const isRequired = false;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: 'claude-3-5-sonnet-20240620', label: 'claude-3-5-sonnet-20240620' },
      { value: 'claude-3-opus-20240229', label: 'claude-3-opus-20240229' },
    ]);
  });

  it('Generate options with refs and is required', () => {
    const options = [SELECT_PLACEHOLDER];
    const propertyTypes = ['secret'];
    const isRequired = true;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: "Add new 'Secret'", label: "Add new 'Secret'", isNewOption: true, originalValue: 'secret' },
    ]);
  });

  it('Generate options with multiple property types', () => {
    const options = ['Option1', 'Option2'];
    const propertyTypes = ['secret', 'llm'];
    const isRequired = false;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: 'Option1', label: 'Option1' },
      { value: 'Option2', label: 'Option2' },
      { value: "Add new 'Secret'", label: "Add new 'Secret'", isNewOption: true, originalValue: 'secret' },
      { value: "Add new 'LLM'", label: "Add new 'LLM'", isNewOption: true, originalValue: 'llm' },
    ]);
  });

  it('Generate options when required and options are not just "SELECT_PLACEHOLDER"', () => {
    const options = ['Option1', 'Option2'];
    const propertyTypes = undefined;
    const isRequired = true;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: 'Option1', label: 'Option1' },
      { value: 'Option2', label: 'Option2' },
    ]);
  });

  it('Generate options when required and options are "SELECT_PLACEHOLDER" and others', () => {
    const options = [SELECT_PLACEHOLDER, 'Option1', 'Option2'];
    const propertyTypes = undefined;
    const isRequired = true;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);
    expect(selectOptions).toEqual([
      { value: 'Option1', label: 'Option1' },
      { value: 'Option2', label: 'Option2' },
    ]);
  });
});

describe('SelectInput', () => {
  const defaultProps = {
    id: 'model',
    value: '',
    options: [
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    onChange: vi.fn(),
    propertyTypes: undefined,
    handleAddProperty: vi.fn(),
    isRequired: false,
    updateExistingModel: null,
  };

  it('should render the default option correctly when propertyTypes is null - Add new scenario', async () => {
    const { getByRole, getByText } = render(<SelectInput {...defaultProps} />);

    // Expect default value to be present
    expect(getByText('claude-3-5-sonnet-20240620')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'claude-3-sonnet-20240229');

    // Check if the selected option is displayed directly by its text
    expect(getByText('claude-3-sonnet-20240229')).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is null - Update existing scenario', async () => {
    const props = {
      ...defaultProps,
      options: [
        'claude-3-haiku-20240307',
        'claude-3-5-sonnet-20240620',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
      ],
      updateExistingModel: {
        name: 'Anthropic',
        model: 'claude-3-5-sonnet-20240620',
        api_key: { name: 'AnthropicAPIKey', type: 'secret', uuid: '020a153b-19c9-48b5-92f7-a843f647db8a' },
        api_type: 'anthropic',
        base_url: 'https://api.anthropic.com/v1',
        temperature: 0.8,
        uuid: 'e60a4f8a-b69e-410a-8126-bae15a8dd30c',
      },
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('claude-3-haiku-20240307')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'claude-3-sonnet-20240229');

    // Check if the selected option is displayed directly by its text
    expect(getByText('claude-3-sonnet-20240229')).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null and the isRequired is true - Add new scenario', async () => {
    const props = {
      id: 'api_key',
      options: [],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: true,
      updateExistingModel: null,
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText("Add new 'Secret'")).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null and the isRequired is true - Add new scenario', async () => {
    const props = {
      id: 'api_key',
      options: ['anthropic_3', 'anthropic_2', 'anthropic_1'],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: true,
      updateExistingModel: null,
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('anthropic_3')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'anthropic_2');

    // Check if the selected option is displayed directly by its text
    expect(getByText('anthropic_2')).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is true and updateExistingModel is not null - Update existing scenario', async () => {
    const props = {
      id: 'api_key',
      options: ['anthropic'],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: true,
      updateExistingModel: {
        name: 'Anthropic',
        model: 'claude-3-5-sonnet-20240620',
        api_key: { name: 'AnthropicAPIKey', type: 'secret', uuid: '020a153b-19c9-48b5-92f7-a843f647db8a' },
        api_type: 'anthropic',
        base_url: 'https://api.anthropic.com/v1',
        temperature: 0.8,
        uuid: 'e60a4f8a-b69e-410a-8126-bae15a8dd30c',
      },
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('anthropic')).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, only one value in options and updateExistingModel is null - Add new scenario', async () => {
    const props = {
      id: 'openapi_auth',
      options: [],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: null,
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText("Add new 'Secret'")).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, more than one value in options and updateExistingModel is null - Add new scenario', async () => {
    const props = {
      id: 'openapi_auth',
      options: ['Option_1'],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: null,
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText('Option_1')).toBeInTheDocument();
    expect(getByText("Add new 'Secret'")).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, no value in options and updateExistingModel is non-null - Updarte existing scenario', async () => {
    const props = {
      id: 'openapi_auth',
      options: [''],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: {
        name: 'Weatherman Toolbox',
        openapi_url: 'https://weather.tools.staging.fastagency.ai/openapi.json',
        openapi_auth: null,
        uuid: '0f686b5e-af80-47fc-b401-c766d551bcda',
      },
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText("Add new 'Secret'")).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, more than one value in options and updateExistingModel is non-null - Updarte existing scenario', async () => {
    const props = {
      id: 'openapi_auth',
      options: ['Option_1'],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: {
        name: 'C',
        openapi_url: 'https://weather.tools.staging.fastagency.ai/openapi.json',
        openapi_auth: { name: 'OpenAPIAuth', type: 'secret', uuid: '6104c067-e63d-499a-84c0-712204239274' },
        uuid: '273b3b3c-3f30-4243-9fc9-bbf719f8778e',
      },
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('Option_1')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText("Add new 'Secret'")).toBeInTheDocument();
  });

  it('should be clearable for optional fields and clear correctly', async () => {
    const props = {
      id: 'optional_field',
      value: '',
      options: ['Option1', 'Option2', 'Option3'],
      onChange: vi.fn(),
      propertyTypes: ['secret'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: null,
    };

    const { getByRole, queryByText, container } = render(<SelectInput {...props} />);

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'Option2');

    // Verify that the selected option is displayed
    expect(queryByText('Option2')).toBeInTheDocument();

    // Find and click the clear button
    const clearIndicator = container.querySelector('div.react-select__indicator.react-select__clear-indicator');
    expect(clearIndicator).not.toBeNull();
    expect(clearIndicator).toHaveAttribute('aria-hidden', 'true');
    // @ts-ignore
    fireEvent.mouseDown(clearIndicator);

    // Verify that the selected option is no longer displayed
    expect(queryByText('Option2')).not.toBeInTheDocument();

    // Verify that the onChange function was called with null
    expect(props.onChange).toHaveBeenCalledWith(SELECT_CLEAR_PLACEHOLDER);
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, more than one value in options and resumeFormData is non-null - Updarte existing scenario', async () => {
    const props = {
      id: 'toolbox_1',
      options: ['A', 'Weatherman Toolbox'],
      onChange: vi.fn(),
      propertyTypes: ['toolbox'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: null,
      resumeFormData: {
        name: 'A',
        llm: '',
        toolbox_1: { name: null, type: 'toolbox', uuid: '9f1adeea-54e8-4730-9d2b-d4968fa5d988' },
        toolbox_2: '',
        toolbox_3: '',
        system_message:
          "You are a helpful assistant. After you successfully answer all questions and there are no new questions asked after your response (e.g. there is no specific direction or question asked after you give a response), terminate the chat by outputting 'TERMINATE'",
      },
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('A')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText('Weatherman Toolbox')).toBeInTheDocument();
    expect(getByText("Add new 'Toolbox'")).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, more than one value in options and resumeFormData is null - Updarte existing scenario', async () => {
    const props = {
      id: 'toolbox_2',
      options: ['--- Select Placeholder ---', 'Weatherman Toolbox', 'A'],
      onChange: vi.fn(),
      propertyTypes: ['toolbox'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      updateExistingModel: null,
      resumeFormData: {
        name: 'A',
        llm: '',
        toolbox_1: { name: null, type: 'toolbox', uuid: 'e9554ab8-7499-47cc-974c-f087c2d60f0b' },
        toolbox_2: '',
        toolbox_3: '',
        system_message:
          "You are a helpful assistant. After you successfully answer all questions and there are no new questions asked after your response (e.g. there is no specific direction or question asked after you give a response), terminate the chat by outputting 'TERMINATE'",
      },
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('Select...')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText('A')).toBeInTheDocument();
    expect(getByText('Weatherman Toolbox')).toBeInTheDocument();
    expect(getByText("Add new 'Toolbox'")).toBeInTheDocument();
  });

  it('should render the default option correctly when propertyTypes is non-null, the isRequired is false, more than one value in options and resumeFormData is null and updateExistingModel not null- Updarte existing scenario', async () => {
    const props = {
      id: 'toolbox_2',
      options: ['--- Select Placeholder ---', 'Weatherman Toolbox', 'A'],
      onChange: vi.fn(),
      propertyTypes: ['toolbox'],
      handleAddProperty: vi.fn(),
      isRequired: false,
      resumeFormData: null,
      updateExistingModel: {
        name: 'A',
        llm: '',
        toolbox_1: { name: null, type: 'toolbox', uuid: 'e9554ab8-7499-47cc-974c-f087c2d60f0b' },
        toolbox_2: '',
        toolbox_3: '',
        system_message:
          "You are a helpful assistant. After you successfully answer all questions and there are no new questions asked after your response (e.g. there is no specific direction or question asked after you give a response), terminate the chat by outputting 'TERMINATE'",
      },
      value: '',
    };
    const { getByRole, getByText } = render(<SelectInput {...props} />);

    // Expect default value to be present
    expect(getByText('Select...')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Expect default value to be present
    expect(getByText('A')).toBeInTheDocument();
    expect(getByText('Weatherman Toolbox')).toBeInTheDocument();
    expect(getByText("Add new 'Toolbox'")).toBeInTheDocument();
  });
});
