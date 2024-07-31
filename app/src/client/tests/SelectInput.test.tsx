import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import selectEvent from 'react-select-event';
import { describe, it, expect, vi } from 'vitest';

import { getSelectOptions, getSelectedItem, SelectInput } from '../components/form/SelectInput';

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
    const options = ['None'];
    const propertyTypes = ['secret'];
    const isRequired = false;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { label: 'None', value: 'None' },
      { value: "Add new 'Secret'", label: "Add new 'Secret'", isNewOption: true, originalValue: 'secret' },
    ]);
  });

  it('Generate options with refs and is required', () => {
    const options = ['None'];
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

  it('Generate options when required and options are not just "None"', () => {
    const options = ['Option1', 'Option2'];
    const propertyTypes = undefined;
    const isRequired = true;
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    expect(selectOptions).toEqual([
      { value: 'Option1', label: 'Option1' },
      { value: 'Option2', label: 'Option2' },
    ]);
  });
});

describe('getSelectedItem', () => {
  it('Return selected Item', () => {
    const selectedOption = "Add new 'Secret'";
    const selectOptions = [
      { value: 'Azure Key', label: 'Azure Key' },
      { value: 'secret', label: 'secret' },
      { value: "Add new 'Secret'", label: "Add new 'Secret'", isNewOption: true, originalValue: 'secret' },
    ];
    expect(getSelectedItem(selectedOption, selectOptions)).toBe(selectOptions[2]);
  });
  it('Return undefined for non-existent item', () => {
    const selectedOption = 'Non-existent Option';
    const selectOptions = [
      { value: 'Option1', label: 'Option1' },
      { value: 'Option2', label: 'Option2' },
    ];
    expect(getSelectedItem(selectedOption, selectOptions)).toBeUndefined();
  });
});

describe('SelectInput', () => {
  const defaultProps = {
    id: 'test-select',
    value: '',
    options: ['Option1', 'Option2'],
    onChange: vi.fn(),
    isRequired: false,
  };

  it('renders correctly with default props', async () => {
    const { getByRole, getByText } = render(<SelectInput {...defaultProps} />);

    // Expect default value to be present
    expect(getByText('Option1')).toBeInTheDocument();

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'Option2');

    // Check if the selected option is displayed directly by its text
    expect(getByText('Option2')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const { getByRole, getByText } = render(<SelectInput {...defaultProps} />);

    // Open the select dropdown
    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Select an option
    await selectEvent.select(selectElement, 'Option2');

    expect(defaultProps.onChange).toHaveBeenCalled();
    expect(defaultProps.onChange).toHaveBeenCalledWith('Option2');
  });

  it('handles property types correctly', async () => {
    const props = {
      ...defaultProps,
      propertyTypes: ['llm'],
      handleAddProperty: vi.fn(),
    };

    const { getByRole, getByText } = render(<SelectInput {...props} />);

    const selectElement = getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    await selectEvent.select(selectElement, "Add new 'LLM'");

    expect(props.handleAddProperty).toHaveBeenCalledWith('llm');
    expect(props.onChange).toHaveBeenCalledWith("Add new 'LLM'");
  });
});
