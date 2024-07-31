import React, { useEffect, useState } from 'react';
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

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  value,
  options,
  onChange,
  propertyTypes,
  handleAddProperty,
  isRequired,
}) => {
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [defaultValue, setDefaultValue] = useState<SelectOption | null>(null);
  const [isClearable, setIsClearable] = useState(false);

  console.log('id', id);
  console.log('defaultValue', defaultValue);

  useEffect(() => {
    const newSelectOptions = getSelectOptions(options, propertyTypes, isRequired);
    setSelectOptions(newSelectOptions);
    // check the default value after None is removed
    setDefaultValue(newSelectOptions.length > 0 ? newSelectOptions[0] : null);
    setIsClearable(!isRequired && !!propertyTypes);
  }, [options, propertyTypes, isRequired]);

  const handleChange = (selectedOption: SelectOption | null) => {
    if (!selectedOption) return;

    const item = getSelectedItem(selectedOption.value, selectOptions);
    if (item?.isNewOption && handleAddProperty) {
      handleAddProperty(item.originalValue!);
    }
    onChange(selectedOption.value);
  };

  return (
    <div className=''>
      {selectOptions.length > 0 && (
        <Select
          data-testid='select-container'
          classNamePrefix='react-select'
          inputId={id}
          options={selectOptions}
          onChange={handleChange}
          className='pt-1 pb-1'
          defaultValue={defaultValue}
          isSearchable={true}
          isClearable={isClearable}
          styles={customStyles}
        />
      )}
    </div>
  );
};
