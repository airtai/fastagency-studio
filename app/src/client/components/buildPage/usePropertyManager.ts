import { useState, useEffect, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { validateForm, addUserModels, deleteUserModels, updateUserModels } from 'wasp/client/operations';
import { PropertySchemaParser, SetUpdateFormStack, Flow, UserProperties } from './PropertySchemaParser';
import { parseValidationErrors } from './formUtils';
import _ from 'lodash';

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
  updateFormStack: SetUpdateFormStack,
  refetchUserProperties: any,
  popFromStack: (userProperties: UserProperties[] | null, validateDataResponse?: any, index?: number) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<any>(null);
  const formValuesRef = useRef<any>(null);

  const propertyName = parser?.getPropertyName() || '';
  const modelName = parser?.getActiveModel() || '';
  const schema = modelName ? parser?.getSchemaForModel() : null;
  const defaultValues = schema ? parser?.getDefaultValues() : {};
  const flow = parser?.getFlow();
  const refFields = parser?.getRefFields();
  const isDeploymentProperty = propertyName === 'deployment';

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        const isSecretUpdate = propertyName === 'secret' && flow === Flow.UPDATE_MODEL;
        let validationURL: string = parser?.getValidationURL() || '';

        const data = _.cloneDeep(value);
        if (isSecretUpdate) {
          validationURL = parser?.getSecretUpdateValidationURL() || '';
          if (value.api_key === defaultValues!.api_key) {
            // While updating secret, if the api_key is not touched and only the name is updated,
            // then we should not send the api_key in the payload
            delete data.api_key;
          }
        }

        if (refFields) {
          Object.entries(data).forEach(([key, val]) => {
            if (refFields[key]) {
              const userProperty = parser?.getMatchingUserProperty(val);
              if (userProperty) {
                data[key] = {
                  name: userProperty.model_name,
                  type: userProperty.type_name,
                  uuid: userProperty.uuid,
                };
              }
            }
          });
        }
        const validatedData = await validateForm({ data, validationURL, isSecretUpdate });
        const propertyUUIDToUpdate = parser?.getActiveModelObj()?.uuid;

        const response = await onSuccessCallback(validatedData, propertyName, modelName, propertyUUIDToUpdate);
        await setSuccessResponse(response);

        if (!isDeploymentProperty) {
          await resetAndRefetchProperties(validatedData);
        }
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
          setNotification(e.message);
          console.log(e);
        }
      }
    },
  });

  const formState = form.useStore((state) => state.values);
  useEffect(() => {
    formValuesRef.current = formState;
  }, [formState]);

  const popFromStackWithFormState = (modelName: string, propertyName: string, fieldKey: string) => {
    const formState = {
      values: formValuesRef.current,
      fieldKey,
    };
    updateFormStack(modelName, propertyName, formState);
  };

  useEffect(() => {
    form.reset();
  }, [schema]);

  const resetFormState = () => {
    form.reset();
    updateFormStack(null);
    setSuccessResponse(null);
  };

  const resetAndPopFromStack = () => {
    resetFormState();
    popFromStack(null);
  };

  const resetAndRefetchProperties = async (validateDataResponse: any = null) => {
    const { data: userProperties } = await refetchUserProperties();
    resetFormState();
    popFromStack(userProperties, validateDataResponse);
  };

  const deleteProperty = async () => {
    const activeModelObj = parser?.getActiveModelObj();

    if (activeModelObj) {
      const referringProperty = parser?.findFirstReferringPropertyName(activeModelObj.uuid);
      if (referringProperty) {
        setNotification(
          `Cannot delete ${activeModelObj.type_name} as it is being referred in "${referringProperty.json_str.name}" ${referringProperty.type_name}. Please delete the referring property first.`
        );
        return;
      }
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
    console.log('inside handleCtaAction');
    if (ctaAction === 'cancel') {
      resetAndPopFromStack();
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
    successResponse,
    popFromStackWithFormState,
  };
};
