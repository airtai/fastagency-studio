import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { validateForm, addUserModels } from 'wasp/client/operations';
import { ListOfSchemas } from '../../interfaces/BuildPageInterfacesNew';
import { PropertySchemaParser } from './PropertySchemaParser';
import { getDefaultValues, parseValidationErrors } from './formUtils';

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
  propertySchemasList: ListOfSchemas,
  modelName: string,
  setModelName: React.Dispatch<React.SetStateAction<any>>,
  refetchUserOwnedProperties: any
) => {
  const propertyName = propertySchemasList.name;
  const [defaultValues, setDefaultValues] = useState<{ [key: string]: any }>({});
  const propertySchemaParser = new PropertySchemaParser(propertySchemasList);
  const schema = propertySchemaParser.getSchemaForModel(modelName);

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        const validationURL: string = `models/${propertyName}/${modelName}/validate`;
        const isSecretUpdate = false;
        const data = value;
        const validatedData = await validateForm({ data, validationURL, isSecretUpdate });
        const onSuccessCallbackResponse: any = await onSuccessCallback(validatedData, propertyName, modelName);

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
    setDefaultValues(getDefaultValues(schema));
  }, [schema]);

  const resetFormState = () => {
    form.reset();
    setModelName(null);
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
