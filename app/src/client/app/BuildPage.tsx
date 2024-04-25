import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { type User } from 'wasp/entities';

import CustomAuthRequiredLayout from './layout/CustomAuthRequiredLayout';
import TypesManagerLayout from './layout/TypesManagerLayout';

import Secrets from '../components/buildPage/Secrets';
import LLMs from '../components/buildPage/LLMs';
import Agents from '../components/buildPage/Agents';
import Teams from '../components/buildPage/Teams';
import ToolBoxes from '../components/buildPage/ToolBoxes';
import LoadingComponent from '../components/LoadingComponent';
import { useBuildPage } from '../hooks/useBuildPage';

interface BuildPageProps {
  user: User;
}

interface componentsMapType {
  [key: string]: React.FC<any>;
}

const componentsMap: componentsMapType = {
  secrets: Secrets,
  llms: LLMs,
  agents: Agents,
  teams: Teams,
  toolboxes: ToolBoxes,
};

const BuildPage = ({ user }: BuildPageProps) => {
  const { componentToRender, data, loading, error } = useBuildPage();

  if (loading) {
    return <LoadingComponent />; // Display loading indicator while data is being fetched
  }

  if (error) {
    return (
      <div className='error-message'>
        {/* Display error message */}
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  const ComponentToRender = componentsMap[componentToRender];
  console.log('data: ', data);
  return (
    <TypesManagerLayout>
      {ComponentToRender ? (
        <ComponentToRender data={data} />
      ) : (
        <p
          className='absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-6xl text-airt-font-base'
          style={{ lineHeight: 'normal' }}
        >
          Build Page - No valid component found for this section.
        </p>
      )}
    </TypesManagerLayout>
  );
};

const BuildPageWithCustomAuth = CustomAuthRequiredLayout(BuildPage);
export default BuildPageWithCustomAuth;
