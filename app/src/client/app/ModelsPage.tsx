import React from 'react';

import { getModels, useQuery, updateUserModels, addUserModels, deleteUserModels } from 'wasp/client/operations';

import { useModels, ModelsActionType } from '../hooks/useModels';
import CustomLayout from './layout/CustomLayout';
import CustomBreadcrumb from '../components/CustomBreadcrumb';
import Loader from '../admin/common/Loader';
import NotificationBox from '../components/NotificationBox';
import ModelsList from '../components/ModelsList';
import ModelForm from '../components/ModelForm';
import Button from '../components/Button';

const ModelsPage = () => {
  const { state, dispatch, fetchData } = useModels();
  const { data: modelsList, refetch: refetchModels, isLoading: getModelsIsLoading } = useQuery(getModels);

  const handleModelChange = (newModel: string) => {
    const foundSchema = state.modelSchemas?.schemas.find((schema) => schema.name === newModel);
    if (foundSchema) {
      dispatch({
        type: ModelsActionType.SELECT_MODEL,
        payload: { json_schema: foundSchema.json_schema, name: foundSchema.name },
      });
    }
  };

  const onSuccessCallback = async (data: any) => {
    state.updateExistingModel
      ? await updateUserModels({ data, uuid: state.updateExistingModel.uuid })
      : await addUserModels({ data });

    refetchModels();
    dispatch({ type: ModelsActionType.TOGGLE_ADD_MODEL, payload: false });
  };

  const onCancelCallback = () => {
    dispatch({ type: ModelsActionType.TOGGLE_ADD_MODEL, payload: false });
  };

  const onDeleteCallback = async () => {
    dispatch({ type: ModelsActionType.TOGGLE_LOADING, payload: true });
    state.updateExistingModel && (await deleteUserModels({ uuid: state.updateExistingModel.uuid }));
    await refetchModels();
    dispatch({ type: ModelsActionType.TOGGLE_ADD_MODEL, payload: false });
    dispatch({ type: ModelsActionType.TOGGLE_LOADING, payload: false });
  };

  const updateSelectedModel = (index: number) => {
    if (modelsList) {
      const selectedModel = modelsList[index];
      const selectedModelSchemaName = selectedModel.api_type === 'openai' ? 'openai' : 'azureoai';
      const foundSchema = state.modelSchemas?.schemas.find(
        (schema) => schema.name.toLowerCase() === selectedModelSchemaName
      );
      if (foundSchema) {
        dispatch({ type: ModelsActionType.UPDATE_EXISTING_MODEL, payload: selectedModel });
        dispatch({
          type: ModelsActionType.SELECT_MODEL,
          payload: { json_schema: foundSchema.json_schema, name: foundSchema.name },
        });
      }
    }
  };

  return (
    <CustomLayout>
      <CustomBreadcrumb pageName='Models' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            <div className='flex-col flex items-start p-6 gap-3 w-full'>
              <div className={`${state.showAddModel ? 'hidden' : ''} flex justify-end w-full px-6.5 py-3`}>
                <Button
                  onClick={async () => {
                    state.updateExistingModel &&
                      dispatch({ type: ModelsActionType.UPDATE_EXISTING_MODEL, payload: null });
                    dispatch({ type: ModelsActionType.TOGGLE_LOADING, payload: true });
                    await fetchData();
                    dispatch({ type: ModelsActionType.TOGGLE_ADD_MODEL, payload: true });
                    dispatch({ type: ModelsActionType.TOGGLE_LOADING, payload: false });
                  }}
                  label='Add Model'
                />
              </div>
              <div className='flex-col flex w-full'>
                {state.isLoading || getModelsIsLoading ? (
                  <LoaderComponent />
                ) : (
                  <>
                    {!state.showAddModel ? (
                      <ModelsList models={modelsList} onSelectModel={updateSelectedModel} />
                    ) : (
                      <>
                        {state.initialModelSchema && state.modelSchemas && (
                          <ModelForm
                            modelSchemas={state.modelSchemas}
                            initialModelSchema={state.initialModelSchema}
                            selectedModel={state.selectedModel}
                            updateExistingModel={state.updateExistingModel}
                            onModelChange={handleModelChange}
                            onSuccessCallback={onSuccessCallback}
                            onCancelCallback={onCancelCallback}
                            onDeleteCallback={onDeleteCallback}
                          />
                        )}
                      </>
                    )}
                    {state.error && (
                      <ErrorNotification
                        message={state.error}
                        clearError={() => dispatch({ type: ModelsActionType.SET_ERROR, payload: null })}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomLayout>
  );
};

export default ModelsPage;

const LoaderComponent: React.FC = () => (
  <div className='absolute inset-0 flex items-center justify-center bg-white bg-opacity-50'>
    <Loader />
  </div>
);

interface ErrorNotificationProps {
  message: string;
  clearError: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, clearError }) => (
  <NotificationBox type='error' onClick={clearError} message={message} />
);
