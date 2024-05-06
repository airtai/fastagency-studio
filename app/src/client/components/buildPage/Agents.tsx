import React from 'react';
import CustomBreadcrumb from '../CustomBreadcrumb';
import UserPropertyHandler from './UserPropertyHandler';
import { SecretsProps } from '../../interfaces/BuildPageInterfaces';

const Agents = ({ data }: SecretsProps) => {
  return (
    <>
      <CustomBreadcrumb pageName='Agents' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            <UserPropertyHandler data={data} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Agents;