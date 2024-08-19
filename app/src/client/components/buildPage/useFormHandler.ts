import { useState, useEffect, useCallback } from 'react';
import { PropertySchemaParser, Flow, UserProperties } from './PropertySchemaParser';
import { PropertiesSchema } from '../../interfaces/BuildPageInterfaces';

export interface PushParser {
  propertiesSchema: PropertiesSchema;
  activeProperty: string;
  activeModel: string | null;
  flow: Flow;
  activeModelObj?: any;
  userProperties: any;
  replaceLast?: boolean;
  formState?: any;
}

export function useFormHandler(setActiveProperty: (activeProperty: string) => void) {
  const [stack, setStack] = useState<PropertySchemaParser[]>([]);

  const getCurrentParser = useCallback(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const pushNewParser = useCallback((customOptions: PushParser) => {
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
      // When the model dropdown is updated within the same property, we need to replace the last parser in the stack
      if (customOptions.replaceLast && prevStack.length > 0) {
        return [...prevStack.slice(0, -1), newParser];
      } else {
        // this is for rest of the cases
        if (customOptions.formState) {
          const lastParser = prevStack[prevStack.length - 1];
          lastParser &&
            lastParser.setActiveModelObj({
              json_str: customOptions.formState.values,
              fieldKey: customOptions.formState.fieldKey,
            });
        }

        return [...prevStack, newParser];
      }
    });

    setActiveProperty(customOptions.activeProperty);
  }, []);

  const popFromStack = useCallback((userProperties: UserProperties[] | null, validateDataResponse: any = null) => {
    setStack((prevStack) => {
      const stackWithoutLast = prevStack.slice(0, -1);
      const lastProperty = stackWithoutLast[stackWithoutLast.length - 1];
      const previousPropertyName = lastProperty?.getPropertyName();

      userProperties && lastProperty?.setUserProperties(userProperties);
      if (validateDataResponse && lastProperty) {
        const lastPropertyActiveModelObj = lastProperty?.getActiveModelObj();
        if (lastPropertyActiveModelObj && lastPropertyActiveModelObj.fieldKey) {
          lastPropertyActiveModelObj.json_str[lastPropertyActiveModelObj.fieldKey] = {
            uuid: validateDataResponse.uuid,
            name: validateDataResponse.name,
          };
          delete lastPropertyActiveModelObj.fieldKey;
        }
        lastProperty.setActiveModelObj(lastPropertyActiveModelObj);
      }
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
