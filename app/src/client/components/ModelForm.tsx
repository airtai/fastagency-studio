// src/components/ModelForm.tsx
import React from 'react';
import { JsonSchema, Model, ModelSchemas } from '../interfaces/ModelInterfaces';

import ModelFormContainer from './ModelFormContainer';
import DynamicFormBuilder from './DynamicFormBuilder';

interface ModelFormProps {
  modelSchemas: ModelSchemas;
  initialModelSchema: JsonSchema | null;
  selectedModel: string;
  updateExistingModel: Model | null;
  onModelChange: (model: string) => void;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: () => void;
  onDeleteCallback: (data: any) => void;
}

const ModelForm: React.FC<ModelFormProps> = ({
  modelSchemas,
  initialModelSchema,
  selectedModel,
  updateExistingModel,
  onModelChange,
  onSuccessCallback,
  onCancelCallback,
  onDeleteCallback,
}) => {
  return (
    <div>
      {modelSchemas && (
        <>
          {updateExistingModel && <h2 className='sm:mt-6 text-lg font-semibold text-airt-primary'>Update model</h2>}
          {!updateExistingModel && (
            <ModelFormContainer selectedModel={null} modelSchemas={modelSchemas} onModelChange={onModelChange} />
          )}
          {initialModelSchema && (
            <DynamicFormBuilder
              jsonSchema={initialModelSchema}
              validationURL={`models/llms/${selectedModel}/validate`}
              updateExistingModel={updateExistingModel ?? null}
              onSuccessCallback={onSuccessCallback}
              onCancelCallback={onCancelCallback}
              onDeleteCallback={onDeleteCallback}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ModelForm;
