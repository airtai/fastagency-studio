import React, { useEffect, useState, memo } from 'react';
import { useHistory } from 'react-router-dom';
import { type User } from 'wasp/entities';
import { getModels, useQuery } from 'wasp/client/operations';
import _ from 'lodash';
import Select, { StylesConfig, SingleValue } from 'react-select';
import type { FieldApi, FormApi } from '@tanstack/react-form';
import { useForm } from '@tanstack/react-form';

import { validateForm } from 'wasp/client/operations';
import { cn } from '../../shared/utils';
import { useBuildPageNew } from '../hooks/useBuildPageNew';
import { PropertiesSchema, ListOfSchemas, Schema } from '../interfaces/BuildPageInterfacesNew';

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
import { SelectInput } from '../components/form/SelectInput';
import { PropertySchemaParser } from '../components/buildPage/PropertySchemaParser';
import { TextInput } from '../components/form/TextInput';
import { SECRETS_TO_MASK } from '../utils/constants';
import { fi } from '@faker-js/faker';

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
  const { data: propertiesSchema, loading, error } = useBuildPageNew();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [sideNavItemClickCount, setSideNavItemClickCount] = useState(0);
  const wrapperClass = document.body.classList.contains('server-error')
    ? 'h-[calc(100vh-173px)]'
    : 'h-[calc(100vh-75px)]';

  const handleSideNavItemClick = (selectedComponentName: string) => {
    setActiveProperty(selectedComponentName);
    setSideNavItemClickCount(sideNavItemClickCount + 1);
  };

  const setActivePropertyInSessionStorage = (propertyName: string) => {
    sessionStorage.setItem('activeProperty', propertyName);
  };

  useEffect(() => {
    if (propertiesSchema) {
      const propertyName = sessionStorage.getItem('activeProperty') || propertiesSchema.list_of_schemas[0].name;
      setActiveProperty(propertyName);
    }
  }, [propertiesSchema]);

  useEffect(() => {
    if (activeProperty) {
      history.push(`/build-new/${activeProperty}`);
      setActivePropertyInSessionStorage(activeProperty);
    }
  }, [activeProperty]);

  const canRenderProperty = propertiesSchema && activeProperty;

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
                <UserProperty
                  activeProperty={activeProperty}
                  propertiesSchema={propertiesSchema}
                  sideNavItemClickCount={sideNavItemClickCount}
                />
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
  propertiesSchema: PropertiesSchema;
  sideNavItemClickCount: number;
}

export const UserProperty = memo(({ activeProperty, propertiesSchema, sideNavItemClickCount }: Props) => {
  const [addOrUpdateModel, setAddOrUpdateModel] = useState<any>(null);
  const propertyHeader = _.find(navLinkItems, ['componentName', activeProperty])?.label;
  const propertyName = activeProperty === 'llm' ? 'LLM' : capitalizeFirstLetter(activeProperty);
  const propertySchemasList = filerOutComponentData(propertiesSchema, activeProperty);
  // the Property contains schemas and name
  // pass the schemas and generate the HTML for the selected model
  // initially the selected model is the first item in the list
  // on dropdown change, update the selected model
  // so this component sould have the state for selected model

  // based on the Property and the selected model, parse and generate the HTML

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

interface SelectOption {
  value: string;
  label: string;
}

export const ModelSelector = ({
  propertySchemasList,
  propertyName,
  setAddOrUpdateModel,
}: {
  propertySchemasList: ListOfSchemas;
  propertyName: string | undefined;
  setAddOrUpdateModel: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const selectOptions = propertySchemasList.schemas.map((schema) => {
    return {
      value: schema.name,
      label: schema.name,
    };
  });
  const customStyles: StylesConfig<SelectOption, false> = {
    control: (baseStyles) => ({
      ...baseStyles,
      borderColor: '#003257',
    }),
  };

  const handleChange = (selectedOption: SingleValue<SelectOption>) => {
    if (selectedOption) {
      setAddOrUpdateModel(selectedOption.value);
    }
  };

  return (
    <>
      <label className='mb-3 block text-black dark:text-white'>{`Select  ${propertyName}`}</label>
      <div className='relative z-20 bg-white dark:bg-form-input'>
        <Select
          data-testid='select-model-type'
          classNamePrefix='react-select-model-type'
          options={selectOptions}
          onChange={handleChange}
          className='pt-1 pb-1'
          defaultValue={selectOptions[0]}
          isSearchable={true}
          isClearable={false}
          styles={customStyles}
        />
      </div>
    </>
  );
};

/* Dynamic form starts*/
const getDefaultValues = (schema: Schema | {}) => {
  const defaultValues: { [key: string]: any } = {};

  if ('json_schema' in schema) {
    Object.entries(schema.json_schema.properties).forEach(([key, property]: [string, any]) => {
      defaultValues[key] = property.default || '';
    });
  }
  return defaultValues;
};

type ValidationError = {
  type: string;
  loc: string[];
  msg: string;
  input: any;
  url: string;
  ctx?: any;
};

type ErrorOutput = { [key: string]: string };

export function parseValidationErrors(errors: ValidationError[]): ErrorOutput {
  const result: ErrorOutput = {};
  errors.forEach((error) => {
    const key = error.loc[error.loc.length - 1]; // Using the last item in 'loc' array as the key
    result[key] = error.msg;
  });
  return result;
}

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <em>{field.state.meta.errors.join(',')}</em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
}

export const DynamicForm = ({
  propertySchemasList,
  addOrUpdateModel,
}: {
  propertySchemasList: ListOfSchemas;
  addOrUpdateModel: string;
}) => {
  const [defaultValues, setDefaultValues] = useState<{ [key: string]: any }>({});
  // initiate the PropertySchemaParser with the propertySchemasList
  const propertySchemaParser = new PropertySchemaParser(propertySchemasList);

  // get the schema for the selected model
  const schema = propertySchemaParser.getSchemaForModel(addOrUpdateModel);

  console.log('defaultValues', defaultValues);

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value, formApi }) => {
      try {
        const validationURL: string = `models/${propertySchemasList.name}/${addOrUpdateModel}/validate`;
        const isSecretUpdate = false;
        const data = value;
        const response = await validateForm({ data, validationURL, isSecretUpdate });
        console.log('No errors. can submit the form');
        // form can be added to the database here
      } catch (error: any) {
        try {
          const errorMsgObj = JSON.parse(error.message);
          const errors = parseValidationErrors(errorMsgObj);
          Object.entries(errors).forEach(([key, value]) => {
            formApi.setFieldMeta(key, (meta) => ({
              ...meta,
              errorMap: { onChange: value },
            }));
          });
        } catch (e: any) {
          // set form level error. something went wrong. Please try again later. Unable to submit the form
          console.log(e);
        }
      }
    },
  });

  useEffect(() => {
    form.reset();
    setDefaultValues(getDefaultValues(schema));
  }, [schema]);

  const generateHTML = (schema: Schema | {}) => {
    if ('json_schema' in schema) {
      return Object.entries(schema.json_schema.properties).map(([key, property]: [string, any]) => {
        if (key === 'uuid') {
          return null;
        }
        return (
          <div key={key} className='w-full mt-2'>
            <form.Field
              //@ts-ignore
              name={`${key}`}
              children={(field) => (
                <>
                  <label htmlFor={key}>{property.title}</label>
                  <TextInput
                    id={key}
                    // @ts-ignore
                    value={field.state.value}
                    // @ts-ignore
                    onChange={(e) => field.handleChange(e)}
                    type={_.includes(SECRETS_TO_MASK, key) && typeof property.type === 'string' ? 'password' : 'text'}
                    placeholder={property.description || ''}
                  />
                  <FieldInfo field={field} />
                </>
              )}
              validators={{
                onChange: ({ value }) => undefined,
              }}
            />
          </div>
        );
      });
    } else {
      return null;
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {generateHTML(schema)}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <>
            <button type='submit' disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Submit'}
            </button>
            <button className='ml-2' type='reset' onClick={() => form.reset()}>
              Reset
            </button>
          </>
        )}
      />
    </form>
  );
};
