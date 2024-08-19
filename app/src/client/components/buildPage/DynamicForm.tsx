import React, { useMemo, useRef } from 'react';
import _ from 'lodash';
import { PropertySchemaParser, SetUpdateFormStack, Flow, UserProperties } from './PropertySchemaParser';
import { useEscapeKeyHandler } from '../../hooks/useEscapeKeyHandler';
import { usePropertyManager } from './usePropertyManager';
import { FormField } from './FormField';
import Loader from '../../admin/common/Loader';
import NotificationBox from '../NotificationBox';
import { DEPLOYMENT_PREREQUISITES, DEPLOYMENT_INSTRUCTIONS } from '../../utils/constants';
import AgentConversationHistory from '../AgentConversationHistory';

interface DynamicFormProps {
  parser: PropertySchemaParser | null;
  updateFormStack: SetUpdateFormStack;
  refetchUserProperties: () => void;
  popFromStack: (userProperties: UserProperties[] | null) => void;
}

const LoaderContainer = () => (
  <div className='fixed inset-0 z-[999999] flex items-center justify-center bg-white bg-opacity-50'>
    <Loader />
  </div>
);

const DeploymentNextSteps = ({ githubUrl }: { githubUrl: string }) => {
  const instructions = DEPLOYMENT_INSTRUCTIONS.replaceAll('<gh_repo_url>', githubUrl);
  return (
    <>
      <div className='mt-7'>
        <AgentConversationHistory
          agentConversationHistory={instructions}
          isDeploymentInstructions={true}
          containerTitle='Deployment Details and Next Steps'
        />
      </div>
    </>
  );
};

const DeploymentPrerequisites = ({ successResponse }: { successResponse: any }) => {
  if (!successResponse) {
    return (
      <AgentConversationHistory
        agentConversationHistory={DEPLOYMENT_PREREQUISITES}
        isDeploymentInstructions={true}
        containerTitle='Prerequisites for Deployment Generation and Deployment'
      />
    );
  } else {
    const githubUrl = successResponse?.gh_repo_url || '';
    return <DeploymentNextSteps githubUrl={githubUrl} />;
  }
};

const DeploymentInstructions = ({ parser }: { parser: any }) => {
  const activeModelObj = parser?.getActiveModelObj();
  const githubUrl: string = activeModelObj?.json_str.gh_repo_url || '';
  return <DeploymentNextSteps githubUrl={githubUrl} />;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  parser,
  updateFormStack,
  refetchUserProperties,
  popFromStack,
}) => {
  const { form, schema, handleCtaAction, isLoading, setNotification, notification, successResponse } =
    usePropertyManager(parser, updateFormStack, refetchUserProperties, popFromStack);

  const formFields = useMemo(() => {
    if (schema && 'json_schema' in schema) {
      return Object.entries(schema.json_schema.properties).map(([key, property]: [string, any]) => {
        if (key === 'uuid') {
          return null;
        }
        const isReferenceField = parser?.checkIfRefField(property);
        let propertyCopy = Object.assign({}, property);
        let isOptionalRefField = false;
        if (isReferenceField) {
          const refFields = parser?.getRefFields();
          if (refFields && refFields[key]) {
            propertyCopy = refFields[key].htmlForSelectBox;
            isOptionalRefField = refFields[key].isOptional;
          }
        } else {
          const isNonRefButDropDownFields = parser?.getNonRefButDropdownFields();
          if (isNonRefButDropDownFields && isNonRefButDropDownFields[key]) {
            propertyCopy = isNonRefButDropDownFields[key].htmlForSelectBox;
          }
        }
        return (
          <form.Field
            key={key}
            name={key}
            children={(field) => (
              <FormField
                field={field}
                property={propertyCopy}
                fieldKey={key}
                isOptionalRefField={isOptionalRefField}
                updateFormStack={updateFormStack}
              />
            )}
            validators={{
              onChange: ({ value }) => undefined,
            }}
          />
        );
      });
    } else {
      return null;
    }
  }, [schema, form]);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  useEscapeKeyHandler(cancelButtonRef);

  const notificationOnClick = () => {
    setNotification(null);
  };

  const propertyName = parser?.getPropertyName() || '';
  const isDeploymentProperty = propertyName === 'deployment';

  const flow = parser?.getFlow();
  const isAddUserFlow = flow === Flow.ADD_MODEL;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {isLoading && <LoaderContainer />}
      {notification && <NotificationBox type='error' onClick={notificationOnClick} message={notification} />}

      {isDeploymentProperty && isAddUserFlow && !successResponse && (
        <DeploymentPrerequisites successResponse={successResponse} />
      )}
      {formFields}
      {isDeploymentProperty && isAddUserFlow && successResponse && (
        <DeploymentPrerequisites successResponse={successResponse} />
      )}
      {isDeploymentProperty && !isAddUserFlow && <DeploymentInstructions parser={parser} />}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <>
            {isSubmitting && <LoaderContainer />}
            <div className='col-span-full mt-7'>
              <div className='float-right'>
                <button
                  className='rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                  type='reset'
                  onClick={() => handleCtaAction('cancel')}
                  ref={cancelButtonRef}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  data-testid='form-submit-button'
                  type='submit'
                  className={`ml-3 rounded-md px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    !canSubmit ? 'cursor-not-allowed disabled' : ''
                  }`}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
              {parser?.getFlow() === 'update_model' && (
                <button
                  type='button'
                  className='float-left rounded-md px-3.5 py-2.5 text-sm border bg-airt-error text-airt-font-base hover:bg-opacity-80 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                  disabled={isSubmitting}
                  data-testid='form-cancel-button'
                  onClick={() => handleCtaAction('delete')}
                >
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      />
    </form>
  );
};
