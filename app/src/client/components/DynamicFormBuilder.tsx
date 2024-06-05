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
    ? `<div class="leading-loose"><span class="text-xl inline-block my-2 underline">Introduction: </span>
The application is based on <a class="underline" href="https://wasp-lang.dev/" target="_blank" rel="noopener noreferrer">Wasp</a>, an open-source framework for building full-stack web apps. The generated application includes:
<span class="ml-5">- A landing page and a chat page</span>
<span class="ml-5">- Username & Password based authentication</span>
<span class="ml-5">- Automated deployment to <a class="underline" href="https://fly.io/" target="_blank" rel="noopener noreferrer">Fly.io</a> using GitHub Actions</span>
<span class="text-xl inline-block my-2 underline">Prerequisites: </span>
Before you begin, ensure you have the following:
<span class="ml-5">1. Fly.io account:</span>
<span class="ml-10">- If you don't have a Fly.io account, you can create one <a class="underline" href="https://fly.io/app/sign-up" target="_blank" rel="noopener noreferrer">here</a>.</span>
<span class="ml-10">- Fly provides free allowances for up to 3 VMs (so deploying a Wasp app to a new account is free), <u><b>but all plans</b></u></span>
<span class="ml-10"><u><b>require you to add your credit card information</b></u> before you can proceed. If you don't, the deployment will fail.</span>

<span class="ml-10"><b><u>Important</u></b>: If you already have a Fly.io account and created more than one organization, make sure you choose "Personal" as the organization </span>
<span class="ml-10"> while creating the Fly.io API Token in the deployment steps below.</span>

<span class="text-xl inline-block my-2 underline">Deployment Steps: </span>
<span class="text-l inline-block my-2 underline">Step 1: Fork the GitHub Repository:</span>
<span class="ml-5">1.1 Fork <a class="underline" href="https://github.com/airtai/fastagency-wasp-app-template" target="_blank" rel="noopener noreferrer">this</a> GitHub Repository to your account. Ensure the checkbox "Copy the main branch only" is checked.</span>
<span class="text-l inline-block my-2 underline">Step 2: Generate Fly.io API Token:</span>
<span class="ml-5">2.1 Go to your <a class="underline" href="https://fly.io/dashboard" target="_blank" rel="noopener noreferrer">Fly.io</a> dashboard and click on the <b>Tokens</b> tab (the one on the left sidebar).</span>
<span class="ml-5">2.2 Enter a name and set the <b>Optional Expiration</b> to 999999h, then click on <b>Create Organization Token</b> to generate a token.</span>
<span class="ml-5">2.3 Copy the token, including the "FlyV1 " prefix and space at the beginning.</span>
<span class="text-l inline-block my-2 underline">Step 3: Set necessary GitHub action secrets:</span>
<span class="ml-5">3.1 Create the below two "repository secrets" in your forked GitHub repository.</span>
<span class="ml-10">Note: If you don't know how to create a secret, follow <a class="underline" href="https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository" target="_blank" rel="noopener noreferrer">this</a> guide.</span>
<span class="ml-10">==================================================================================</span>
<span class="ml-10">FLY_API_TOKEN: <span class="ml-35"><--- paste the value you copied from 2.3 ---></span></span>
<span class="ml-10">FASTAGENCY_APPLICATION_UUID: <span class="ml-10">${instructionForApplication}</span></span>
<span class="ml-10">==================================================================================</span>
<span class="text-l inline-block my-2 underline">Step 4: Set up applications Fly.io:</span>
<span class="ml-5">4.1 Go to the <b>Actions</b> tab in your forked repository on GitHub and click the</span>
<span class="ml-12"><b>I understand my workflows, go ahead and enable them</b> button.</span>
<span class="ml-5">4.2 On the left-hand side, you will see options like: All workflows, Fly Deployment Pipeline, Pipeline.</span>
<span class="ml-5">4.3 Click on the <b>Fly Deployment Pipeline</b> option and and then click the <b>Run workflow</b> button against the main branch.</span>
<span class="ml-5">4.4 Wait for the workflow to complete (approx. 2 mins). Once completed, you will see the Client, Server, and Database apps</span>
<span class="ml-13">created on <a class="underline" href="https://fly.io/dashboard/personal" target="_blank" rel="noopener noreferrer">Fly.io dashboard</a>.</span>
<span class="ml-5">4.5 The workflow will only set up the applications in Fly.io and not deploy the actual application code which</span>
<span class="ml-13">will be done in the next step.</span>
<span class="text-l inline-block my-2 underline">Step 5: Deploy the Application:</span>
<span class="ml-5">5.1 The above workflow might have also created a pull request in your GitHub repository to update the <b>fly.toml</b> files.</span>
<span class="ml-5">5.2 Go to the <b>Pull requests</b> tab in your forked repository on GitHub and merge the PR named "Add Fly.io configuration files".
<span class="ml-5">5.3 It will trigger the below workflows in sequence:</span>
<span class="ml-13">- Pipeline to run tests and verify the build (approx. 2 mins).</span>
<span class="ml-13">- Pipeline to deploy the tested application to Fly.io (approx. 5 - 10 mins).</span>
<span class="ml-5">5.4 Once the workflow is completed, you can access your application using the hostname provided in the Fly.io dashboard.</span>
<span class="ml-5">5.5 Go to fly dashboard and click on the client application (similar to: fastagency-app-******-client). </span>
<span class="ml-5">5.6 The hostname is the URL of your application. Open the URL in your browser to launch your application.</span>
<span class="text-xl inline-block my-2 underline">Application customization (Optional): </span>
<span class="ml-5">- You can perform basic customization such as changing the app name and adding a support email address in the generated application by</span>
<span class="ml-9"> setting the below optional "repository variables" (not repository secrets). Click <a class="underline" href="https://docs.github.com/en/actions/learn-github-actions/variables" target="_blank" rel="noopener noreferrer">here</a> to learn how to set repository variables.</span>
<span class="ml-10">==================================================================================</span>
<span class="ml-10">REACT_APP_NAME: <span class="ml-35"> <--- Your App Name ---> </span></span>
<span class="ml-10">REACT_APP_SUPPORT_EMAIL: <span class="ml-19"> <--- Your Support Email Address ---> </span></span>
<span class="ml-10">==================================================================================</span>
<span class="ml-5">- After setting the repository variables, you can manualy trigger the <b>Fly Deployment Pipeline</b> workflow (refer 4.2 and 4.3) to deploy the changes.</span>
<span class="ml-5">- For further customization, you can refer to the <a class="underline" href="https://wasp-lang.dev/docs/" target="_blank" rel="noopener noreferrer">Wasp documentation</a>.</span>
<span class="text-xl inline-block my-2 underline">Troubleshooting: </span>
<span class="ml-5">If you encounter any issues during the deployment, check the following common problems:</span>
<span class="ml-10 underline">Deployment Failures: </span>
<span class="ml-10">- Make sure you have added a payment method to your Fly.io account. Else, the deployment will fail.</span>
<span class="ml-10">- Review the deployment logs on Fly.io for any error messages. You can access the logs by clicking on the</span>
<span class="ml-15">server application on the Fly.io dashboard and then clicking on the Live Logs tab.</span>
<span class="ml-5">- If you need any help, please reach out to us on <a class="underline" href="https://discord.gg/KgtGKbsh" target="_blank" rel="noopener noreferrer">discord</a>.</span>
</div>
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
