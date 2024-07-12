import React, { useEffect, useState } from 'react';

import Select from 'react-select';

interface MissingDependency {
  property_type: string;
  model_type: string;
  label: string;
}

interface SelectInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  missingDependencies: MissingDependency[];
  onMissingDependencyClick: (event: React.FormEvent, property_type: string, model_type: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  value,
  options,
  onChange,
  missingDependencies,
  onMissingDependencyClick,
}) => {
  const [selectedOption, setSelectedOption] = useState(value);
  let selectOptions = options.map((option) => ({ value: option, label: option }));
  selectOptions = selectOptions.concat([{ value: 'Add new', label: 'Add new' }]);

  useEffect(() => {
    const defaultValue = value === '' ? selectOptions[0].value : value;
    setSelectedOption(defaultValue);
  }, [value]);

  const handleTypeSelect = (e: any) => {
    const selectedOption = e.value;
    setSelectedOption(selectedOption);
    // onChange(selectedOption);
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
      />
    </div>
  );
};
