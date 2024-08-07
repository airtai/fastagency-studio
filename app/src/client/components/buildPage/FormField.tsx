import React from 'react';
import _ from 'lodash';
import { FieldApi } from '@tanstack/react-form';
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

export const FormField: React.FC<FormFieldProps> = ({ field, property, fieldKey }) => {
  const getInputType = () => {
    if (_.includes(SECRETS_TO_MASK, fieldKey) && typeof property.type === 'string') {
      return 'password';
    }
    // Add more conditions here for different input types
    return 'text';
  };

  return (
    <div className='w-full mt-2'>
      <label htmlFor={fieldKey}>{property.title}</label>
      <TextInput
        id={fieldKey}
        value={field.state.value}
        onChange={(e) => field.handleChange(e)}
        type={getInputType()}
        placeholder={property.description || ''}
      />
      <FieldInfo field={field} />
    </div>
  );
};
