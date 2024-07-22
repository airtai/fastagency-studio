import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';

import Button from '../Button';
import ModelForm from '../ModelForm';
import ModelsList from '../ModelsList';
import NotificationBox from '../NotificationBox';

import { SelectedModelSchema } from '../../interfaces/BuildPageInterfaces';
import { navLinkItems } from '../CustomSidebar';

import { getModels, useQuery, updateUserModels, addUserModels, deleteUserModels } from 'wasp/client/operations';
import { capitalizeFirstLetter, filterDataToValidate, dependsOnProperty } from '../../utils/buildPageUtils';
import Loader from '../../admin/common/Loader';
import CustomBreadcrumb from '../CustomBreadcrumb';
import { useHistory } from 'react-router-dom';
import { FormData } from '../../hooks/useForm';

const FORM_DATA_STORAGE_KEY = 'formDataStack';

interface Props {
  data: any;
  togglePropertyList: boolean;
}

interface SourceTarget {
  propertyName: string;
  selectedModel: string;
}

interface FormDataObj {
  [key: string]: any;
}

interface FormDataStackItem {
  source: SourceTarget;
  target: SourceTarget;
  formData: FormDataObj;
  key: string;
}

export const getTargetModel = (schemas: any, selectedModel: string, key: string) => {
  const matchedModel = _.find(schemas, ['name', selectedModel]);
  let retVal = null;
  if (!matchedModel) {
    return retVal;
  }
  const matchedModeRef = matchedModel.json_schema.properties[key];
  if (_.has(matchedModeRef, '$ref')) {
    // remove "Ref" word from the end of the string
    const refValue = matchedModeRef['$ref'].split('/').pop();
    retVal = refValue.replace(/Ref$/, '');
  }
  return retVal;
};

export const storeFormData = (
  propertyName: string,
  selectedModel: string,
  targetPropertyName: string,
  targetModel: string,
  formData: FormData,
  key: string
) => {
  const newStackItem: FormDataStackItem = {
    source: {
      propertyName: propertyName,
      selectedModel: selectedModel,
    },
    target: {
      propertyName: targetPropertyName,
      selectedModel: targetModel,
    },
    formData: formData,
    key: key,
  };

  let formDataStack: FormDataStackItem[] = JSON.parse(localStorage.getItem(FORM_DATA_STORAGE_KEY) || '[]');
  formDataStack.push(newStackItem);
  localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formDataStack));
};

const UserPropertyHandler = ({ data, togglePropertyList }: Props) => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState(data.schemas[0].name);
  const [updateExistingModel, setUpdateExistingModel] = useState<SelectedModelSchema | null>(null);
  const propertyName = data.name;
  const { data: allUserProperties, refetch: refetchModels, isLoading: getModelsIsLoading } = useQuery(getModels);
  const targetModelToAdd = useRef<string | null>(null);

  const [notificationErrorMessage, setNotificationErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    setShowAddModel(false);
  }, [togglePropertyList]);

  useEffect(() => {
    if (data && data.schemas && data.schemas[0].name) {
      const targetModel = targetModelToAdd.current || data.schemas[0].name;
      setSelectedModel(targetModel);
    }
  }, [data]);

  const updateModel = (model_type: string) => {
    setSelectedModel(model_type);
    setShowAddModel(true);
  };

  const handleClick = () => {
    setUpdateExistingModel(null);
    updateModel(data.schemas[0].name);
  };
  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  const handleFormResume = (filteredData: any) => {
    let formDataStack: FormDataStackItem[] = JSON.parse(localStorage.getItem(FORM_DATA_STORAGE_KEY) || '[]');
    if (formDataStack.length > 0) {
      let currentItem = formDataStack[formDataStack.length - 1];
      const key: string = currentItem.key;
      currentItem.formData[key] = {
        name: currentItem.target.selectedModel,
        type: currentItem.target.propertyName,
        uuid: filteredData.uuid,
      };
      setShowAddModel(true);
      // @ts-ignore
      setUpdateExistingModel(currentItem.formData);
      targetModelToAdd.current = currentItem.source.selectedModel;

      // Remove the completed item from the stack
      formDataStack.pop();
      localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formDataStack));

      // Check if there are more levels to process
      if (formDataStack.length > 0) {
        const nextItem = formDataStack[formDataStack.length - 1];
        history.push(`/build/${nextItem.target.propertyName}`);
      } else {
        // If the stack is empty, we've completed all levels
        history.push(`/build/${currentItem.source.propertyName}`);
      }
    }
  };

  const onSuccessCallback = async (payload: any): Promise<{ addUserModelResponse: any }> => {
    let addUserModelResponse;
    try {
      setIsLoading(true);
      const mergedData = { ...payload, type_name: propertyName, model_name: selectedModel, uuid: payload.uuid };
      const filteredData = filterDataToValidate(mergedData);
      if (updateExistingModel && !targetModelToAdd.current) {
        await updateUserModels({ data: filteredData, uuid: updateExistingModel.uuid });
        setUpdateExistingModel(null);
      } else {
        //@ts-ignore
        addUserModelResponse = await addUserModels(filteredData);
        if (targetModelToAdd.current) {
          targetModelToAdd.current = null;
        }
      }
      refetchModels();
      const isNewDeploymentAdded = propertyName === 'deployment' && !updateExistingModel;
      !isNewDeploymentAdded && setShowAddModel(false);

      handleFormResume(filteredData);
    } catch (error) {
      console.log('error: ', error, 'error.message: ');
      // setNotificationErrorMessage(`Error adding/updating ${propertyName}. Please try again later.`);
      throw error;
    } finally {
      setIsLoading(false);
    }

    return addUserModelResponse;
  };

  const onCancelCallback = (event: React.FormEvent) => {
    event.preventDefault();
    setShowAddModel(false);
  };

  const onDeleteCallback = async () => {
    try {
      setIsLoading(true);
      if (updateExistingModel) {
        if (allUserProperties) {
          const propertyName = dependsOnProperty(allUserProperties, updateExistingModel.uuid);
          if (propertyName !== '') {
            const currentPropertyName = _.has(updateExistingModel, 'name') ? updateExistingModel.name : '';
            setNotificationErrorMessage(
              `Oops! You can't delete '${currentPropertyName}' because it's being used by '${propertyName}'.`
            );
          } else {
            await deleteUserModels({ uuid: updateExistingModel.uuid, type_name: updateExistingModel.type_name });
            await refetchModels();
            setUpdateExistingModel(null);
            setShowAddModel(false);
          }
        }
      }
    } catch (error) {
      setNotificationErrorMessage(`Error deleting ${propertyName}. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredProperties = () => {
    if (allUserProperties) {
      const properties = _.filter(allUserProperties, ['type_name', propertyName]);
      return _.sortBy(properties, ['created_at']);
    }
  };

  const updateSelectedModel = (index: number) => {
    if (allUserProperties) {
      const filteredProperties = getFilteredProperties();
      if (filteredProperties) {
        const selectedModel = filteredProperties[index];
        setSelectedModel(selectedModel.model_name);
        // @ts-ignore
        setUpdateExistingModel({ ...selectedModel.json_str, ...{ uuid: selectedModel.uuid } });
        setShowAddModel(true);
      }
    }
  };

  const onClick = () => {
    setNotificationErrorMessage(null);
  };

  const handleAddProperty = (targetPropertyName: string, formData: FormData, key: string) => {
    const targetModel = getTargetModel(data.schemas, selectedModel, key);
    storeFormData(propertyName, selectedModel, targetPropertyName, targetModel, formData, key);

    // setShowAddModel(false);
    setShowAddModel(true);
    setUpdateExistingModel(null);
    targetModelToAdd.current = targetModel;

    history.push(`/build/${targetPropertyName}`);
  };

  const propertyHeader = propertyName === 'llm' ? 'LLM' : capitalizeFirstLetter(propertyName);
  const propertyDisplayName = propertyName ? _.find(navLinkItems, ['componentName', propertyName])?.label : '';

  return (
    <>
      <CustomBreadcrumb pageName={`${propertyDisplayName}`} />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            <div className='flex-col flex items-start p-6 gap-3 w-full'>
              <div className={`${showAddModel ? 'hidden' : ''} flex justify-end w-full px-1 py-3`}>
                <Button onClick={handleClick} label={`Add ${propertyHeader}`} />
              </div>
              <div className='flex-col flex w-full'>
                {!showAddModel ? (
                  <ModelsList
                    models={(allUserProperties && getFilteredProperties()) || []}
                    onSelectModel={updateSelectedModel}
                    type_name={propertyName}
                  />
                ) : (
                  <ModelForm
                    allUserProperties={allUserProperties}
                    data={data}
                    selectedModel={selectedModel}
                    updateExistingModel={updateExistingModel}
                    propertyHeader={propertyHeader}
                    onModelChange={handleModelChange}
                    onSuccessCallback={onSuccessCallback}
                    onCancelCallback={onCancelCallback}
                    onDeleteCallback={onDeleteCallback}
                    handleAddProperty={handleAddProperty}
                  />
                )}
              </div>
              {notificationErrorMessage && (
                <NotificationBox type='error' onClick={onClick} message={notificationErrorMessage} />
              )}
              {isLoading && (
                <div className='z-[999999] absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 h-screen'>
                  <Loader />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserPropertyHandler;
