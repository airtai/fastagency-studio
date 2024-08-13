import { useState, useEffect, useCallback } from 'react';
import { PropertySchemaParser, Flow } from './PropertySchemaParser';
import { ListOfSchemas } from '../../interfaces/BuildPageInterfaces';

interface CustomInitOptions {
  propertySchemasList: ListOfSchemas;
  activeModel: string | null;
  flow: Flow;
  activeModelObj?: any;
  userProperties: any;
}

export function usePropertySchemaParser(propertySchemasList: ListOfSchemas) {
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [parser, setParser] = useState<PropertySchemaParser | null>(null);

  // Recreate the parser when propertySchemasList or activeModel changes
  useEffect(() => {
    const newParser = new PropertySchemaParser(propertySchemasList);
    newParser.setActiveModel(activeModel);
    setParser(newParser);
  }, [propertySchemasList]);

  const createParser = useCallback((customOptions: CustomInitOptions) => {
    const newParser = new PropertySchemaParser(customOptions.propertySchemasList);
    newParser.setActiveModel(customOptions.activeModel);

    if (customOptions.flow) {
      newParser.setFlow(customOptions.flow);
    }

    if (customOptions.activeModelObj) {
      newParser.setActiveModelObj(customOptions.activeModelObj);
    }

    if (customOptions.userProperties) {
      newParser.setUserProperties(customOptions.userProperties);
    }

    setParser(newParser);
    setActiveModel(customOptions.activeModel);
  }, []);

  return {
    parser,
    activeModel,
    createParser,
  };
}
