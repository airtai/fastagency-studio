import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { validateForm, addUserModels, deleteUserModels, updateUserModels } from 'wasp/client/operations';
import { PropertySchemaParser, SetActiveModelType } from './PropertySchemaParser';
import { parseValidationErrors } from './formUtils';

export type ctaAction = 'cancel' | 'delete';

export const onSuccessCallback = async (
  validatedData: any,
  propertyName: string,
  modelName: string,
  propertyUUIDToUpdate: string | undefined
) => {
  try {
    const payload = {
      ...validatedData,
      type_name: propertyName,
      model_name: modelName,
      uuid: validatedData.uuid,
    };
    if (propertyUUIDToUpdate) {
      return await updateUserModels({ data: payload, uuid: propertyUUIDToUpdate });
    } else {
      return await addUserModels(payload);
    }
  } catch (error: any) {
    console.log('error: ', error, 'error.message: ');
    throw error;
  }
};

export const usePropertyManager = (
  parser: PropertySchemaParser | null,
  setActiveModel: SetActiveModelType,
  refetchUserOwnedProperties: any
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const propertyName = parser?.getPropertyName() || '';
  const modelName = parser?.getActiveModel() || '';
  const schema = modelName ? parser?.getSchemaForModel() : null;
  const defaultValues = schema ? parser?.getDefaultValues() : {};
  const userFlow = parser?.getUserFlow();

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        const isSecretUpdate = propertyName === 'secret' && userFlow === 'update_model';
        const validationURL: string = isSecretUpdate
          ? parser?.getSecretUpdateValidationURL() || ''
          : parser?.getValidationURL() || '';
        const data = value;
        console.log(data);
        // const validatedData = await validateForm({ data, validationURL, isSecretUpdate });
        // const propertyUUIDToUpdate = parser?.getActiveModelObj()?.uuid;
        // await onSuccessCallback(validatedData, propertyName, modelName, propertyUUIDToUpdate);
        // await resetAndRefetchProperties();
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
          // set global notification
          setNotification(e.message);
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

  const deleteProperty = async () => {
    const activeModelObj = parser?.getActiveModelObj();
    if (activeModelObj) {
      setIsLoading(true);
      try {
        await deleteUserModels({ uuid: activeModelObj.uuid, type_name: activeModelObj.type_name });
      } catch (e: any) {
        // set global notification
        console.log(e);
      } finally {
        setIsLoading(false);
        await resetAndRefetchProperties();
      }
    }
  };

  const handleCtaAction = async (ctaAction: ctaAction) => {
    if (ctaAction === 'cancel') {
      resetFormState();
    } else {
      await deleteProperty();
    }
  };

  return {
    form,
    schema,
    handleCtaAction,
    isLoading,
    setNotification,
    notification,
  };
};
