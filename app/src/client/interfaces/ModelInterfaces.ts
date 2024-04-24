// interfaces/models.ts
export interface JsonSchemaProperty {
  default?: string;
  description: string;
  enum?: string[];
  title: string;
  type: string;
  const?: string;
  format?: string;
  maxLength?: number;
  minLength?: number;
}

export interface JsonSchema {
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  title: string;
  type: string;
}

export interface Schema {
  name: string;
  json_schema: JsonSchema;
}

export interface ModelSchemas {
  schemas: Schema[];
}

export interface Model {
  model: string;
  base_url: string;
  api_type: string;
  api_version?: string;
  uuid: string;
}

export interface ModelsSchema {
  schemas: Model[];
}

export interface ModelsState {
  modelsSchema: ModelsSchema | null;
  initialModelSchema: JsonSchema | null;
  selectedModel: string;
  updateExistingModel: Model | null;
  isLoading: boolean;
  error: string | null;
  showAddModel: boolean;
}

export type ModelsAction =
  | { type: 'FETCH_START' | 'TOGGLE_LOADING' | 'TOGGLE_ADD_MODEL'; payload?: any }
  | { type: 'FETCH_SUCCESS'; payload: ModelsSchema }
  | { type: 'FETCH_ERROR' | 'SET_ERROR'; payload: string }
  | { type: 'SELECT_MODEL' | 'UPDATE_EXISTING_MODEL'; payload: Model };

export type ModelsDispatch = (action: ModelsAction) => void;
