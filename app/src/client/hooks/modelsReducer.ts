// hooks/modelsReducer.ts
import { ModelSchemas, JsonSchema, Model } from '../interfaces/ModelInterfaces';
import { ModelsActionType } from './useModels';

export type StateType = {
  modelSchemas: ModelSchemas | null;
  initialModelSchema: JsonSchema | null;
  selectedModel: string;
  updateExistingModel: Model | null;
  isLoading: boolean;
  error: string | null;
  showAddModel: boolean;
};

export type ActionType =
  | { type: ModelsActionType.SET_MODEL_DATA; payload: ModelSchemas }
  | { type: ModelsActionType.SELECT_MODEL; payload: { json_schema: JsonSchema; name: string } }
  | { type: ModelsActionType.TOGGLE_LOADING; payload: boolean }
  | { type: ModelsActionType.SET_ERROR; payload: string | null }
  | { type: ModelsActionType.TOGGLE_ADD_MODEL; payload: boolean }
  | { type: ModelsActionType.UPDATE_EXISTING_MODEL; payload: Model | null };

export const initialState: StateType = {
  modelSchemas: null,
  initialModelSchema: null,
  selectedModel: '',
  updateExistingModel: null,
  isLoading: false,
  error: null,
  showAddModel: false,
};

export function modelsReducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case ModelsActionType.SET_MODEL_DATA:
      return {
        ...state,
        modelSchemas: action.payload,
        initialModelSchema: action.payload.schemas[0].json_schema,
        selectedModel: action.payload.schemas[0].name,
      };
    case ModelsActionType.SELECT_MODEL:
      return { ...state, initialModelSchema: action.payload.json_schema, selectedModel: action.payload.name };
    case ModelsActionType.TOGGLE_LOADING:
      return { ...state, isLoading: action.payload };
    case ModelsActionType.SET_ERROR:
      return { ...state, error: action.payload };
    case ModelsActionType.TOGGLE_ADD_MODEL:
      return { ...state, showAddModel: action.payload, updateExistingModel: null };
    case ModelsActionType.UPDATE_EXISTING_MODEL:
      return { ...state, updateExistingModel: action.payload, showAddModel: true };
    default:
      return state;
  }
}
