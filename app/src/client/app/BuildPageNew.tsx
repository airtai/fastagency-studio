import React, { useEffect, useState, memo } from 'react';
import { useHistory } from 'react-router-dom';
import { type User } from 'wasp/entities';
import { getModels, useQuery } from 'wasp/client/operations';
import _ from 'lodash';

import { cn } from '../../shared/utils';
import { useBuildPageNew } from '../hooks/useBuildPageNew';
import { PropertiesSchema } from '../interfaces/BuildPageInterfacesNew';

import CustomAuthRequiredLayout from './layout/CustomAuthRequiredLayout';
import CustomSidebar, { navLinkItems } from '../components/CustomSidebar';
import LoadingComponent from '../components/LoadingComponent';
import CustomBreadcrumb from '../components/CustomBreadcrumb';
import Button from '../components/Button';
import ModelsList from '../components/ModelsList';

import {
  filerOutComponentData,
  capitalizeFirstLetter,
  filterPropertiesByType,
} from '../components/buildPage/buildPageUtilsNew';

interface BuildPageProps {
  user: User;
}

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className='sticky top-0 z-9 flex w-full bg-airt-hero-gradient-start dark:bg-boxdark dark:drop-shadow-none lg:hidden'>
      <div className='flex flex-grow items-center justify-between sm:justify-end sm:gap-5 px-8 py-5 shadow '>
        <div className='flex items-center gap-2 sm:gap-4 lg:hidden'>
          {/* <!-- Hamburger Toggle BTN --> */}

          <button
            aria-controls='sidebar'
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            className='z-99999 block rounded-sm border border-airt-primary border-airt-hero-gradient-start bg-airt-hero-gradient-start p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden'
          >
            <span className='relative block h-5.5 w-5.5 cursor-pointer'>
              <span className='du-block absolute right-0 h-full w-full'>
                <span
                  className={cn(
                    'relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-airt-primary delay-[0] duration-200 ease-in-out dark:bg-white',
                    {
                      '!w-full delay-300': !sidebarOpen,
                    }
                  )}
                ></span>
                <span
                  className={cn(
                    'relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-airt-primary delay-150 duration-200 ease-in-out dark:bg-white',
                    {
                      'delay-400 !w-full': !sidebarOpen,
                    }
                  )}
                ></span>
                <span
                  className={cn(
                    'relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-airt-primary delay-200 duration-200 ease-in-out dark:bg-white',
                    {
                      '!w-full delay-500': !sidebarOpen,
                    }
                  )}
                ></span>
              </span>
              <span className='absolute right-0 h-full w-full rotate-45'>
                <span
                  className={cn(
                    'absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-airt-primary delay-300 duration-200 ease-in-out dark:bg-white',
                    {
                      '!h-0 !delay-[0]': !sidebarOpen,
                    }
                  )}
                ></span>
                <span
                  className={cn(
                    'delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-airt-primary duration-200 ease-in-out dark:bg-white',
                    {
                      '!h-0 !delay-200': !sidebarOpen,
                    }
                  )}
                ></span>
              </span>
            </span>
          </button>

          {/* <!-- Hamburger Toggle BTN --> */}
        </div>
      </div>
    </header>
  );
};

const BuildPage = ({ user }: BuildPageProps) => {
  const history = useHistory();
  const { data: schema, loading, error } = useBuildPageNew();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const wrapperClass = document.body.classList.contains('server-error')
    ? 'h-[calc(100vh-173px)]'
    : 'h-[calc(100vh-75px)]';

  const handleSideNavItemClick = (selectedComponentName: string) => {
    setActiveProperty(selectedComponentName);
  };

  const setActivePropertyInSessionStorage = (propertyName: string) => {
    sessionStorage.setItem('activeProperty', propertyName);
  };

  useEffect(() => {
    if (schema) {
      const propertyName = sessionStorage.getItem('activeProperty') || schema.list_of_schemas[0].name;
      setActiveProperty(propertyName);
    }
  }, [schema]);

  useEffect(() => {
    if (activeProperty) {
      history.push(`/build-new/${activeProperty}`);
      setActivePropertyInSessionStorage(activeProperty);
    }
  }, [activeProperty]);

  const canRenderProperty = schema && activeProperty;

  return (
    <div className='dark:bg-boxdark-2 dark:text-bodydark bg-captn-light-blue'>
      {loading && <LoadingComponent />}
      {error && (
        <p
          className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-xl text-airt-font-base'
          style={{ lineHeight: 'normal' }}
        >
          Oops! Something went wrong. Our server is currently unavailable. Please try again later.
        </p>
      )}
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      {canRenderProperty && (
        <div className={`flex ${wrapperClass} overflow-hidden`}>
          {/* <!-- ===== Sidebar Start ===== --> */}
          <CustomSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            onSideNavItemClick={handleSideNavItemClick}
            activeProperty={activeProperty}
          />
          {/* <!-- ===== Sidebar End ===== --> */}
          {/* <!-- ===== Content Area Start ===== --> */}
          <div className='relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden'>
            {/* <!-- ===== Mobile Header For Sidenav Start ===== --> */}
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            {/* <!-- ===== Mobile Header For Sidenav End ===== --> */}

            {/* <!-- ===== Main Content Start ===== --> */}
            <main className='lg:mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'>
              <div className='w-full lg:min-w-[700px] 2xl:min-w-[1200px]'>
                <UserProperty activeProperty={activeProperty} schema={schema} />
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

const BuildPageNewWithCustomAuth = CustomAuthRequiredLayout(BuildPage);
export default BuildPageNewWithCustomAuth;

interface Props {
  activeProperty: string;
  schema: PropertiesSchema;
}

export const UserProperty = memo(({ activeProperty, schema }: Props) => {
  const propertyHeader = _.find(navLinkItems, ['componentName', activeProperty])?.label;
  const propertyName = activeProperty === 'llm' ? 'LLM' : capitalizeFirstLetter(activeProperty);
  const Property = filerOutComponentData(schema, activeProperty);
  console.log('Property', JSON.stringify(Property));
  // the Property contains schemas and name
  // pass the schemas and generate the HTML for the selected model
  // initially the selected model is the first item in the list
  // on dropdown change, update the selected model
  // so this component sould have the state for selected model

  // based on the Property and the selected model, parse and generate the HTML

  const { data: userOwnedProperties, refetch: refetchModels, isLoading: isLoading } = useQuery(getModels);
  const userOwnedPropertiesByType =
    (userOwnedProperties && filterPropertiesByType(userOwnedProperties, activeProperty)) || [];
  return (
    <>
      <CustomBreadcrumb pageName={`${propertyHeader}`} />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            {isLoading && <LoadingComponent theme='dark' />}
            {userOwnedPropertiesByType.length > 0 && (
              <div className='flex-col flex items-start p-6 gap-3 w-full'>
                <>
                  <div className={`${false ? 'hidden' : ''} flex justify-end w-full px-1 py-3`}>
                    <Button onClick={() => {}} label={`Add ${propertyName}`} />
                  </div>
                  <div className='flex-col flex w-full'>
                    <ModelsList models={userOwnedPropertiesByType} onSelectModel={() => {}} type_name={propertyName} />
                  </div>
                </>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

// export const DynamicForm = memo(({ activeProperty, schema }: Props) => {

// });
