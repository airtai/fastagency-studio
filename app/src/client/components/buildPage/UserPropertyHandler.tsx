import React, { useState } from 'react';
import _ from 'lodash';

import Button from '../Button';
import ModelForm from '../ModelForm';
import ModelsList from '../ModelsList';
import NotificationBox from '../NotificationBox';

import { SelectedModelSchema } from '../../interfaces/BuildPageInterfaces';
import { SecretsProps } from '../../interfaces/BuildPageInterfaces';

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

const UserPropertyHandler = ({ data }: SecretsProps) => {
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState(data.schemas[0].name);
  const [updateExistingModel, setUpdateExistingModel] = useState<SelectedModelSchema | null>(null);
  const propertyName = data.name;
  const { data: allUserProperties, refetch: refetchModels, isLoading: getModelsIsLoading } = useQuery(getModels);
  console.log('allUserProperties', allUserProperties);

  const { data: propertyDependency } = useQuery(propertyDependencies, {
    properties: _.get(propertyDependencyMap, propertyName),
  });

  const [showNotification, setShowNotification] = useState(false);

  const handleClick = () => {
    if (isDependencyAvailable(propertyDependency)) {
      setSelectedModel(data.schemas[0].name);
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
    if (allUserProperties?.[propertyName]) {
      const selectedModel = allUserProperties[propertyName][index];
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
          <ModelsList
            models={allUserProperties?.[propertyName] || []}
            onSelectModel={updateSelectedModel}
            property_type={propertyName}
          />
        ) : (
          <ModelForm
            data={data}
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
