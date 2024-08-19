import { useState, useEffect, useCallback } from 'react';
import { PropertySchemaParser, Flow, UserProperties } from './PropertySchemaParser';
import { PropertiesSchema } from '../../interfaces/BuildPageInterfaces';

interface pushParser {
  propertiesSchema: PropertiesSchema;
  activeProperty: string;
  activeModel: string | null;
  flow: Flow;
  activeModelObj?: any;
  userProperties: any;
  replaceLast?: boolean;
}

export function useFormHandler(setActiveProperty: (activeProperty: string) => void) {
  const [stack, setStack] = useState<PropertySchemaParser[]>([]);
  console.log('stack: ', stack);

  const getCurrentParser = useCallback(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const pushNewParser = useCallback((customOptions: pushParser) => {
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
      // When the model is updated in the same property, we need to replace the last parser in the stack
      if (customOptions.replaceLast && prevStack.length > 0) {
        return [...prevStack.slice(0, -1), newParser];
      } else {
        // this is for rest of the cases
        return [...prevStack, newParser];
      }
    });

    setActiveProperty(customOptions.activeProperty);
  }, []);

  const popFromStack = useCallback((userProperties: UserProperties[] | null) => {
    setStack((prevStack) => {
      const stackWithoutLast = prevStack.slice(0, -1);
      const lastProperty = stackWithoutLast[stackWithoutLast.length - 1];
      const previousPropertyName = lastProperty?.getPropertyName();

      userProperties && lastProperty?.setUserProperties(userProperties);
      !!previousPropertyName && setActiveProperty(previousPropertyName);
      return stackWithoutLast;
    });
  }, []);

  const clearStack = useCallback(() => {
    setStack([]);
  }, []);

  return {
    parser: getCurrentParser(),
    pushNewParser,
    popFromStack,
    clearStack,
  };
}
