import { useState, useRef, useCallback, useMemo } from 'react';
import { PropertySchemaParser } from './PropertySchemaParser';
import { ListOfSchemas } from '../../interfaces/BuildPageInterfacesNew';

export function usePropertySchemaParser(propertySchemasList: ListOfSchemas) {
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const parserRef = useRef<PropertySchemaParser | null>(null);

  // Initialize or update the parser when propertySchemasList changes
  useMemo(() => {
    parserRef.current = new PropertySchemaParser(propertySchemasList);
  }, [propertySchemasList]);

  const setActiveModelWrapper = useCallback((model: string | null) => {
    if (parserRef.current) {
      parserRef.current.setActiveModel(model);
      setActiveModel(model);
    }
  }, []);

  // Expose other methods of PropertySchemaParser as needed
  const getSchemaForModel = useCallback((modelName: string) => {
    return parserRef.current?.getSchemaForModel(modelName);
  }, []);

  return {
    parser: parserRef.current,
    activeModel,
    setActiveModel: setActiveModelWrapper,
  };
}
