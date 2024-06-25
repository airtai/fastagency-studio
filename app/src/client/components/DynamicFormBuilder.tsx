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

const deploymentInprogressInstructions = `<div class="leading-loose ml-2 mr-2"><span class="text-l inline-block my-2 underline">GitHub Repository Created</span>
<span class="ml-5">- We have created a new <a class="underline" href="<gh_repo_url>" target="_blank" rel="noopener noreferrer">GitHub repository</a> in your GitHub account.</span>
<span class="ml-5">- The application code will be pushed to this repository in a few seconds.</span>
<span class="text-l inline-block my-2 underline">Checking Deployment Status</span>
<span class="ml-5">- Once the application code is pushed, new workflows will be triggered to test and deploy the application</span>
<span class="ml-10">to Fly.io. You can check the status of the same on the GitHub repository's <a class="underline" href="<gh_repo_url>/actions" target="_blank" rel="noopener noreferrer">actions</a> page.</span>
<span class="text-l inline-block my-2 underline">Next Steps</span>
<span class="ml-5">- Wait for the workflows to complete:
<span class="ml-13">- Workflow to run tests and verify the build (approx. 2 mins).</span>
<span class="ml-13">- Workflow to deploy the application to Fly.io (approx. 8 - 10 mins).</span>

<span class="ml-5">- Once the "Fly Deployment Pipeline" completes. Please follow the below steps to access your application:</span>
<span class="ml-10">- Click on the "Fly Deployment Pipeline" action.</span>
<span class="ml-10">- Click on "onetime_app_setup" job.</span>
<span class="ml-10">- Click on "Deploy wasp application to fly" step.</span>
<span class="ml-10">- Scroll all the way to the bottom, you will see a sentence "Client has been deployed! Your Wasp </span>
<span class="ml-13">app is accessible" in the logs. Click on the link next to it to access your application.</span></span>

<span class="ml-5">- Adding the fly.io configuration files:</span>
<span class="ml-10">- The above workflow might have also created a pull request in your GitHub repository</span>
<span class="ml-13">to update the <b>fly.toml</b> configuration files.</span>
<span class="ml-10">- Go to the <b>Pull requests</b> tab in your repository and merge the PR named "Add Fly.io configuration files".</span>
<span class="ml-13">You will be needing this to deploy your application to Fly.io in the future.</span></span>
<span class="text-l inline-block my-2 underline">Need Help?</span>
<span class="ml-10">- If you encounter any issues or need assistance, please reach out to us on <a class="underline" href=${DISCORD_URL} target="_blank" rel="noopener noreferrer">discord</a>.</span>
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
  const [instructionForDeployment, setInstructionForDeployment] = useState<Record<string, string> | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const isDeployment = type_name === 'deployment';

  const missingDependencyNotificationMsg = `Please create atleast one item of type "${missingDependency.join(
    ', '
  )}" to proceed.`;

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
          instruction: deploymentInprogressInstructions.replaceAll(
            '<gh_repo_url>',
            onSuccessCallbackResponse.gh_repo_url
          ),
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
    if (updateExistingModel && type_name === 'deployment') {
      const msg = deploymentInprogressInstructions;

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

  const appDeploymentPrerequisites = `<div class="ml-2 mr-2 leading-loose">We've automated the application generation and deployment process so you can focus on building your application
without worrying about deployment complexities.

The deployment process includes:
<span class="ml-5">- Automatically creating a new GitHub repository with the generated application code in your GitHub account.</span>
<span class="ml-5">- Automatically deploying the application to Fly.io using GitHub Actions.</span>
<span class="text-xl inline-block my-2 underline">Prerequisites: </span>
Before you begin, ensure you have the following:
<span class="ml-5">1. GitHub account:</span>
<span class="ml-10">- If you don't have a GitHub account, you can create one <a class="underline" href="https://github.com/signup" target="_blank" rel="noopener noreferrer">here</a>.</span>
<span class="ml-10">- A GitHub personal access token. If you don't have one, you can generate it by following this <a class="underline" href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic" target="_blank" rel="noopener noreferrer">guide</a>.</span>
<span class="ml-10"><b><u>Note</u></b>: The minimum required scopes for the token are: <b>repo</b>, <b>workflow</b>, <b>read:org</b>, <b>gist</b> and <b>user:email</b>.</span>

<span class="ml-5">2. Fly.io account:</span>
<span class="ml-10">- If you don't have a Fly.io account, you can create one <a class="underline" href="https://fly.io/app/sign-up" target="_blank" rel="noopener noreferrer">here</a>. Fly provides free allowances for up to 3 VMs, so deploying a Wasp app </b></u></span>
<span class="ml-12">to a new account is free <u><b>but all plans require you to add your credit card information</b></u></span>
<span class="ml-10">- A Fly.io API token. If you don't have one, you can generate it by following the steps below.</span>
<span class="ml-15">- Go to your <a class="underline" href="https://fly.io/dashboard" target="_blank" rel="noopener noreferrer">Fly.io</a> dashboard and click on the <b>Tokens</b> tab (the one on the left sidebar).</span>
<span class="ml-15">- Enter a name and set the <b>Optional Expiration</b> to 999999h, then click on <b>Create Organization Token</b> to generate a token.</span>
<span class="ml-10"><b><u>Note</u></b>: If you already have a Fly.io account and created more than one organization, make sure you choose "Personal" as the organization </span>
<span class="ml-10"> while creating the Fly.io API Token in the deployment steps below.</span>
</div>
`;

  return (
    <>
      {!instructionForDeployment && isDeployment && (
        <div className='w-full mt-8 px-6.5 py-2'>
          <AgentConversationHistory
            agentConversationHistory={appDeploymentPrerequisites}
            isDeploymentInstructions={true}
            containerTitle='Prerequisites for Deployment Generation and Deployment'
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
        {instructionForDeployment && instructionForDeployment.instruction && (
          <div className='w-full mt-8'>
            <AgentConversationHistory
              agentConversationHistory={instructionForDeployment.instruction}
              isDeploymentInstructions={true}
              containerTitle='Deployment Details and Next Steps'
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
