// components/ModelFormContainer.tsx
import React from 'react';
import { ApiSchema } from '../interfaces/BuildPageInterfaces';

interface ModelFormContainerProps {
  property_type: string;
  selectedModel: string;
  modelSchemas: ApiSchema[];
  onModelChange: (selectedModel: string) => void;
}

const ModelFormContainer: React.FC<ModelFormContainerProps> = ({
  property_type,
  selectedModel,
  modelSchemas,
  onModelChange,
}) => {
  return (
    <div className='flex flex-col gap-9'>
      <div className='flex flex-col gap-5.5 px-6.5'>
        <h2 className='text-lg font-semibold text-airt-primary mt-6 '>{`Add a new ${property_type}`}</h2>
        <label className='-mb-3 block text-black dark:text-white'>{`Select  ${property_type}`}</label>
        <div className='relative z-20 bg-white dark:bg-form-input'>
          <select
            className='w-full rounded border bg-transparent py-3 px-12 outline-none focus:border-primary'
            onChange={(e) => onModelChange(e.target.value)}
            defaultValue={selectedModel}
          >
            {modelSchemas.map((schema) => (
              <option key={schema.name} value={schema.name}>
                {schema.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ModelFormContainer;
