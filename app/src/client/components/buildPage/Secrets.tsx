import CustomBreadcrumb from '../CustomBreadcrumb';

import { SchemaCategory } from '../../interfaces/BuildPageInterfaces';

interface SecretsProps {
  data: SchemaCategory;
}

const Secrets = (data: SecretsProps) => {
  console.log('from secrets.tsx: ', data);
  return (
    <>
      <CustomBreadcrumb pageName='Secrets' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
            <div
              className='flex-col flex items-start justify-between p-6 gap-3 w-full'
              style={{ width: '1000px', height: '600px' }}
            >
              <span className='text-sm font-medium text-airt-primary'>Secrets Page. Some content goes here...</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Secrets;
