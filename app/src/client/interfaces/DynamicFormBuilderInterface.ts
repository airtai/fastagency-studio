import { JsonSchema, SelectedModelSchema } from './BuildPageInterfaces';

export interface DynamicFormBuilderProps {
  allUserProperties: any;
  type_name: string;
  jsonSchema: JsonSchema;
  validationURL: string;
  updateExistingModel: SelectedModelSchema | null;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: (event: React.FormEvent) => void;
  onDeleteCallback: (data: any) => void;
  onMissingDependencyClick: (event: React.FormEvent, property_type: string, model_type: string) => void;
}
