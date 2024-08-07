import { useState, useEffect, useCallback } from 'react';
import { PropertySchemaParser } from './PropertySchemaParser';
import { ListOfSchemas } from '../../interfaces/BuildPageInterfacesNew';

export function usePropertySchemaParser(propertySchemasList: ListOfSchemas) {
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [parser, setParser] = useState<PropertySchemaParser | null>(null);

  // Recreate the parser when propertySchemasList or activeModel changes
  useEffect(() => {
    const newParser = new PropertySchemaParser(propertySchemasList);
    newParser.setActiveModel(activeModel);
    setParser(newParser);
  }, [propertySchemasList, activeModel]);

  const setActiveModelWrapper = useCallback((model: string | null) => {
    setActiveModel(model);
  }, []);

  // Expose other methods of PropertySchemaParser as needed
  const getSchemaForModel = useCallback(
    (modelName: string) => {
      return parser?.getSchemaForModel(modelName);
    },
    [parser]
  );

  return {
    parser,
    activeModel,
    setActiveModel: setActiveModelWrapper,
  };
}
