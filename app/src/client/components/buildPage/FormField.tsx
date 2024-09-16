import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { FieldApi } from '@tanstack/react-form';
import Select, { StylesConfig } from 'react-select';
import { Tooltip } from '@chakra-ui/react';
import { IoIosInformationCircleOutline } from 'react-icons/io';

import { TextInput } from '../form/TextInput';
import { SECRETS_TO_MASK } from '../../utils/constants';
import { TextArea } from '../form/TextArea';
import { SelectOption } from './PropertySchemaParser';

const markAddPropertyOption: StylesConfig<SelectOption, false> = {
  control: (baseStyles) => ({
    ...baseStyles,
    borderColor: '#003257',
  }),
  option: (styles, { data }) => ({
    ...styles,
    display: 'flex',
    alignItems: 'center',
    '::before': data.addPropertyForModel
      ? {
          fontFamily: '"Material Symbols Outlined"',
          content: '"\ue147"',
          marginRight: '5px',
        }
      : {},
  }),
};

interface AddPropertyHandler {
  (modelName: string, propertyName: string, fieldKey: string): void;
}

interface FormFieldProps {
  field: FieldApi<any, any, any, any>;
  property: any;
  fieldKey: string;
  isOptionalRefField: boolean;
  addPropertyHandler: AddPropertyHandler;
  checkForImmutableFields: boolean;
}

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p role='alert' className='text-red-600'>
          {field.state.meta.errors.join(',')}
        </p>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
}

const getSelectObject = (val: string): {} => {
  return { value: val, label: val };
};

export const FormField: React.FC<FormFieldProps> = ({
  field,
  property,
  fieldKey,
  isOptionalRefField,
  addPropertyHandler,
  checkForImmutableFields,
}) => {
  const [selectOptions, setSelectOptions] = useState([]);
  const [defaultValue, setDefaultValue] = useState(null);
  const [key, setKey] = useState(0);
  const getInputType = () => {
    if (_.includes(SECRETS_TO_MASK, fieldKey) && typeof property.type === 'string') {
      return 'password';
    }
    return 'text';
  };

  useEffect(() => {
    if (property.enum) {
      const opts = property.enum;

      let optsDefault = opts.length > 0 ? property.default : null;
      if (typeof optsDefault === 'string') {
        optsDefault = getSelectObject(optsDefault);
      }

      setSelectOptions(opts);
      setDefaultValue(optsDefault);
      setKey((prevKey) => prevKey + 1);
    } else {
      setSelectOptions([]);
      setDefaultValue(null);
    }
  }, [property.enum]);

  const handleSelectOnchange = (selectedOption: any) => {
    const value = selectedOption?.value || null;
    const addPropertyForModel = selectedOption?.addPropertyForModel;

    field.handleChange(value);
    if (addPropertyForModel) {
      const propertyName: string = value;
      const modelName = addPropertyForModel;
      addPropertyHandler(modelName, propertyName, fieldKey);
    }
  };

  const immutableAfterCreation = checkForImmutableFields && property.metadata?.immutable_after_creation;
  const toolTipMessage = property.metadata?.tooltip_message;

  return (
    <div className='w-full mt-2'>
      <label htmlFor={fieldKey} className='flex items-center'>
        {`${property.title} ${isOptionalRefField ? ' (Optional)' : ''}`}
        {toolTipMessage && (
          <Tooltip
            hasArrow
            label={toolTipMessage}
            className='bg-airt-secondary text-airt-font-base'
            bg='brand.airtPrimary'
            color='white'
          >
            <span className='ml-1 text-airt-primary' data-testid={`${fieldKey}-tooltip`}>
              <IoIosInformationCircleOutline />
            </span>
          </Tooltip>
        )}
      </label>
      {property.enum ? (
        <Select
          key={key}
          data-testid='select-container'
          classNamePrefix='react-select'
          inputId={fieldKey}
          options={selectOptions}
          onChange={handleSelectOnchange}
          className='pt-1 pb-1'
          defaultValue={defaultValue}
          isSearchable={true}
          isClearable={isOptionalRefField}
          styles={markAddPropertyOption}
          isDisabled={immutableAfterCreation}
        />
      ) : fieldKey === 'system_message' ? (
        <TextArea
          id={fieldKey}
          value={field.state.value}
          placeholder={property.description || ''}
          onChange={(e) => field.handleChange(e)}
          isDisabled={immutableAfterCreation}
        />
      ) : (
        <TextInput
          id={fieldKey}
          value={field.state.value}
          onChange={(e) => field.handleChange(e)}
          type={getInputType()}
          placeholder={property.description || ''}
          isDisabled={immutableAfterCreation}
        />
      )}
      <FieldInfo field={field} />
    </div>
  );
};
