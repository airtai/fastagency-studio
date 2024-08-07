import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { validateForm, addUserModels } from 'wasp/client/operations';
import { PropertySchemaParser, SetActiveModelType } from './PropertySchemaParser';
import { parseValidationErrors } from './formUtils';

export const onSuccessCallback = async (validatedData: any, propertyName: string, modelName: string) => {
  try {
    const payload = {
      ...validatedData,
      type_name: propertyName,
      model_name: modelName,
      uuid: validatedData.uuid,
    };
    return await addUserModels(payload);
  } catch (error: any) {
    console.log('error: ', error, 'error.message: ');
    throw error;
  }
};

export const useFormLogic = (
  parser: PropertySchemaParser | null,
  setActiveModel: SetActiveModelType,
  refetchUserOwnedProperties: any
) => {
  const propertyName = parser?.getPropertyName() || '';
  const modelName = parser?.getActiveModel() || '';
  const schema = modelName ? parser?.getSchemaForModel(modelName) : null;
  const defaultValues = schema ? parser?.getDefaultValues(schema) : {};

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        const validationURL: string = parser?.getValidationURL() || '';
        const isSecretUpdate = false;
        const data = value;
        const validatedData = await validateForm({ data, validationURL, isSecretUpdate });
        await onSuccessCallback(validatedData, propertyName, modelName);
        // make sure to run the below code only when the above api call successful and the response is received
        await resetAndRefetchProperties();
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
  }, [schema]);

  const resetFormState = () => {
    form.reset();
    setActiveModel(null);
  };

  const resetAndRefetchProperties = async () => {
    resetFormState();
    refetchUserOwnedProperties();
  };

  const handleCancel = () => {
    resetFormState();
  };

  return {
    form,
    schema,
    handleCancel,
  };
};
