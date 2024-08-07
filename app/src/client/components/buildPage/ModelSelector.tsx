import Select, { StylesConfig, SingleValue } from 'react-select';
import { ListOfSchemas } from '../../interfaces/BuildPageInterfacesNew';

interface SelectOption {
  value: string;
  label: string;
}

export const ModelSelector = ({
  propertySchemasList,
  propertyName,
  setAddOrUpdateModel,
}: {
  propertySchemasList: ListOfSchemas;
  propertyName: string | undefined;
  setAddOrUpdateModel: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const selectOptions = propertySchemasList.schemas.map((schema) => {
    return {
      value: schema.name,
      label: schema.name,
    };
  });
  const customStyles: StylesConfig<SelectOption, false> = {
    control: (baseStyles) => ({
      ...baseStyles,
      borderColor: '#003257',
    }),
  };

  const handleChange = (selectedOption: SingleValue<SelectOption>) => {
    if (selectedOption) {
      setAddOrUpdateModel(selectedOption.value);
    }
  };

  return (
    <>
      <label className='mb-3 block text-black dark:text-white'>{`Select  ${propertyName}`}</label>
      <div className='relative z-20 bg-white dark:bg-form-input'>
        <Select
          data-testid='select-model-type'
          classNamePrefix='react-select-model-type'
          options={selectOptions}
          onChange={handleChange}
          className='pt-1 pb-1'
          defaultValue={selectOptions[0]}
          isSearchable={true}
          isClearable={false}
          styles={customStyles}
        />
      </div>
    </>
  );
};
