import { useState, useEffect, useCallback } from 'react';
import { PropertySchemaParser, Flow } from './PropertySchemaParser';
import { PropertiesSchema } from '../../interfaces/BuildPageInterfaces';

interface CustomInitOptions {
  propertiesSchema: PropertiesSchema;
  activeProperty: string;
  activeModel: string | null;
  flow: Flow;
  activeModelObj?: any;
  userProperties: any;
}

export function usePropertySchemaParser(propertiesSchema: PropertiesSchema, activeProperty: string) {
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [parser, setParser] = useState<PropertySchemaParser | null>(null);

  // Recreate the parser when propertySchemasList or activeModel changes
  useEffect(() => {
    const newParser = new PropertySchemaParser(propertiesSchema, activeProperty);
    newParser.setActiveModel(activeModel);
    setParser(newParser);
  }, [propertiesSchema, activeProperty]);

  const createParser = useCallback((customOptions: CustomInitOptions) => {
    const newParser = new PropertySchemaParser(customOptions.propertiesSchema, customOptions.activeProperty);
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
