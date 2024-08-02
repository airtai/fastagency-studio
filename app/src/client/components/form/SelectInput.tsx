import React, { useEffect, useMemo, useState } from 'react';
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
  propertyTypes?: string[] | null;
  handleAddProperty?: (propertyType: string) => void;
  isRequired: boolean;
  updateExistingModel?: any;
  resumeFormData?: any;
}

const generateLabel = (option: string): string =>
  `Add new '${option === 'llm' ? 'LLM' : capitalizeFirstLetter(option)}'`;

export const getSelectOptions = (
  options: string[],
  propertyTypes: string[] | undefined | null,
  isRequired: boolean
): SelectOption[] => {
  const filteredOptions = options.filter((o) => o !== SELECT_PLACEHOLDER);

  const baseOptions =
    isRequired && filteredOptions.length === 0
      ? []
      : filteredOptions.map((option) => ({ value: option, label: option }));

  const newPropertyOptions =
    propertyTypes?.map((option) => ({
      value: generateLabel(option),
      label: generateLabel(option),
      isNewOption: true,
      originalValue: option,
    })) || [];

  return [...baseOptions, ...newPropertyOptions];
};

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
  resumeFormData = null,
}) => {
  const selectOptions = useMemo(
    () => getSelectOptions(options, propertyTypes, isRequired),
    [options, propertyTypes, isRequired]
  );

  const isClearable = !isRequired && !!propertyTypes;

  const getInitialValue = (): SelectOption | null => {
    if (!propertyTypes) {
      return selectOptions.length > 0 ? selectOptions[0] : null;
    }

    if (!updateExistingModel && !resumeFormData) {
      return isRequired && selectOptions.length > 1 ? selectOptions[0] : null;
    }

    const dataToCheck = resumeFormData ? resumeFormData : updateExistingModel;
    console.log(dataToCheck);

    return isRequired || (dataToCheck[id] !== null && dataToCheck[id] !== '')
      ? selectOptions.length > 1
        ? selectOptions[0]
        : null
      : null;
  };

  const [defaultValue, setDefaultValue] = useState<SelectOption | null>(getInitialValue());
  const [key, setKey] = useState(0);

  useEffect(() => {
    setDefaultValue(getInitialValue());
    setKey((prevKey) => prevKey + 1);
  }, [options, propertyTypes, isRequired, updateExistingModel]);

  const handleChange = (selectedOption: SelectOption | null) => {
    if (!selectedOption) {
      onChange(SELECT_CLEAR_PLACEHOLDER);
      return;
    }

    if (selectedOption.isNewOption && handleAddProperty) {
      handleAddProperty(selectedOption.originalValue!);
    }

    onChange(selectedOption.value);
  };

  if (selectOptions.length === 0) {
    return null;
  }

  return (
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
  );
};
