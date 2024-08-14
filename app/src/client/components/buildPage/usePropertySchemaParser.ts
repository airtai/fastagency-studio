import { useState, useEffect, useCallback } from 'react';
import { PropertySchemaParser, UserFlow } from './PropertySchemaParser';
import { ListOfSchemas, PropertiesSchema } from '../../interfaces/BuildPageInterfaces';
import { filerOutComponentData } from './buildPageUtils';

interface CustomInitOptions {
  propertiesSchema: PropertiesSchema;
  activeProperty: string;
  activeModel: string | null;
  userFlow: UserFlow;
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
    const newParser = new PropertySchemaParser(propertiesSchema, activeProperty);
    newParser.setActiveModel(customOptions.activeModel);

    if (customOptions.userFlow) {
      newParser.setUserFlow(customOptions.userFlow);
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
