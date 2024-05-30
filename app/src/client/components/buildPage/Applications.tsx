import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import CustomBreadcrumb from '../CustomBreadcrumb';
import Button from '../Button';
import { SelectInput } from '../form/SelectInput';
import { SelectedModelSchema } from '../../interfaces/BuildPageInterfaces';

import { getApplications, useQuery, getModels, addApplication } from 'wasp/client/operations';
import { navLinkItems } from '../CustomSidebar';
import { TextInput } from '../form/TextInput';
import Loader from '../../admin/common/Loader';

interface ItemProps {
  uuid: string;
  user_uuid: string;
  team_uuid: string;
  json_str: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

const Applications = () => {
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ItemProps | null>(null);
  const [applicationInstructions, setApplicationInstructions] = useState(false);
  const [isshowApplicationInstructions, setIsshowApplicationInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    data: userApplications,
    isLoading: isUserApplicationDataLoading,
    refetch: refetchApplications,
  } = useQuery(getApplications);

  const handleClick = () => {
    setShowAddModel(true);
  };

  const updateSelectedApplication = (index: number) => {
    if (userApplications) {
      const selectedApplication = userApplications[index];
      setSelectedApplication(selectedApplication);
      setApplicationInstructions(true);
      setIsLoading(false);
    }
  };

  const onCancelCallback = () => {
    setSelectedApplication(null);
    setApplicationInstructions(false);
  };

  const showInstructionsForApplication = (applicationName: string) => {
    setIsLoading(true);
    refetchApplications();
    setIsshowApplicationInstructions(true);
    setShowAddModel(false);
  };

  useEffect(() => {
    if (userApplications && userApplications.length > 0 && isshowApplicationInstructions) {
      const sortedUserApplications = _.sortBy(userApplications, ['created_at']);
      updateSelectedApplication(sortedUserApplications.length - 1);
    }
  }, [userApplications]);

  return (
    <>
      <CustomBreadcrumb pageName='Applications' />
      <div className='flex flex-col gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[600px]'>
            <div className='flex-col flex items-start p-6 gap-3 w-full'>
              <div className={`${showAddModel ? 'hidden' : ''} flex justify-end w-full px-1 py-3`}>
                <Button onClick={handleClick} label={`Add application`} />
              </div>
              <div className='flex-col flex w-full'>
                {applicationInstructions ? (
                  <div className='flex flex-col gap-3'>
                    <p className='text-airt-primary mt-1 -mt-3 opacity-50'>{`Instructions for ${selectedApplication?.json_str.name}`}</p>
                    <div className='float-right'>
                      <button
                        className='rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        disabled={isLoading}
                        data-testid='form-cancel-button'
                        onClick={onCancelCallback}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : !showAddModel ? (
                  <ApplicationsList
                    userApplications={userApplications}
                    onSelectApplication={updateSelectedApplication}
                  />
                ) : (
                  <AddApplicationForm
                    setShowAddModel={setShowAddModel}
                    showInstructionsForApplication={showInstructionsForApplication}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {(isUserApplicationDataLoading || isLoading) && (
        <div className='z-[999999] absolute inset-0 flex items-center justify-center bg-white bg-opacity-50'>
          <Loader />
        </div>
      )}
    </>
  );
};

export default Applications;

const AddApplicationForm = ({
  setShowAddModel,
  showInstructionsForApplication,
}: {
  setShowAddModel: (value: boolean) => void;
  showInstructionsForApplication: (applicationName: string) => void;
}) => {
  const [team, setTeam] = useState('');
  const [formError, setFormError] = useState<Record<string, any>>({});
  const [applicationName, setApplicationName] = useState('');
  const { data: allTeams, isLoading: isTeamsDataLoading } = useQuery(getModels, { type_name: 'team' });
  const [isLoading, setIsLoading] = useState(false);

  const handleTeamChange = (value: string) => {
    setTeam(value);
  };

  const handleMessageChange = (value: string) => {
    setApplicationName(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (allTeams) {
      setIsLoading(true);
      const teamUUID = team === '' ? allTeams[0].uuid : _.find(allTeams, ['json_str.name', team])?.uuid;
      await addApplication({ teamUUID: teamUUID, applicationName: applicationName });
      setIsLoading(false);
      showInstructionsForApplication(applicationName);
    }
  };

  const onCancelCallback = () => {
    setTeam('');
    setShowAddModel(false);
  };

  return (
    <div className='w-full lg:min-w-[700px] 2xl:min-w-[1200px]'>
      <CustomBreadcrumb pageName='Enter details to start new chat' />
      <div className='rounded-lg border bg-white dark:border-strokedark dark:bg-boxdark min-h-[300px] sm:min-h-[300px] pt-7'>
        <form onSubmit={handleSubmit} className='px-6.5 py-2'>
          <label className='text-airt-primary' htmlFor='selectTeam'>
            Select Team
          </label>
          <SelectInput
            id='selectTeam'
            value={team}
            options={_.map(allTeams, (team: SelectedModelSchema) => team.json_str.name)}
            onChange={handleTeamChange}
          />
          {formError && (
            <div className='mb-2' style={{ color: 'red' }}>
              {formError.team}
            </div>
          )}
          <label className='text-airt-primary inline-block' htmlFor='setSystemMessage'>
            Application Name
          </label>
          <TextInput
            id='applicationName'
            type='string'
            value={applicationName}
            placeholder='The name of the SaaS application you want to create'
            onChange={handleMessageChange}
          />
          {formError && (
            <div className='mb-2' style={{ color: 'red' }}>
              {formError.message}
            </div>
          )}
          <div className='float-right'>
            <button
              className='rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              disabled={isLoading}
              data-testid='form-cancel-button'
              onClick={onCancelCallback}
            >
              Cancel
            </button>
            <button
              className='ml-3 float-right rounded-md px-3.5 py-2.5 text-sm  bg-airt-primary text-airt-font-base   hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              type='submit'
            >
              Create
            </button>
          </div>
        </form>
      </div>
      {(isLoading || isTeamsDataLoading) && (
        <div className='z-[999999] absolute inset-0 flex items-center justify-center bg-white bg-opacity-50'>
          <Loader />
        </div>
      )}
    </div>
  );
};

interface ApplicationListProps {
  userApplications: ItemProps[] | undefined;
  onSelectApplication: (index: number) => void;
}

const ApplicationsList: React.FC<ApplicationListProps> = ({ userApplications, onSelectApplication }) => {
  if (!userApplications || userApplications.length === 0) {
    return (
      <div className='flex flex-col gap-3'>
        <p className='text-airt-primary mt-1 -mt-3 opacity-50'>{`No applications found. Please add one.`}</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {/* <h2 className='text-lg font-semibold text-airt-primary'>Available Models</h2> */}
      <div className='grid grid-cols-1 mx:auto md:grid-cols-2 lg:grid-cols-3 gap-3'>
        {userApplications.map((application, index) => (
          <ApplicationItem key={index} application={application} onClick={() => onSelectApplication(index)} />
        ))}
      </div>
    </div>
  );
};

interface ApplicationItemProps {
  application: ItemProps;
  onClick: () => void;
}

const ApplicationItem: React.FC<ApplicationItemProps> = ({ application, onClick }) => {
  const ApplicationName = application.json_str.name;
  const svgIcon = _.find(navLinkItems, ['componentName', 'application']).svgIcon;
  return (
    <div
      className='group relative cursor-pointer overflow-hidden bg-airt-primary text-airt-font-base px-6 pt-10 pb-8 transition-all duration-300 hover:-translate-y-1 sm:max-w-sm sm:rounded-lg sm:pl-8 sm:pr-24'
      onClick={onClick}
    >
      <div className='relative z-10 mx-auto max-w-md'>
        <div className='flex items-center mb-3'>
          <span className='absolute z-0 h-9 w-9 rounded-full bg-airt-secondary transition-all duration-300 group-hover:scale-[30]'></span>
          <div className='z-10 w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full dark:bg-indigo-500 bg-airt-secondary text-white flex-shrink-0'>
            <span className='text-airt-primary mt-1 ml-1'>{svgIcon}</span>
          </div>
          <h2 className='z-10 text-airt-font-base group-hover:text-airt-primary dark:text-airt-font-base text-lg font-medium'>
            {ApplicationName}
          </h2>
        </div>
      </div>
    </div>
  );
};
