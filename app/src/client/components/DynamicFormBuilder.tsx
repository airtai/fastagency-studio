import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import _ from 'lodash';

import { useForm } from '../hooks/useForm';
import { validateForm } from '../services/commonService';
import { parseValidationErrors } from '../app/utils/formHelpers';
import Loader from '../admin/common/Loader';
import NotificationBox from './NotificationBox';

import { DynamicFormBuilderProps } from '../interfaces/DynamicFormBuilderInterface';
import {
  getFormSubmitValues,
  getMatchedUserProperties,
  constructHTMLSchema,
  getAllRefs,
  checkForDependency,
  getSecretUpdateFormSubmitValues,
  getSecretUpdateValidationURL,
  getMissingDependencyType,
} from '../utils/buildPageUtils';
import AgentConversationHistory from './AgentConversationHistory';
import { DEPLOYMENT_INSTRUCTIONS, DEPLOYMENT_PREREQUISITES } from '../utils/constants';
import DynamicForm from './form/DynamicForm';

const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  allUserProperties,
  type_name,
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

  const [notification, setNotification] = useState({
    message: 'Oops. Something went wrong. Please try again later.',
    show: false,
  });
  const [refValues, setRefValues] = useState<Record<string, any>>({});
  const [instructionForDeployment, setInstructionForDeployment] = useState<Record<string, string> | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const history = useHistory();
  const isDeployment = type_name === 'deployment';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Avoid creating duplicate deployments
    if (instructionForDeployment && !updateExistingModel) {
      return;
    }
    setIsLoading(true);
    const isSecretUpdate = type_name === 'secret' && !!updateExistingModel;
    let formDataToSubmit: any = {};
    if (isSecretUpdate) {
      formDataToSubmit = getSecretUpdateFormSubmitValues(formData, updateExistingModel);
      validationURL = getSecretUpdateValidationURL(validationURL, updateExistingModel);
    } else {
      formDataToSubmit = getFormSubmitValues(refValues, formData, isSecretUpdate); // remove isSecretUpdate
    }
    try {
      const response = await validateForm(formDataToSubmit, validationURL, isSecretUpdate);
      const onSuccessCallbackResponse: any = await onSuccessCallback(response);

      isDeployment &&
        !updateExistingModel &&
        setInstructionForDeployment((prevState) => ({
          ...prevState,
          gh_repo_url: response.gh_repo_url,
          // @ts-ignore
          instruction: DEPLOYMENT_INSTRUCTIONS.replaceAll('<gh_repo_url>', onSuccessCallbackResponse.gh_repo_url),
        }));
    } catch (error: any) {
      try {
        const errorMsgObj = JSON.parse(error.message);
        const errors = parseValidationErrors(errorMsgObj);
        setFormErrors(errors);
      } catch (e: any) {
        setNotification({ message: error.message || notification.message, show: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const notificationOnClick = () => {
    setNotification({ ...notification, show: false });
  };

  const onMissingDependencyClick = (e: any, type: string) => {
    onCancelCallback(e);
    history.push(`/build/${type}`);
  };
  useEffect(() => {
    async function fetchPropertyReferenceValues() {
      if (jsonSchema) {
        setIsLoading(true);
        for (const [key, property] of Object.entries(jsonSchema.properties)) {
          const propertyHasRef = _.has(property, '$ref') && property['$ref'];
          const propertyHasAnyOf = (_.has(property, 'anyOf') || _.has(property, 'allOf')) && _.has(jsonSchema, '$defs');
          if (propertyHasRef || propertyHasAnyOf) {
            const allRefList = propertyHasRef ? [property['$ref']] : getAllRefs(property);
            const refUserProperties = getMatchedUserProperties(allUserProperties, allRefList);
            const missingDependencyList = checkForDependency(refUserProperties, allRefList);
            const title: string = property.hasOwnProperty('title') ? property.title || '' : key;
            const selectedModelRefValues = _.get(updateExistingModel, key, null);
            const htmlSchema = constructHTMLSchema(refUserProperties, title, property, selectedModelRefValues);
            let missingDependencyType: null | string = null;
            if (missingDependencyList.length > 0) {
              missingDependencyType = getMissingDependencyType(jsonSchema.$defs, allRefList);
            }
            setRefValues((prev) => ({
              ...prev,
              [key]: {
                htmlSchema: htmlSchema,
                refUserProperties: refUserProperties,
                missingDependency: {
                  type: missingDependencyType,
                  label: key,
                },
              },
            }));
          }
        }
        setIsLoading(false);
      }
    }

    fetchPropertyReferenceValues();
  }, [jsonSchema]);

  useEffect(() => {
    if (updateExistingModel && type_name === 'deployment') {
      const msg = DEPLOYMENT_INSTRUCTIONS;

      //@ts-ignore
      setInstructionForDeployment((prevState) => ({
        ...prevState,
        gh_repo_url: updateExistingModel.gh_repo_url,
        flyio_app_url: updateExistingModel.flyio_app_url,
        instruction: msg
          //@ts-ignore
          .replaceAll('<gh_repo_url>', updateExistingModel.gh_repo_url)
          //@ts-ignore
          .replaceAll('<flyio_app_url>', updateExistingModel.flyio_app_url),
      }));
    }
  }, [isDeployment]);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      cancelButtonRef.current?.click();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  return (
    <>
      {!instructionForDeployment && isDeployment && (
        <div className='w-full mt-8 px-6.5 py-2'>
          <AgentConversationHistory
            agentConversationHistory={DEPLOYMENT_PREREQUISITES}
            isDeploymentInstructions={true}
            containerTitle='Prerequisites for Deployment Generation and Deployment'
          />
        </div>
      )}
      <DynamicForm
        jsonSchema={jsonSchema}
        formData={formData}
        handleChange={handleChange}
        formErrors={formErrors}
        refValues={refValues}
        isLoading={isLoading}
        onMissingDependencyClick={onMissingDependencyClick}
        updateExistingModel={updateExistingModel}
        handleSubmit={handleSubmit}
        instructionForDeployment={instructionForDeployment}
        onCancelCallback={onCancelCallback}
        cancelButtonRef={cancelButtonRef}
        onDeleteCallback={onDeleteCallback}
      />
      {isLoading && (
        <div className='z-[999999] absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 h-screen'>
          <Loader />
        </div>
      )}
      {notification.show && (
        <NotificationBox type='error' onClick={notificationOnClick} message={notification.message} />
      )}
    </>
  );
};

export default DynamicFormBuilder;
