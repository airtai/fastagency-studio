import React from 'react';
import ModelItem from './ModelItem';
import { Model } from '../interfaces/ModelInterfaces';

interface ModelListProps {
  models: Model[] | undefined;
  onSelectModel: (index: number) => void;
}

const ModelList: React.FC<ModelListProps> = ({ models, onSelectModel }) => {
  if (!models || models.length === 0) {
    return (
      <div className='flex flex-col gap-3'>
        <h2 className='text-lg font-semibold text-airt-primary'>Available Models</h2>
        <p className='text-airt-primary mt-3 opacity-50'>No models available. Please add one.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      <h2 className='text-lg font-semibold text-airt-primary'>Available Models</h2>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        {models.map((model, index) => (
          <ModelItem key={index} model={model} onClick={() => onSelectModel(index)} />
        ))}
      </div>
    </div>
  );
};

export default ModelList;
