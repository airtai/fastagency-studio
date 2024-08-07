import React, { useEffect, useState, memo } from 'react';

import _ from 'lodash';
import { getModels, useQuery } from 'wasp/client/operations';

import CustomBreadcrumb from '../CustomBreadcrumb';
import Button from '../Button';
import ModelsList from '../ModelsList';
import { DynamicForm } from '../buildPage/DynamicForm';
import { ModelSelector } from '../buildPage/ModelSelector';
import { navLinkItems } from '../CustomSidebar';
import { PropertiesSchema } from '../../interfaces/BuildPageInterfacesNew';
import LoadingComponent from '../LoadingComponent';

import { filerOutComponentData, capitalizeFirstLetter, filterPropertiesByType } from '../buildPage/buildPageUtilsNew';

interface Props {
  activeProperty: string;
  propertiesSchema: PropertiesSchema;
  sideNavItemClickCount: number;
}

export const UserProperty = memo(({ activeProperty, propertiesSchema, sideNavItemClickCount }: Props) => {
  const [addOrUpdateModel, setAddOrUpdateModel] = useState<any>(null);
  const propertyHeader = _.find(navLinkItems, ['componentName', activeProperty])?.label;
  const propertyName = activeProperty === 'llm' ? 'LLM' : capitalizeFirstLetter(activeProperty);
  const propertySchemasList = filerOutComponentData(propertiesSchema, activeProperty);

  const { data: userOwnedProperties, refetch: refetchModels, isLoading: isLoading } = useQuery(getModels);
  const userOwnedPropertiesByType =
    (userOwnedProperties && filterPropertiesByType(userOwnedProperties, activeProperty)) || [];

  const addProperty = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setAddOrUpdateModel(propertySchemasList.schemas[0].name);
  };

  useEffect(() => {
    setAddOrUpdateModel(null);
  }, [sideNavItemClickCount]);
  return (
    <>
      <CustomBreadcrumb pageName={`${propertyHeader}`} />
      <div className='flex flex-col gap-10'>
        <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
          {isLoading ? (
            <LoadingComponent theme='dark' />
          ) : (
            <div className='flex-col flex items-start p-6 gap-3 w-full'>
              {!addOrUpdateModel ? (
                <>
                  <div className={`${false ? 'hidden' : ''} flex justify-end w-full px-1 py-3`}>
                    <Button onClick={addProperty} label={`Add ${propertyName}`} />
                  </div>
                  {userOwnedPropertiesByType.length === 0 && (
                    <div className='flex flex-col gap-3'>
                      {/* <h2 className='text-lg font-semibold text-airt-primary'>Available Models</h2> */}
                      <p className='text-airt-primary mt-1 -mt-3 opacity-50'>{`No ${propertyHeader} found. Please add one.`}</p>
                    </div>
                  )}
                  {userOwnedPropertiesByType.length > 0 && (
                    <div className='flex-col flex w-full'>
                      <ModelsList
                        models={userOwnedPropertiesByType}
                        onSelectModel={() => {}}
                        type_name={propertyName}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className='flex flex-col w-full gap-9'>
                  <div className='flex flex-col gap-5.5 px-6.5'>
                    <h2 className='text-lg font-semibold text-airt-primary mt-6 '>{`Add a new ${propertyName}`}</h2>
                    <div className='relative z-20 bg-white dark:bg-form-input'>
                      <ModelSelector
                        propertySchemasList={propertySchemasList}
                        propertyName={propertyName}
                        setAddOrUpdateModel={setAddOrUpdateModel}
                      />
                      <DynamicForm propertySchemasList={propertySchemasList} addOrUpdateModel={addOrUpdateModel} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
