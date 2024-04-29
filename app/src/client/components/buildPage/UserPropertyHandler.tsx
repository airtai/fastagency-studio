import React, { useState } from 'react';

import Button from '../Button';
import ModelForm from '../ModelForm';
import ModelsList from '../ModelsList';

import { SelectedModelSchema } from '../../interfaces/BuildPageInterfaces';
import { SecretsProps } from '../../interfaces/BuildPageInterfaces';

import { getModels, useQuery, updateUserModels, addUserModels, deleteUserModels } from 'wasp/client/operations';

const UserPropertyHandler = ({ data }: SecretsProps) => {
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState(data.schemas[0].name);
  const [updateExistingModel, setUpdateExistingModel] = useState<SelectedModelSchema | null>(null);
  const {
    data: modelsList,
    refetch: refetchModels,
    isLoading: getModelsIsLoading,
  } = useQuery(getModels, { property_type: data.name });

  const handleClick = () => {
    setShowAddModel(true);
  };
  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  const onSuccessCallback = async (payload: any) => {
    const mergedData = { ...payload, property_type: data.name, property_name: selectedModel };
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

  return (
    <div className='flex-col flex items-start p-6 gap-3 w-full'>
      <div className={`${showAddModel ? 'hidden' : ''} flex justify-end w-full px-1 py-3`}>
        <Button onClick={handleClick} label={`Add ${data.name}`} />
      </div>
      <div className='flex-col flex w-full'>
        {!showAddModel ? (
          <ModelsList models={modelsList} onSelectModel={updateSelectedModel} property_type={data.name} />
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
    </div>
  );
};

export default UserPropertyHandler;
