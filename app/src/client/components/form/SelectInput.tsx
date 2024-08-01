import React, { useEffect, useState } from 'react';
import Select, { StylesConfig } from 'react-select';
import _ from 'lodash';
import { capitalizeFirstLetter } from '../../utils/buildPageUtils';
import { SELECT_PLACEHOLDER, SELECT_CLEAR_PLACEHOLDER } from '../../utils/constants';

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
  updateExistingModel?: any;
}

const generateLabel = (option: string): string =>
  `Add new '${option === 'llm' ? 'LLM' : capitalizeFirstLetter(option)}'`;

export const getSelectOptions = (
  options: string[],
  propertyTypes: string[] | undefined,
  isRequired: boolean
): SelectOption[] => {
  // remove placeholder from the options if present
  _.remove(options, function (o) {
    return o === SELECT_PLACEHOLDER;
  });

  const baseOptions =
    isRequired && options.length === 0 ? [] : options.map((option) => ({ value: option, label: option }));

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
  updateExistingModel = null,
}) => {
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [defaultValue, setDefaultValue] = useState<SelectOption | null>(null);
  const [isClearable, setIsClearable] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const newSelectOptions = getSelectOptions(options, propertyTypes, isRequired);
    const isOptionalField = !isRequired && !!propertyTypes;

    setSelectOptions(newSelectOptions);
    setIsClearable(isOptionalField);

    let initialValue: SelectOption | null = null;
    if (!propertyTypes) {
      // non reference options
      initialValue = newSelectOptions.length > 0 ? newSelectOptions[0] : null;
    } else {
      // reference options
      if (!updateExistingModel) {
        // add new scenario
        if (!isRequired) {
          // default option for optional fields
          initialValue = null;
        } else {
          // default option for non-optional fields
          initialValue = newSelectOptions.length > 1 ? newSelectOptions[0] : null;
        }
      } else {
        // update existing scenario
        if (!isRequired) {
          // default option for optional fields
          initialValue = updateExistingModel[id] !== null ? newSelectOptions[0] : null;
        } else {
          // default option for non-optional fields
          initialValue = newSelectOptions.length > 1 ? newSelectOptions[0] : null;
        }
      }
    }

    setDefaultValue(initialValue);

    // Increment the key to force a re-render of the Select component
    setKey((prevKey) => prevKey + 1);
  }, [options, propertyTypes, isRequired, updateExistingModel]);

  const handleChange = (selectedOption: SelectOption | null) => {
    if (!selectedOption) {
      selectedOption = { value: SELECT_CLEAR_PLACEHOLDER, label: '' };
    } else {
      const item = getSelectedItem(selectedOption.value, selectOptions);
      if (item?.isNewOption && handleAddProperty) {
        handleAddProperty(item.originalValue!);
      }
    }

    onChange(selectedOption.value);
  };

  return (
    <div className=''>
      {selectOptions.length > 0 && (
        <Select
          key={key}
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
