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
  console.log('stack', stack);

  const getCurrentParser = useCallback(() => {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, [stack]);

  const getPropertyNamesFromStack = useCallback(() => {
    return stack.map((parser) => parser.getFormattedPropertyName());
  }, [stack]);

  /**
   * Pushes a new parser to the stack and updates the existing one based on user actions.
   * @param customOptions Options for creating or updating a parser.
   */
  const pushNewParser = useCallback((customOptions: PushParser) => {
    // This function gets called whenever user tries to create a new form or a nested form
    const newParser = new PropertySchemaParser(customOptions.propertiesSchema, customOptions.activeProperty);
    newParser.setActiveModel(customOptions.activeModel);

    // Configure the new parser
    if (customOptions.flow) {
      newParser.setFlow(customOptions.flow);
    }

    if (customOptions.activeModelObj) {
      newParser.setActiveModelObj(customOptions.activeModelObj);
    }

    if (customOptions.userProperties) {
      newParser.setUserProperties(customOptions.userProperties);
    }

    // Update the parser stack to control dynamic form field rendering
    setStack((prevStack) => {
      if (customOptions.replaceLast && prevStack.length > 0) {
        // Replace the last parser in the stack with the new parser when updating the 'select model' dropdown instead of appending to it
        return [...prevStack.slice(0, -1), newParser];
      } else {
        // This will be called when user creates a new nested form
        if (customOptions.formState) {
          const lastParser = prevStack[prevStack.length - 1];
          if (lastParser) {
            /**
             * Update the last parser before adding a new one for nested forms.
             * @remarks
             * This process involves:
             * 1. Saving the current state of the outer form in json_str.
             *    This retains the values when navigating back to the outer form.
             * 2. Storing the fieldKey to identify the outer form's key.
             *    This allows pre-population of the outer form with nested form values.
             */
            const lastParserActiveModelObj = lastParser.getActiveModelObj() || {};
            lastParser.setActiveModelObj({
              ...lastParserActiveModelObj,
              json_str: customOptions.formState.values,
              fieldKey: customOptions.formState.fieldKey,
            });
          }
        }

        return [...prevStack, newParser];
      }
    });

    setActiveProperty(customOptions.activeProperty);
  }, []);

  const popFromStack = useCallback(
    (userProperties: UserProperties[] | null, validateDataResponse: any = null, index: number = -1) => {
      setStack((prevStack) => {
        const newStack = prevStack.slice(0, index === -1 ? -1 : index + 1);
        const lastProperty = newStack[newStack.length - 1];
        const previousPropertyName = lastProperty?.getPropertyName();

        if (userProperties && lastProperty) {
          lastProperty.setUserProperties(userProperties);
        }
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
        if (previousPropertyName) {
          setActiveProperty(previousPropertyName);
        }
        return newStack;
      });
    },
    []
  );

  const clearStack = useCallback(() => {
    setStack([]);
  }, []);

  return {
    parser: getCurrentParser(),
    propertiesInStack: getPropertyNamesFromStack(),
    pushNewParser,
    popFromStack,
    clearStack,
  };
}
