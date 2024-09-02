import React from 'react';
import _ from 'lodash';

import { navLinkItems } from './CustomSidebar';
import { formatApiKey } from './buildPage/buildPageUtils';

interface JsonStr {
  name: string;
  api_key?: string;
}

export interface ItemProps {
  created_at: string;
  model_name: string;
  model_uuid: string;
  updated_at: string;
  type_name: string;
  user_uuid: string;
  uuid: string;
  json_str: JsonStr;
}

interface ModelItemProps {
  model: ItemProps;
  onClick: () => void;
}

interface TypeToClass {
  [key: string]: string;
}

const ModelItem: React.FC<ModelItemProps> = ({ model, onClick }) => {
  const propertyName = model.json_str.name ? model.json_str.name : model.model_name;
  const svgIcon = _.find(navLinkItems, ['componentName', model.type_name])!.svgIcon;
  const typeToClass: TypeToClass = {
    secret: 'text-airt-primary mt-1 ml-1', // pragma: allowlist secret
    deployment: 'text-airt-primary mt-1 ml-2',
    llm: 'text-airt-primary ml-0 mt-1',
    default: 'text-airt-primary ml-0',
  };

  const svgClassName = typeToClass[model.type_name] || typeToClass['default'];
  return (
    <div
      className='group relative cursor-pointer overflow-hidden bg-airt-primary text-airt-font-base px-4 pt-5 pb-4 transition-all duration-300 hover:-translate-y-1 sm:max-w-sm sm:rounded-lg sm:pl-8 sm:pr-24'
      onClick={onClick}
      data-testid={`model-item-${model.model_uuid}`}
    >
      <div className='relative z-10 mx-auto max-w-md'>
        <div className='flex items-center mb-3'>
          <span className='absolute z-0 h-7 w-7 rounded-full bg-airt-secondary transition-all duration-300 group-hover:scale-[30]'></span>
          <div className='z-10 w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full dark:bg-indigo-500 bg-airt-secondary text-white flex-shrink-0'>
            <span className={svgClassName}>{svgIcon}</span>
          </div>
          <h2 className='z-10 text-sm text-airt-font-base group-hover:text-airt-primary dark:text-airt-font-base font-medium'>
            {propertyName}
          </h2>
        </div>
        {model.json_str.name && (
          <div className='flex flex-col gap-2 text-airt-font-base group-hover:text-airt-primary pt-4 sm:max-w-sm sm:rounded-lg'>
            <p className='text-xs z-10 '>{model.model_name}</p>
          </div>
        )}
        {model.json_str.api_key && (
          <div className='flex flex-col gap-2 text-airt-font-base group-hover:text-airt-primary pt-2 sm:max-w-sm sm:rounded-lg'>
            <p className='text-xs z-10'>{formatApiKey(model.json_str.api_key)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelItem;
