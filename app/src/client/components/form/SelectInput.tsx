import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import Select from 'react-select';

import { capitalizeFirstLetter } from '../../utils/buildPageUtils';

interface SelectInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  propertyTypes: string[];
  addPropertyClick: (property_type: string) => void;
}

export function getSelectOptions(options: string[], propertyTypes: string[] | null) {
  let selectOptions = options.map((option) => ({ value: option, label: option }));

  if (propertyTypes && propertyTypes.length > 0) {
    selectOptions = selectOptions.concat(
      propertyTypes.map((option) => ({
        value: option,
        label: `+ Add new '${option === 'llm' ? 'LLM' : capitalizeFirstLetter(option)}'`,
      })) as any
    );
  }

  return selectOptions;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  value,
  options,
  onChange,
  propertyTypes,
  addPropertyClick,
}) => {
  const [selectedOption, setSelectedOption] = useState(value);
  let selectOptions = getSelectOptions(options, propertyTypes);
  useEffect(() => {
    const defaultValue = value === '' ? selectOptions[0].value : value;
    setSelectedOption(defaultValue);
  }, [value, options]);

  const handleTypeSelect = (e: any) => {
    const selectedOption = e.value;
    setSelectedOption(selectedOption);
    if (_.includes(propertyTypes, selectedOption)) {
      addPropertyClick(selectedOption);
    }
    onChange(selectedOption);
  };

  return (
    <div className=''>
      <Select
        inputId={id}
        options={selectOptions}
        onChange={handleTypeSelect}
        className='pt-1 pb-1'
        value={selectOptions.filter(function (option) {
          return option.value === selectedOption;
        })}
        isSearchable={false}
        isClearable={true}
      />
    </div>
  );
};
