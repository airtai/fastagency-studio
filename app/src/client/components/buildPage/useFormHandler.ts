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
  replaceLast?: boolean;
}

export function useFormHandler(propertiesSchema: PropertiesSchema, activeProperty: string) {
  const [stack, setStack] = useState<PropertySchemaParser[]>([]);
  console.log('stack: ', stack);

  const getCurrentParser = useCallback(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const addNewParserToStack = useCallback((customOptions: CustomInitOptions) => {
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

    setStack((prevStack) => {
      if (customOptions.replaceLast && prevStack.length > 0) {
        return [...prevStack.slice(0, -1), newParser];
      } else {
        return [...prevStack, newParser];
      }
    });
  }, []);

  const popFromStack = useCallback(() => {
    setStack((prevStack) => prevStack.slice(0, -1));
  }, []);

  const clearStack = useCallback(() => {
    setStack([]);
  }, []);

  return {
    parser: getCurrentParser(),
    addNewParserToStack,
    popFromStack,
    clearStack,
  };
}
