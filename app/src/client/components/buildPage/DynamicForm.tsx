import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import type { FieldApi } from '@tanstack/react-form';
import { useForm } from '@tanstack/react-form';

import { validateForm } from 'wasp/client/operations';
import { ListOfSchemas, Schema } from '../../interfaces/BuildPageInterfacesNew';
import { PropertySchemaParser } from './PropertySchemaParser';
import { TextInput } from '../form/TextInput';
import { SECRETS_TO_MASK } from '../../utils/constants';

export function getDefaultValues(schema: Schema | {}) {
  const defaultValues: { [key: string]: any } = {};

  if ('json_schema' in schema) {
    Object.entries(schema.json_schema.properties).forEach(([key, property]: [string, any]) => {
      defaultValues[key] = property.default || '';
    });
  }
  return defaultValues;
}

type ValidationError = {
  type: string;
  loc: string[];
  msg: string;
  input: any;
  url: string;
  ctx?: any;
};

type ErrorOutput = { [key: string]: string };

export function parseValidationErrors(errors: ValidationError[]): ErrorOutput {
  const result: ErrorOutput = {};
  errors.forEach((error) => {
    const key = error.loc[error.loc.length - 1]; // Using the last item in 'loc' array as the key
    result[key] = error.msg;
  });
  return result;
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

export const DynamicForm = ({
  propertySchemasList,
  addOrUpdateModel,
}: {
  propertySchemasList: ListOfSchemas;
  addOrUpdateModel: string;
}) => {
  const [defaultValues, setDefaultValues] = useState<{ [key: string]: any }>({});
  const propertySchemaParser = new PropertySchemaParser(propertySchemasList);
  const schema = propertySchemaParser.getSchemaForModel(addOrUpdateModel);

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        const validationURL: string = `models/${propertySchemasList.name}/${addOrUpdateModel}/validate`;
        const isSecretUpdate = false;
        const data = value;
        const response = await validateForm({ data, validationURL, isSecretUpdate });
        console.log('No errors. can submit the form');
        // form can be added to the database here
      } catch (error: any) {
        try {
          const errorMsgObj = JSON.parse(error.message);
          const errors = parseValidationErrors(errorMsgObj);
          Object.entries(errors).forEach(([key, value]) => {
            formApi.setFieldMeta(key, (meta) => ({
              ...meta,
              errorMap: { onChange: value },
            }));
          });
        } catch (e: any) {
          // set form level error. something went wrong. Please try again later. Unable to submit the form
          console.log(e);
        }
      }
    },
  });

  useEffect(() => {
    form.reset();
    setDefaultValues(getDefaultValues(schema));
  }, [schema]);

  const generateHTML = (schema: Schema | {}) => {
    if ('json_schema' in schema) {
      return Object.entries(schema.json_schema.properties).map(([key, property]: [string, any]) => {
        if (key === 'uuid') {
          return null;
        }
        return (
          <div key={key} className='w-full mt-2'>
            <form.Field
              //@ts-ignore
              name={`${key}`}
              children={(field) => (
                <>
                  <label htmlFor={key}>{property.title}</label>
                  <TextInput
                    id={key}
                    // @ts-ignore
                    value={field.state.value}
                    // @ts-ignore
                    onChange={(e) => field.handleChange(e)}
                    type={_.includes(SECRETS_TO_MASK, key) && typeof property.type === 'string' ? 'password' : 'text'}
                    placeholder={property.description || ''}
                  />
                  <FieldInfo field={field} />
                </>
              )}
              validators={{
                onChange: ({ value }) => undefined,
              }}
            />
          </div>
        );
      });
    } else {
      return null;
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {generateHTML(schema)}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <div className='col-span-full mt-7'>
            <div className='float-right'>
              <button
                className='rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                type='reset'
                onClick={() => form.reset()}
              >
                Cancel
              </button>
              <button
                data-testid='form-submit-button'
                type='submit'
                className={`ml-3 rounded-md px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  !canSubmit ? 'cursor-not-allowed disabled' : ''
                }`}
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      />
    </form>
  );
};
