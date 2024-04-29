// src/components/ModelForm.tsx
import React from 'react';
import { ApiSchema, SchemaDefinition, SelectedModelSchema } from '../interfaces/BuildPageInterfaces';

import ModelFormContainer from './ModelFormContainer';
import DynamicFormBuilder from './DynamicFormBuilder';

interface ModelFormProps {
  modelSchemas: ApiSchema[];
  initialModelSchema: SchemaDefinition | null;
  selectedModel: string;
  validationURL: string;
  updateExistingModel: SelectedModelSchema | null;
  onModelChange: (model: string) => void;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: () => void;
  onDeleteCallback: (data: any) => void;
}

const ModelForm: React.FC<ModelFormProps> = ({
  modelSchemas,
  initialModelSchema,
  selectedModel,
  validationURL,
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
          {/* {<h2 className='sm:mt-6 text-lg font-semibold text-airt-primary'>Update model</h2>} */}
          {
            <ModelFormContainer
              selectedModel={selectedModel}
              modelSchemas={modelSchemas}
              onModelChange={onModelChange}
            />
          }
          {initialModelSchema && (
            <DynamicFormBuilder
              jsonSchema={initialModelSchema}
              validationURL={validationURL}
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
