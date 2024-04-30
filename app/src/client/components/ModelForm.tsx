// src/components/ModelForm.tsx
import React from 'react';
import { SchemaCategory, ApiSchema, JsonSchema, SelectedModelSchema } from '../interfaces/BuildPageInterfaces';

import ModelFormContainer from './ModelFormContainer';
import DynamicFormBuilder from './DynamicFormBuilder';
import { getSchemaByName } from '../utils/buildPageUtils';

interface ModelFormProps {
  data: SchemaCategory;
  selectedModel: string;
  updateExistingModel: SelectedModelSchema | null;
  onModelChange: (model: string) => void;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: () => void;
  onDeleteCallback: (data: any) => void;
}

const ModelForm: React.FC<ModelFormProps> = ({
  data,
  selectedModel,
  updateExistingModel,
  onModelChange,
  onSuccessCallback,
  onCancelCallback,
  onDeleteCallback,
}) => {
  const modelSchemas: ApiSchema[] = data.schemas;
  const initialModelSchema: JsonSchema = getSchemaByName(data.schemas, selectedModel);
  const validationURL: string = `models/${data.name}/${selectedModel}/validate`;
  return (
    <div>
      {modelSchemas && (
        <>
          {/* {<h2 className='sm:mt-6 text-lg font-semibold text-airt-primary'>Update model</h2>} */}
          {
            <ModelFormContainer
              property_type={data.name}
              selectedModel={selectedModel}
              modelSchemas={modelSchemas}
              onModelChange={onModelChange}
            />
          }
          {initialModelSchema && (
            <DynamicFormBuilder
              property_type={data.name}
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
