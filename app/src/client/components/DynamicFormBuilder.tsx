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
    ? `<div class="leading-loose"><p class="text-xl underline">Introduction: </p>
Congratulations! You are just one step away from deploying your application. This guide will walk you through the process to ensure
a smooth deployment.

The application is based on <a class="underline" href="https://wasp-lang.dev/" target="_blank" rel="noopener noreferrer">Wasp</a>, an open-source framework for building full-stack web apps. It includes:

  - A simple landing page
  - Google OAuth authentication
  - Subscription-based payment system using <a class="underline" href="https://stripe.com/in" target="_blank" rel="noopener noreferrer">Stripe</a>.
  - Automated deployment to <a class="underline" href="https://fly.io/" target="_blank" rel="noopener noreferrer">Fly.io</a> using GitHub Actions

<u>Note</u>: The generated application will have default configurations, logo, page contents and payment plans. Please refer to the
<a class="underline" href="https://docs.opensaas.sh/" target="_blank" rel="noopener noreferrer">Wasp OpenSaaS documentation</a> for customizing the application further.

<p class="text-xl underline">Prerequisites: </p>
Before you begin, ensure you have the following:

1. Google account
2. Stripe account. If you don't have a Stripe account, you can create one by following <a class="underline" href="https://support.stripe.com/questions/getting-started-with-stripe-create-or-connect-an-account" target="_blank" rel="noopener noreferrer">this</a> instructions.
3. Fly.io account.

<p class="text-xl underline">Deployment Process: </p>
The deployment process consists of two main steps:

1. Setting up the applications on Fly.io
2. Deploying the actual application code

<p class="text-l underline">Step 1: Set Up the Applications on Fly.io: </p>
1.1 Fork <a class="underline" href="https://github.com/airtai/fastagency-wasp-app-template" target="_blank" rel="noopener noreferrer">this</a> GitHub Repository to your account.
1.2 Generate Fly.io API Token and Set It in GitHub Actions:
<span class="ml-5">1.2.1 Go to your Fly.io dashboard and click on the <b>Tokens</b> tab.</span>
<span class="ml-5">1.2.2 Enter a name and set the <b>Optional Expiration</b> to 999999h, then click on <b>Create Organization Token</b> to generate a token.</span>
<span class="ml-5">1.2.3 Copy the token, including the "FlyV1 " prefix and space at the beginning.</span>
<span class="ml-5">1.2.4 Create a new repository secret named <b>FLY_API_TOKEN</b> and paste the token. Follow <a class="underline" href="https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository" target="_blank" rel="noopener noreferrer">this</a> guide to learn how to set up a new GitHub Actions secret.</span>
1.3 Create Client, Server, and Database Apps on Fly.io
<span class="ml-5">1.3.1 Go to the <b>Actions</b> tab in your forked repository on GitHub and click the <b>I understand my workflows, go ahead and enable them</b> button.
<span class="ml-5">1.3.2 On the left-hand side, you will see options like: All workflows, Fly Deployment Pipeline, Pipeline</span>
<span class="ml-5">1.3.3 Click on the <b>Fly Deployment Pipeline</b> option and and then click the <b>Run workflow</b> button against the main branch.</span>
<span class="ml-5">1.3.4 Wait for the workflow to complete. Once completed, you will see the Client, Server, and Database apps created on <a class="underline" href="https://fly.io/dashboard/personal" target="_blank" rel="noopener noreferrer">Fly.io dashboard</a>.</span>
<span class="ml-5">1.3.5 The workflow might have also created a pull request to update the <b>fly.toml</b> file. <u>Do not merge it yet, we need to add a few environment variables first.</u></span>

<p class="text-l underline">Step 2: Deploying the actual application code: </p>
<b>Note:</b> All the environment variables mentioned below should be added as GitHub Actions repository secrets unless otherwise explicitly specified.

2.1 Create a Google OAuth App:
<span class="ml-5">2.1.1 Follow the instructions mentioned in <a class="underline" href="https://wasp-lang.dev/docs/auth/social-auth/google#3-creating-a-google-oauth-app" target="_blank" rel="noopener noreferrer">3. Creating a Google OAuth App</a> to create and setup up the Google OAuth App.
<span class="ml-5">2.1.2 Ensure you add the correct "Authorized redirect URI". Follow these steps to get your API server URI:
<span class="ml-10">2.1.2.1 Go to the Fly.io dashboard and click on the server application. The name will be similar to <b>fastagency-app-****-server</b>.
<span class="ml-10">2.1.2.2 Copy the Hostname and add the relative URI <b>auth/google/callback</b> to the hostname. This is the URI you need to</span>
<span class="ml-25">put in the Authorized redirect URI field. The URI will look something like: https://fastagency-app-***-server.fly.dev/auth/google/callback</span></span>
<span class="ml-5">2.1.3 Once you have your Client ID and Client Secret, add them as repository secrets named <b>GOOGLE_CLIENT_ID</b> and <b>GOOGLE_CLIENT_SECRET</b>.</span>
2.2 Create Test Stripe API Keys:
<span class="ml-5">2.2.1 Navigate to <a class="underline" href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer">Stripe API Keys</a> or go to the Stripe Dashboard and click on Developers.</span>
<span class="ml-5">2.2.2 Click on the <b>Reveal test key token</b> button, copy the Secret key, and set it as a repository secret named <b>STRIPE_KEY</b>.</span>
2.3 Create a Stripe Test Product:
<span class="ml-5">2.3.1 Go to the <a class="underline" href="https://dashboard.stripe.com/test/products" target="_blank" rel="noopener noreferrer">Stripe Test Products</a> page.
<span class="ml-5">2.3.2 Click on the <b>Add a product</b> button and fill in the relevant information for your product.
<span class="ml-5">2.3.3 If you are unsure which Product tax code to choose, select <b>Software as a service (SaaS)</b>.
<span class="ml-5">2.3.4 Ensure you select <b>Recurring</b> as the billing type and enter an amount.
<span class="ml-5">2.3.5 After saving the product, go to the product page.
<span class="ml-5">2.3.6 Click on the newly created product, copy the API ID (under pricing), and set it as a repository secret named <b>PRO_SUBSCRIPTION_PRICE_ID</b>.</span>
2.4 Set Up Stripe Webhooks
<span class="ml-5">2.4.1 Go to <a class="underline" href="https://dashboard.stripe.com/test/webhooks" target="_blank" rel="noopener noreferrer">Stripe Webhooks</a></span>
<span class="ml-5">2.4.2 Click on <b>Add endpoint</b> under <b>Hosted endpoints</b>.</span>
<span class="ml-5">2.4.3 Add the /stripe-webhook Endpoint. The URL should look something like: <b>https://fastagency-app-***-server.fly.dev/stripe-webhook</b>.</span>
<span class="ml-5">2.4.4 Add the following events to listen to: <b>checkout.session.completed</b>, <b>customer.subscription.deleted</b>, <b>customer.subscription.updated</b>, <b>invoice.paid</b>.
<span class="ml-5">2.4.5 Add the endpoint.</span>
<span class="ml-5">2.4.6 Click on <b>Reveal</b> under <b>Signing secret</b>. Copy the value and set it as a repository secret named <b>STRIPE_WEBHOOK_SECRET</b>.</span>
2.5 Get Your Customer Portal Link
<span class="ml-5">1. Go to the <a class="underline" href="https://dashboard.stripe.com/test/settings/billing/portal" target="_blank" rel="noopener noreferrer">Stripe Customer Portal Setings</a> in the Stripe Dashboard.</span>
<span class="ml-5">2. Activate and copy the Customer portal link.</span>
<span class="ml-5">3. Set the link as a repository variable named <b>REACT_APP_STRIPE_CUSTOMER_PORTAL</b> (this should be a repository variable, not a secret).</span>

2.6 Add FastAgency Application Environment Secret
<span class="ml-5">1. Add a new repository secret named <b>FASTAGENCY_APPLICATION_UUID</b> and set its value to ${instructionForApplication}.</span>

2.7 Review all the repository secrets you have added. You should have the following secrets:
<span class="ml-10">- FLY_API_TOKEN</span>
<span class="ml-10">- GOOGLE_CLIENT_ID</span>
<span class="ml-10">- GOOGLE_CLIENT_SECRET</span>
<span class="ml-10">- STRIPE_KEY</span>
<span class="ml-10">- PRO_SUBSCRIPTION_PRICE_ID</span>
<span class="ml-10">- STRIPE_WEBHOOK_SECRET</span>
<span class="ml-10">- FASTAGENCY_APPLICATION_UUID</span>

2.8 Review the repository variables you have added. You should have the following variables:
<span class="ml-10">- REACT_APP_STRIPE_CUSTOMER_PORTAL</span>

2.9 Deploy the Application:
<span class="ml-5">2.9.1 Go to the <b>Pull requests</b> tab in your forked repository on GitHub and merge the PR named "Add Fly.io configuration files".
<span class="ml-5">2.9.2 It will trigger a new workflow to deploy the application. Wait for the workflow to complete.</span>
<span class="ml-5">2.9.3 Once the workflow is completed, you can access your application at the Client App URL provided in the workflow logs.</span>

<p class="text-xl underline">Troubleshooting: </p>
If you encounter any issues during the deployment, check the following common problems:
Incorrect Environment Secrets:
<span class="ml-10">- Ensure all secrets are correctly set in GitHub.</span>
<span class="ml-10">- Missing Account Information:</span>
<span class="ml-10">- Verify that all prerequisite accounts (Google, Stripe, Fly.io) are properly set up and linked.</span>
Deployment Failures:
<span class="ml-10">- Review the deployment logs on Fly.io for any error messages and resolve them accordingly.</span>
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
