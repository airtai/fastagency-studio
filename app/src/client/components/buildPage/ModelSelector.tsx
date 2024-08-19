import { useEffect, useMemo, useState } from 'react';
import Select, { StylesConfig, SingleValue } from 'react-select';
import { PropertySchemaParser, SetUpdateFormStack } from './PropertySchemaParser';
import { SelectOption } from './PropertySchemaParser';
import { capitalizeFirstLetter } from './buildPageUtils';

export const ModelSelector = ({
  parser,
  updateFormStack,
}: {
  parser: PropertySchemaParser | null;
  updateFormStack: SetUpdateFormStack;
}) => {
  const selectOptions = useMemo(() => parser?.getModelNames() || [], [parser]);
  const propertyName = parser?.getPropertyName();
  const activeModel = parser?.getActiveModel();

  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(() => {
    if (activeModel) {
      return selectOptions.find((opt) => opt.value === activeModel) || null;
    }
    return selectOptions.length > 0 ? selectOptions[0] : null;
  });

  useEffect(() => {
    if (activeModel) {
      const option = selectOptions.find((opt) => opt.value === activeModel);
      if (option && option.value !== selectedOption?.value) {
        setSelectedOption(option);
      }
    } else if (selectOptions.length > 0 && !selectedOption) {
      setSelectedOption(selectOptions[0]);
    }
  }, [activeModel, selectOptions]);

  const propertyHeader = propertyName ? capitalizeFirstLetter(propertyName) : propertyName;
  const customStyles: StylesConfig<SelectOption, false> = {
    control: (baseStyles) => ({
      ...baseStyles,
      borderColor: '#003257',
    }),
  };

  const handleChange = (newValue: SingleValue<SelectOption>) => {
    if (newValue) {
      setSelectedOption(newValue);
      updateFormStack(newValue.value);
    }
  };

  const header = propertyHeader === 'Llm' ? 'Select LLM' : `Select ${propertyHeader}`;

  return (
    <>
      {selectOptions && selectOptions.length > 1 && (
        <>
          <label className='mb-3 block text-black dark:text-white'>{header}</label>
          <div className='relative z-20 bg-white dark:bg-form-input'>
            <Select
              data-testid='select-model-type'
              classNamePrefix='react-select-model-type'
              options={selectOptions}
              onChange={handleChange}
              className='pt-1 pb-1'
              value={selectedOption}
              isSearchable={true}
              isClearable={false}
              styles={customStyles}
              autoFocus={true}
            />
          </div>
        </>
      )}
    </>
  );
};
