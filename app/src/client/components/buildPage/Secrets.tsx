import React from 'react';
import CustomBreadcrumb from '../CustomBreadcrumb';
import UserPropertyHandler from './UserPropertyHandler';
import { PropertyTypesComponentProps } from '../../interfaces/BuildPageInterfaces';

const Secrets = ({ allSchema, propertySchema }: PropertyTypesComponentProps) => {
  return (
    <>
      <CustomBreadcrumb pageName='Secrets' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            <UserPropertyHandler allSchema={allSchema} propertySchema={propertySchema} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Secrets;
