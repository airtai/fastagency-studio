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

const deploymentInprogressInstructions = `<div class="leading-loose ml-2 mr-2">
- Appication deployment status: <b>In Progress</b>

<span class="text-l inline-block my-2 underline">GitHub Repository Created</span>
<span class="ml-5">- We have created a new <a class="underline" href="<gh_repo_url>" target="_blank" rel="noopener noreferrer">GitHub repository</a> in your GitHub account.</span>
<span class="ml-5">- The application code will be pushed to this repository in a few minutes.</span>
<span class="text-l inline-block my-2 underline">Checking Deployment Status</span>
<span class="ml-5">- You can either check the status on the GitHub repository page or come back to this page after a few minutes.</span>
<span class="text-l inline-block my-2 underline">Troubleshooting: </span>
<span class="ml-5"><b>Common Issues:</b></span>
<span class="ml-10">- In Progress Status for Too Long (more than 10 - 15 mins): </span>
<span class="ml-13">- Ensure you have entered the correct gh_token and fly_token.</span>
<span class="ml-13">- Verify that you have added a payment method to your Fly.io account; otherwise, the deployment will fail.</span>
<span class="ml-13">- Review the deployment logs on Fly.io for any error messages. Access the logs by clicking on the server application</span>
<span class="ml-17"> on the <a class="underline" href="https://fly.io/dashboard" target="_blank" rel="noopener noreferrer">Fly.io dashboard</a>, then clicking on the "Live Logs" tab.</span>
<span class="ml-5"><b>Need Help?</b></span>
<span class="ml-10">- If you encounter any issues or need assistance, please reach out to us on <a class="underline" href=${DISCORD_URL} target="_blank" rel="noopener noreferrer">discord</a>.</span>
</div>
`;

const deploymentCompleteInstructions = `<div class="leading-loose ml-2 mr-2">- Hurrah! Your application has been successfully pushed to the GitHub repository.

- A new workflow has been triggered to deploy the application to Fly.io. You can check the status on the GitHub repository <a class="underline" href="<gh_repo_url>/actions" target="_blank" rel="noopener noreferrer">actions</a> page.

- Once the deployment workflow is completed (approx 5 - 10 mins), you can access your application using this <a class="underline" href="<flyio_app_url>" target="_blank" rel="noopener noreferrer">link</a>
</div>
`;

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
  const [missingDependency, setMissingDependency] = useState<string[]>([]);
  const [instructionForApplication, setInstructionForApplication] = useState<Record<string, string> | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const isApplication = type_name === 'application';

  const missingDependencyNotificationMsg = `Please create atleast one item of type "${missingDependency.join(
    ', '
  )}" to proceed.`;

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
      const onSuccessCallbackResponse = await onSuccessCallback(response);

      isApplication &&
        !updateExistingModel &&
        setInstructionForApplication((prevState) => ({
          ...prevState,
          gh_repo_url: response.gh_repo_url,
          // @ts-ignore
          instruction: deploymentInprogressInstructions.replace('<gh_repo_url>', onSuccessCallbackResponse.gh_repo_url),
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
        // missingDependency.length > 0 ? missingDependencyNotificationMsg
        setNotification({ ...notification, show: true });
      }
    }
  }, [missingDependency?.length]);

  useEffect(() => {
    if (updateExistingModel && type_name === 'application') {
      const msg =
        updateExistingModel.app_deploy_status === 'inprogress'
          ? deploymentInprogressInstructions
          : deploymentCompleteInstructions;

      //@ts-ignore
      setInstructionForApplication((prevState) => ({
        ...prevState,
        gh_repo_url: updateExistingModel.gh_repo_url,
        flyio_app_url: updateExistingModel.flyio_app_url,
        instruction: msg
          //@ts-ignore
          .replace('<gh_repo_url>', updateExistingModel.gh_repo_url)
          //@ts-ignore
          .replace('<flyio_app_url>', updateExistingModel.flyio_app_url),
      }));
    }
  }, [isApplication]);

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
<span class="ml-10"><b><u>Note</u></b>: The minimum required scopes for the token are: <b>repo</b>, <b>workflow</b>, <b>read:org</b>, <b>gist</b> and <b>user:email</b>.</span>

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

  return (
    <>
      {!instructionForApplication && isApplication && (
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
        {instructionForApplication && instructionForApplication.instruction && (
          <div className='w-full mt-8'>
            <AgentConversationHistory
              agentConversationHistory={instructionForApplication.instruction}
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
        <div className='z-[999999] absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 h-screen'>
          <Loader />
        </div>
      )}
      {notification.show && (
        <NotificationBox
          type='error'
          onClick={notificationOnClick}
          message={missingDependency.length > 0 ? missingDependencyNotificationMsg : notification.message}
        />
      )}
    </>
  );
};

export default DynamicFormBuilder;
