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
    const mergedData = { ...payload, type_name: propertyName, model_name: selectedModel, uuid: payload.uuid };
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
      await deleteUserModels({ uuid: updateExistingModel.uuid, type_name: updateExistingModel.type_name });
      await refetchModels();
      setUpdateExistingModel(null);
      setShowAddModel(false);
    }
  };

  const getFilteredProperties = () => {
    if (allUserProperties) {
      return _.filter(allUserProperties, ['type_name', propertyName]);
    }
  };

  const updateSelectedModel = (index: number) => {
    if (allUserProperties) {
      const filteredProperties = getFilteredProperties();
      if (filteredProperties) {
        const selectedModel = filteredProperties[index];
        setSelectedModel(selectedModel.model_name);
        setUpdateExistingModel({ ...selectedModel.model, ...{ uuid: selectedModel.uuid } });
        setShowAddModel(true);
      }
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
