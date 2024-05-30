import React, { useState, useEffect } from 'react';
import _ from 'lodash';

import { useForm } from '../hooks/useForm';
import { JsonSchema } from '../interfaces/BuildPageInterfaces';
import { TextInput } from './form/TextInput';
import { SelectInput } from './form/SelectInput';
import { TextArea } from './form/TextArea';
import { validateForm } from '../services/commonService';
import { parseValidationErrors } from '../app/utils/formHelpers';
import Loader from '../admin/common/Loader';
import NotificationBox from './NotificationBox';

import { SelectedModelSchema } from '../interfaces/BuildPageInterfaces';
import {
  // getPropertyReferenceValues,
  getFormSubmitValues,
  getRefValues,
  getMatchedUserProperties,
  constructHTMLSchema,
  getAllRefs,
  checkForDependency,
  getSecretUpdateFormSubmitValues,
  getSecretUpdateValidationURL,
} from '../utils/buildPageUtils';
import { set } from 'zod';
import { NumericStepperWithClearButton } from './form/NumericStepperWithClearButton';
import AgentConversationHistory from './AgentConversationHistory';

interface DynamicFormBuilderProps {
  allUserProperties: any;
  type_name: string;
  jsonSchema: JsonSchema;
  validationURL: string;
  updateExistingModel: SelectedModelSchema | null;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: (event: React.FormEvent) => void;
  onDeleteCallback: (data: any) => void;
}

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
  const [showNotification, setShowNotification] = useState(false);
  const [refValues, setRefValues] = useState<Record<string, any>>({});
  const [missingDependency, setMissingDependency] = useState<string[]>([]);
  const [instructionForApplication, setInstructionForApplication] = useState<string | null>(null);

  const showDeployInstructions = type_name === 'application';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      onSuccessCallback(response);
      showDeployInstructions && setInstructionForApplication(response.uuid);
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
  const missingDependencyNotificationMsg = `Please create atleast one item of type "${missingDependency.join(
    ', '
  )}" to proceed.`;

  const notificationOnClick = () => {
    setShowNotification(false);
  };
  useEffect(() => {
    async function fetchPropertyReferenceValues() {
      if (jsonSchema) {
        setIsLoading(true);
        for (const [key, property] of Object.entries(jsonSchema.properties)) {
          const propertyHasRef = _.has(property, '$ref') && property['$ref'];
          const propertyHasAnyOf = _.has(property, 'anyOf') && _.has(jsonSchema, '$defs');
          if (propertyHasRef || propertyHasAnyOf) {
            const allRefList = propertyHasRef ? [property['$ref']] : getAllRefs(property);
            const refUserProperties = getMatchedUserProperties(allUserProperties, allRefList);
            const missingDependencyList = checkForDependency(refUserProperties, allRefList);
            const title: string = property.hasOwnProperty('title') ? property.title || '' : key;
            const selectedModelRefValues = _.get(updateExistingModel, key, null);
            const htmlSchema = constructHTMLSchema(refUserProperties, title, property, selectedModelRefValues);
            if (missingDependencyList.length > 0) {
              setMissingDependency((prev) => {
                const newMissingDependencies = missingDependencyList.filter((item) => !prev.includes(item));
                return prev.concat(newMissingDependencies);
              });
            }
            setRefValues((prev) => ({
              ...prev,
              [key]: {
                htmlSchema: htmlSchema,
                refUserProperties: refUserProperties,
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
    if (missingDependency) {
      if (missingDependency.length > 0) {
        setShowNotification(true);
      }
    }
  }, [missingDependency?.length]);

  useEffect(() => {
    updateExistingModel && type_name === 'application' && setInstructionForApplication(updateExistingModel.uuid);
  }, [showDeployInstructions]);

  const deploymentInstructions = showDeployInstructions
    ? `Congrats! You are one step away from deploying your application.

The app will be based on <a class="underline" href="https://wasp-lang.dev/" target="_blank" rel="noopener noreferrer">wasp</a>, a open-source framework for building full-stack web apps.

<u>Prerequisites:</u>

1) A Google account to create a Google OAuth app. Please follow instructions from <a class="underline" href="https://wasp-lang.dev/docs/auth/social-auth/google#3-creating-a-google-oauth-app" target="_blank" rel="noopener noreferrer">here</a> to create the OAuth app.
2) A stripe account. Please follow the instructions from <a class="underline" href="https://docs.opensaas.sh/guides/stripe-integration/" target="_blank" rel="noopener noreferrer">here</a> to get the API keys.
3) A <a class="underline" href="https://fly.io/" target="_blank" rel="noopener noreferrer">fly.io</a> account. So make sure you have a fly.io account. Fly provides free allowances
for up to 3 VMs (so deploying a Wasp app to a new account is free), but all plans require you to add your credit card information before
you can proceed. If you don't, the deployment will fail.

Once you have the prerequisites ready, follow the steps below to deploy your application:

1) Please fork the base GitHub repository from <a class="underline" href="https://github.com/airtai/fastagency-wasp-app-template" target="_blank" rel="noopener noreferrer">here</a>
2) Go to the forked repository and create the following environment secrets in the repository settings:

<u>FastAgency secret:</u>

<span class="ml-3">- FASTAGENCY_APPLICATION_UUID: ${instructionForApplication}</span>

<u>Stripe secrets:</u>

<span class="ml-3">- PRO_SUBSCRIPTION_PRICE_ID</span>
<span class="ml-3">- STRIPE_KEY</span>
<span class="ml-3">- STRIPE_WEBHOOK_SECRET</span>
<span class="ml-3">- REACT_APP_STRIPE_CUSTOMER_PORTAL</span>

<u>Google OAuth secrets:</u>

<span class="ml-3">- GOOGLE_CLIENT_ID</span>
<span class="ml-3">- GOOGLE_CLIENT_SECRET</span>

3) To be written once we have the deployment instructions ready.....
`
    : '';

  return (
    <>
      {/* <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-9 px-6.5 py-2'> */}
      <form onSubmit={handleSubmit} className='px-6.5 py-2'>
        {Object.entries(jsonSchema.properties).map(([key, property]) => {
          if (key === 'uuid') {
            return null;
          }
          const inputValue = formData[key] || '';

          let formElementsObject = property;
          if (_.has(property, '$ref') || _.has(property, 'anyOf')) {
            if (refValues[key]) {
              formElementsObject = refValues[key].htmlSchema;
            }
          }

          // return formElementsObject?.enum?.length === 1 ? null : (
          return (
            <div key={key} className='w-full mt-2'>
              <label htmlFor={key}>{formElementsObject.title}</label>
              {formElementsObject.enum ? (
                formElementsObject.type === 'numericStepperWithClearButton' ? (
                  <div>
                    <NumericStepperWithClearButton
                      id={key}
                      value={inputValue}
                      formElementObject={formElementsObject}
                      onChange={(value) => handleChange(key, value)}
                    />
                  </div>
                ) : (
                  <SelectInput
                    id={key}
                    value={inputValue}
                    options={formElementsObject.enum}
                    onChange={(value) => handleChange(key, value)}
                  />
                )
              ) : key === 'system_message' ? (
                <TextArea
                  id={key}
                  value={inputValue}
                  placeholder={formElementsObject.description || ''}
                  onChange={(value) => handleChange(key, value)}
                />
              ) : (
                <TextInput
                  id={key}
                  type={key === 'api_key' && typeof inputValue === 'string' ? 'password' : 'text'}
                  value={inputValue}
                  placeholder={formElementsObject.description || ''}
                  onChange={(value) => handleChange(key, value)}
                />
              )}
              {formErrors[key] && <div style={{ color: 'red' }}>{formErrors[key]}</div>}
            </div>
          );
        })}
        {instructionForApplication && (
          <div className='w-full mt-8'>
            <AgentConversationHistory
              agentConversationHistory={deploymentInstructions}
              isDeploymentInstructions={true}
            />
          </div>
        )}
        <div className='col-span-full mt-7'>
          <div className='float-right'>
            <button
              className='rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              disabled={isLoading}
              data-testid='form-cancel-button'
              onClick={onCancelCallback}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='ml-3 rounded-md px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              disabled={isLoading}
              data-testid='form-submit-button'
            >
              Save
            </button>
          </div>

          {updateExistingModel && (
            <button
              type='button'
              className='float-left rounded-md px-3.5 py-2.5 text-sm border bg-airt-error text-airt-font-base hover:bg-opacity-80 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
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
      {showNotification && (
        <NotificationBox
          type='error'
          onClick={notificationOnClick}
          message={missingDependency.length > 0 ? missingDependencyNotificationMsg : notificationMsg}
        />
      )}
    </>
  );
};

export default DynamicFormBuilder;
