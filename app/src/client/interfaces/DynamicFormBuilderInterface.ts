import { JsonSchema, SelectedModelSchema } from './BuildPageInterfaces';
import { FormData } from '../hooks/useForm';

export interface DynamicFormBuilderProps {
  allUserProperties: any;
  type_name: string;
  jsonSchema: JsonSchema;
  validationURL: string;
  updateExistingModel: SelectedModelSchema | null;
  resumeFormData: SelectedModelSchema | null;
  onSuccessCallback: (data: any) => void;
  onCancelCallback: (event: React.FormEvent) => void;
  onDeleteCallback: (data: any) => void;
  handleAddProperty: (property_type: string, formData: FormData, key: string) => void;
}
