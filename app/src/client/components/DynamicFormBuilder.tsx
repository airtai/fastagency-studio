import React, { useState } from 'react';
import { useForm } from '../hooks/useForm';
import { JsonSchema } from '../interfaces/BuildPageInterfaces';
import { TextInput } from './form/TextInput';
import { SelectInput } from './form/SelectInput';
import { validateForm } from '../services/commonService';
import { parseValidationErrors } from '../app/utils/formHelpers';
import Loader from '../admin/common/Loader';
import NotificationBox from './NotificationBox';

import { SelectedModelSchema } from '../interfaces/BuildPageInterfaces';
import { set } from 'zod';

interface DynamicFormBuilderProps {
  jsonSchema: JsonSchema;
  validationURL: string;
  updateExistingModel: SelectedModelSchema | null;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: (data: any) => void;
  onDeleteCallback: (data: any) => void;
}

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  jsonSchema,
  validationURL,
  updateExistingModel,
  onSuccessCallback,
  onCancelCallback,
  onDeleteCallback,
}) => {
  const { formData, handleChange, formErrors, setFormErrors } = useForm({
    jsonSchema,
    defaultValues: updateExistingModel,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await validateForm(formData, validationURL);
      onSuccessCallback(response);
    } catch (error: any) {
      try {
        const errorMsgObj = JSON.parse(error.message);
        const errors = parseValidationErrors(errorMsgObj);
        setFormErrors(errors);
      } catch (e) {
        setShowNotification(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const notificationMsg = 'Oops. Something went wrong. Please try again later.';

  const notificationOnClick = () => {
    setShowNotification(false);
  };
  return (
    <>
      <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-9 p-6.5'>
        {Object.entries(jsonSchema.properties).map(([key, property]) => {
          if (key === 'uuid') {
            return null;
          }
          const inputValue = formData[key] || '';

          return property?.enum?.length === 1 ? null : (
            <div key={key} className='w-full'>
              <label htmlFor={key}>{property.title}</label>
              {property.enum ? (
                <SelectInput
                  id={key}
                  value={inputValue}
                  options={property.enum}
                  onChange={(value) => handleChange(key, value)}
                />
              ) : (
                <TextInput
                  id={key}
                  value={key === 'api_key' ? inputValue.replace(/./g, '*') : inputValue}
                  placeholder={property.description || ''}
                  onChange={(value) => handleChange(key, value)}
                />
              )}
              {formErrors[key] && <div style={{ color: 'red' }}>{formErrors[key]}</div>}
            </div>
          );
        })}
        <div className='col-span-full'>
          <button
            type='submit'
            className='rounded-md px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            disabled={isLoading}
            data-testid='form-submit-button'
          >
            Save
          </button>
          <button
            className='ml-3 rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
            disabled={isLoading}
            data-testid='form-cancel-button'
            onClick={onCancelCallback}
          >
            Cancel
          </button>

          {updateExistingModel && (
            <button
              type='button'
              className='float-right ml-3 rounded-md px-3.5 py-2.5 text-sm border bg-airt-error text-airt-font-base hover:bg-opacity-80 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              disabled={isLoading}
              data-testid='form-cancel-button'
              onClick={onDeleteCallback}
            >
              Delete
            </button>
          )}
        </div>
      </form>
      {isLoading && (
        <div className='z-[999999] absolute inset-0 flex items-center justify-center bg-white bg-opacity-50'>
          <Loader />
        </div>
      )}
      {showNotification && <NotificationBox type='error' onClick={notificationOnClick} message={notificationMsg} />}
    </>
  );
};

export default DynamicFormBuilder;
