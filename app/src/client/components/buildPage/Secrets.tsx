import React, { useEffect, useState } from 'react';
import CustomBreadcrumb from '../CustomBreadcrumb';

import { useModels, ModelsActionType } from '../../hooks/useModels';
import { SchemaCategory } from '../../interfaces/BuildPageInterfaces';
import Button from '../Button';
import ModelForm from '../ModelForm';
import { capitalizeFirstLetter } from '../../utils/buildPageUtils';
import ModelsList from '../ModelsList';

import { getModels, useQuery, updateUserModels, addUserModels, deleteUserModels } from 'wasp/client/operations';

interface SecretsProps {
  data: SchemaCategory;
}

const Secrets = ({ data }: SecretsProps) => {
  // const { state, dispatch, fetchData } = useModels();
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState(data.schemas[0].name);
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
    // const foundSchema = state.modelSchemas?.schemas.find((schema) => schema.name === newModel);
    // if (foundSchema) {
    //   dispatch({
    //     type: ModelsActionType.SELECT_MODEL,
    //     payload: { json_schema: foundSchema.json_schema, name: foundSchema.name },
    //   });
    // }
  };

  const onSuccessCallback = async (payload: any) => {
    const mergedData = { ...payload, property_type: data.name, property_name: selectedModel };
    await addUserModels(mergedData);
    refetchModels();
    setShowAddModel(false);
  };

  const onCancelCallback = () => {
    setShowAddModel(false);
  };

  const updateSelectedModel = (index: number) => {
    console.log('Selected model: ', index);
  };

  console.log('modelsList: ', modelsList);
  return (
    <>
      <CustomBreadcrumb pageName='Secrets' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            <div className='flex-col flex items-start p-6 gap-3 w-full'>
              <div className={`${showAddModel ? 'hidden' : ''} flex justify-end w-full px-6.5 py-3`}>
                <Button onClick={handleClick} label={`Add ${capitalizeFirstLetter(data.name)}`} />
              </div>
              <div className='flex-col flex w-full'>
                {!showAddModel ? (
                  <ModelsList models={modelsList} onSelectModel={updateSelectedModel} />
                ) : (
                  <ModelForm
                    modelSchemas={data.schemas}
                    initialModelSchema={data.schemas[0].json_schema}
                    selectedModel={selectedModel}
                    validationURL={`models/${data.name}/${selectedModel}/validate`}
                    // updateExistingModel={updateExistingModel}
                    onModelChange={handleModelChange}
                    onSuccessCallback={onSuccessCallback}
                    onCancelCallback={onCancelCallback}
                    // onDeleteCallback={onDeleteCallback}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Secrets;
