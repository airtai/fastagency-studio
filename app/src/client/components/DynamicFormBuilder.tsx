import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { DISCORD_URL } from '../../shared/constants';

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

const SECRETS_TO_MASK = ['api_key', 'gh_token', 'fly_token'];

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
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const showDeployInstructions = type_name === 'application';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Avoid creating duplicate applications
    if (instructionForApplication && !updateExistingModel) {
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
      onSuccessCallback(response);
      showDeployInstructions && !updateExistingModel && setInstructionForApplication(response.uuid);
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
          const propertyHasAnyOf = (_.has(property, 'anyOf') || _.has(property, 'allOf')) && _.has(jsonSchema, '$defs');
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

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      cancelButtonRef.current?.click();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  const appDeploymentPrerequisites = `<div class="ml-2 mr-2 leading-loose">We've automated the application generation and deployment process so you can focus on building your application without worrying about deployment complexities.
The deployment process includes:
<span class="ml-5">- Automatically creating a new GitHub repository with the generated application code in your GitHub account.</span>
<span class="ml-5">- Automatically deploying the application to Fly.io using GitHub Actions.</span>
<span class="text-xl inline-block my-2 underline">Prerequisites: </span>
Before you begin, ensure you have the following:
<span class="ml-5">1. GitHub account:</span>
<span class="ml-10">- If you don't have a GitHub account, you can create one <a class="underline" href="https://github.com/signup" target="_blank" rel="noopener noreferrer">here</a>.</span>
<span class="ml-10">- A GitHub personal access token. If you don't have one, you can generate it by following this <a class="underline" href="https://docs.github.com/github/authenticating-to-github/creating-a-personal-access-token" target="_blank" rel="noopener noreferrer">guide</a>.</span>
<span class="ml-10"><b><u>Note</u></b>: The minimum required scopes for the token are: <b>repo</b>, <b>read:org</b>, and <b>gist</b>.</span>

<span class="ml-5">2. Fly.io account:</span>
<span class="ml-10">- If you don't have a Fly.io account, you can create one <a class="underline" href="https://fly.io/app/sign-up" target="_blank" rel="noopener noreferrer">here</a>. Fly provides free allowances for up to 3 VMs, so deploying a Wasp app </b></u></span>
<span class="ml-12">to a new account is free <u><b>but all plans require you to add your credit card information</b></u></span>
<span class="ml-10">- A Fly.io API token. If you don't have one, you can generate it by following the steps below.</span>
<span class="ml-15">- Go to your <a class="underline" href="https://fly.io/dashboard" target="_blank" rel="noopener noreferrer">Fly.io</a> dashboard and click on the <b>Tokens</b> tab (the one on the left sidebar).</span>
<span class="ml-15">- Enter a name and set the <b>Optional Expiration</b> to 999999h, then click on <b>Create Organization Token</b> to generate a token.</span>
<span class="ml-10"><b><u>Note</u></b>: If you already have a Fly.io account and created more than one organization, make sure you choose "Personal" as the organization </span>
<span class="ml-10"> while creating the Fly.io API Token in the deployment steps below.</span>

<span class="text-l inline-block my-2"><b><u>Note</u></b>: <b>We do not store your GitHub personal access token or Fly.io API token. So you need to provide them each time you deploy an application.</b></span>
</div>
`;

  const deploymentInstructions = showDeployInstructions
    ? `<div class="leading-loose ml-2 mr-2"> - We are generating your application code and deploying it to Fly.io. This process may take a couple of minutes. Please refresh the page after a couple of minutes to see the status of the deployment.</div>
<span class="text-l inline-block my-2 underline">Troubleshooting: </span>
<span class="ml-5">- If you encounter any issues during the deployment, check the following common problems:</span>
<span class="ml-10">- Deployment Failures: </span>
<span class="ml-13">- Make sure you have added a payment method to your Fly.io account. Else, the deployment will fail.</span>
<span class="ml-13">- Review the deployment logs on Fly.io for any error messages. You can access the logs by clicking on the</span>
<span class="ml-17">server application on the <a class="underline" href="https://fly.io/dashboard" target="_blank" rel="noopener noreferrer">Fly.io dashboard</a> and then clicking on the Live Logs tab.</span>
<span class="ml-5">- If you need any help, please reach out to us on <a class="underline" href=${DISCORD_URL} target="_blank" rel="noopener noreferrer">discord</a>.</span>
</div>
`
    : '';

  return (
    <>
      {!instructionForApplication && (
        <div className='w-full mt-8 px-6.5 py-2'>
          <AgentConversationHistory
            agentConversationHistory={appDeploymentPrerequisites}
            isDeploymentInstructions={true}
            containerTitle='Prerequisites for Application Generation and Deployment'
          />
        </div>
      )}
      {/* <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-9 px-6.5 py-2'> */}
      <form onSubmit={handleSubmit} className='px-6.5 py-2'>
        {Object.entries(jsonSchema.properties).map(([key, property]) => {
          if (key === 'uuid') {
            return null;
          }
          const inputValue = formData[key] || '';

          let formElementsObject = property;
          if (_.has(property, '$ref') || _.has(property, 'anyOf') || _.has(property, 'allOf')) {
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
                  type={_.includes(SECRETS_TO_MASK, key) && typeof inputValue === 'string' ? 'password' : 'text'}
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
              containerTitle='Application Details and Next Steps'
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
              ref={cancelButtonRef}
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
