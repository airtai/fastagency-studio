import CustomBreadcrumb from '../CustomBreadcrumb';
const ToolBoxes = () => {
  return (
    <>
      <CustomBreadcrumb pageName='ToolBoxes' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
            <div
              className='flex-col flex items-start justify-between p-6 gap-3 w-full'
              style={{ width: '1000px', height: '600px' }}
            >
              <span className='text-sm font-medium text-airt-primary'>Coming soon...</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ToolBoxes;
