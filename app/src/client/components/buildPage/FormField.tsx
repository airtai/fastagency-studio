import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { FieldApi } from '@tanstack/react-form';
import Select, { StylesConfig } from 'react-select';

import { TextInput } from '../form/TextInput';
import { SECRETS_TO_MASK } from '../../utils/constants';

interface FormFieldProps {
  field: FieldApi<any, any, any, any>;
  property: any;
  fieldKey: string;
}

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em role='alert' className='text-red-600'>
          {field.state.meta.errors.join(',')}
        </em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
}

const getSelectObject = (val: string): {} => {
  // if ref property, the value should be the uuid and key should be the name
  return { value: val, label: val };
};

export const FormField: React.FC<FormFieldProps> = ({ field, property, fieldKey }) => {
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

      let optsDefault = opts.length > 0 ? (property.default ? property.default : opts[0]) : null;
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

  return (
    <div className='w-full mt-2'>
      <label htmlFor={fieldKey}>{property.title}</label>
      {property.enum ? (
        <Select
          key={key}
          data-testid='select-container'
          classNamePrefix='react-select'
          inputId={fieldKey}
          options={selectOptions}
          onChange={(e: any) => field.handleChange(e.value)}
          className='pt-1 pb-1'
          defaultValue={defaultValue}
          isSearchable={true}
          isClearable={true}
          // styles={customStyles}
        />
      ) : (
        <TextInput
          id={fieldKey}
          value={field.state.value}
          onChange={(e) => field.handleChange(e)}
          type={getInputType()}
          placeholder={property.description || ''}
        />
      )}
      <FieldInfo field={field} />
    </div>
  );
};
