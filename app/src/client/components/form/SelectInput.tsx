import React from 'react';
import Select, { StylesConfig } from 'react-select';
import { capitalizeFirstLetter } from '../../utils/buildPageUtils';

interface SelectOption {
  value: string;
  label: string;
  isNewOption?: boolean;
  originalValue?: string;
}

interface SelectInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  propertyTypes?: string[];
  handleAddProperty?: (propertyType: string) => void;
  isRequired: boolean;
}

const generateLabel = (option: string): string =>
  `Add new '${option === 'llm' ? 'LLM' : capitalizeFirstLetter(option)}'`;

export const getSelectOptions = (
  options: string[],
  propertyTypes: string[] | undefined,
  isRequired: boolean
): SelectOption[] => {
  const baseOptions =
    isRequired && options.length === 1 && options[0] === 'None'
      ? []
      : options.map((option) => ({ value: option, label: option }));

  const newPropertyOptions =
    propertyTypes?.map((option) => ({
      value: generateLabel(option),
      label: generateLabel(option),
      isNewOption: true,
      originalValue: option,
    })) || [];

  return [...baseOptions, ...newPropertyOptions];
};

export const getSelectedItem = (selectedValue: string, options: SelectOption[]): SelectOption | undefined =>
  options.find((option) => option.value === selectedValue);

const customStyles: StylesConfig<SelectOption, false> = {
  control: (baseStyles) => ({
    ...baseStyles,
    borderColor: '#003257',
  }),
  option: (styles, { data }) => ({
    ...styles,
    display: 'flex',
    alignItems: 'center',
    '::before': data.isNewOption
      ? {
          fontFamily: '"Material Symbols Outlined"',
          content: '"\ue147"',
          marginRight: '5px',
        }
      : {},
  }),
};

export const SelectInput: React.FC<SelectInputProps> = React.memo(
  ({ id, value, options, onChange, propertyTypes, handleAddProperty, isRequired }) => {
    const selectOptions = getSelectOptions(options, propertyTypes, isRequired);

    const handleChange = (selectedOption: SelectOption | null) => {
      if (!selectedOption) return;

      const item = getSelectedItem(selectedOption.value, selectOptions);
      if (item?.isNewOption && handleAddProperty) {
        handleAddProperty(item.originalValue!);
      }
      onChange(selectedOption.value);
    };

    const isClearable = !isRequired && !!propertyTypes;
    const defaultValue = !propertyTypes ? selectOptions[0] : null;

    return (
      <div data-testid='select-input-container' className=''>
        <Select
          inputId={id}
          options={selectOptions}
          onChange={handleChange}
          className='pt-1 pb-1'
          defaultValue={defaultValue}
          isSearchable={true}
          isClearable={isClearable}
          styles={customStyles}
        />
      </div>
    );
  }
);
