// hooks/useModels.ts
import { useReducer, useEffect, useCallback } from 'react';
import { getAvailableModels } from '../services/modelService';
import { modelsReducer, initialState } from './modelsReducer';

export enum ModelsActionType {
  SET_MODEL_DATA = 'SET_MODEL_DATA',
  SELECT_MODEL = 'SELECT_MODEL',
  TOGGLE_LOADING = 'TOGGLE_LOADING',
  SET_ERROR = 'SET_ERROR',
  TOGGLE_ADD_MODEL = 'TOGGLE_ADD_MODEL',
  UPDATE_EXISTING_MODEL = 'UPDATE_EXISTING_MODEL',
}

export const useModels = () => {
  const [state, dispatch] = useReducer(modelsReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: ModelsActionType.TOGGLE_LOADING, payload: true });
    try {
      const response = await getAvailableModels();
      dispatch({ type: ModelsActionType.SET_MODEL_DATA, payload: response });
    } catch (error) {
      dispatch({ type: ModelsActionType.SET_ERROR, payload: 'Something went wrong. Please try again later.' });
      console.error(error);
    } finally {
      dispatch({ type: ModelsActionType.TOGGLE_LOADING, payload: false });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { state, dispatch, fetchData };
};
