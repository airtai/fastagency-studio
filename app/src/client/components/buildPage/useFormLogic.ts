import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { validateForm } from 'wasp/client/operations';
import { ListOfSchemas } from '../../interfaces/BuildPageInterfacesNew';
import { PropertySchemaParser } from './PropertySchemaParser';
import { getDefaultValues, parseValidationErrors } from './formUtils';

export const useFormLogic = (
  propertySchemasList: ListOfSchemas,
  addOrUpdateModel: string,
  setAddOrUpdateModel: React.Dispatch<React.SetStateAction<any>>
) => {
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
        await validateForm({ data, validationURL, isSecretUpdate });
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

  const handleCancel = () => {
    form.reset();
    setAddOrUpdateModel(null);
  };

  return {
    form,
    schema,
    handleCancel,
  };
};
