import React, { useState } from 'react';
import _ from 'lodash';

import Button from '../Button';
import ModelForm from '../ModelForm';
import ModelsList from '../ModelsList';
import NotificationBox from '../NotificationBox';

import { SelectedModelSchema } from '../../interfaces/BuildPageInterfaces';
import { PropertyTypesComponentProps } from '../../interfaces/BuildPageInterfaces';

import {
  getModels,
  useQuery,
  updateUserModels,
  addUserModels,
  deleteUserModels,
  propertyDependencies,
} from 'wasp/client/operations';
import { propertyDependencyMap } from '../../utils/constants';
import { isDependencyAvailable, formatDependencyErrorMessage } from '../../utils/buildPageUtils';

const UserPropertyHandler = ({ allSchema, propertySchema }: PropertyTypesComponentProps) => {
  const propertyName = propertySchema.name;
  const defaultSchemaName = propertySchema.schemas[0].name;
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState(defaultSchemaName);
  const [updateExistingModel, setUpdateExistingModel] = useState<SelectedModelSchema | null>(null);
  const {
    data: modelsList,
    refetch: refetchModels,
    isLoading: getModelsIsLoading,
  } = useQuery(getModels, { property_type: propertyName });

  const { data: propertyDependency } = useQuery(propertyDependencies, {
    properties: _.get(propertyDependencyMap, propertyName),
  });

  const [showNotification, setShowNotification] = useState(false);

  const handleClick = () => {
    if (isDependencyAvailable(propertyDependency)) {
      setSelectedModel(defaultSchemaName);
      setShowAddModel(true);
    } else {
      setShowNotification(true);
    }
  };
  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  const onSuccessCallback = async (payload: any) => {
    const mergedData = { ...payload, property_type: propertyName, property_name: selectedModel };
    if (updateExistingModel) {
      await updateUserModels({ data: mergedData, uuid: updateExistingModel.uuid });
      setUpdateExistingModel(null);
    } else {
      await addUserModels(mergedData);
    }
    refetchModels();
    setShowAddModel(false);
  };

  const onCancelCallback = () => {
    setShowAddModel(false);
  };

  const onDeleteCallback = async () => {
    if (updateExistingModel) {
      await deleteUserModels({ uuid: updateExistingModel.uuid, property_type: updateExistingModel.property_type });
      await refetchModels();
      setUpdateExistingModel(null);
      setShowAddModel(false);
    }
  };

  const updateSelectedModel = (index: number) => {
    if (modelsList) {
      const selectedModel = modelsList[index];
      setSelectedModel(selectedModel.property_name);
      setUpdateExistingModel(selectedModel);
      setShowAddModel(true);
    }
  };

  const onClick = () => {
    setShowNotification(false);
  };

  const dependentProperties = formatDependencyErrorMessage(_.get(propertyDependencyMap, propertyName));
  const dependencyErrorMessage = `To create ${
    propertyName === 'agent' ? 'an' : 'a'
  } ${propertyName}, first add at least one ${dependentProperties}.`;

  return (
    <div className='flex-col flex items-start p-6 gap-3 w-full'>
      <div className={`${showAddModel ? 'hidden' : ''} flex justify-end w-full px-1 py-3`}>
        <Button onClick={handleClick} label={`Add ${propertyName}`} />
      </div>
      <div className='flex-col flex w-full'>
        {!showAddModel ? (
          <ModelsList models={modelsList} onSelectModel={updateSelectedModel} property_type={propertyName} />
        ) : (
          <ModelForm
            data={propertySchema}
            selectedModel={selectedModel}
            updateExistingModel={updateExistingModel}
            onModelChange={handleModelChange}
            onSuccessCallback={onSuccessCallback}
            onCancelCallback={onCancelCallback}
            onDeleteCallback={onDeleteCallback}
          />
        )}
      </div>
      {showNotification && <NotificationBox type='error' onClick={onClick} message={dependencyErrorMessage} />}
    </div>
  );
};

export default UserPropertyHandler;
