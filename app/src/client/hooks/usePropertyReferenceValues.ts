import { useState, useEffect } from 'react';
import _ from 'lodash';
import {
  matchPropertiesAndIdentifyUnmatchedRefs,
  constructHTMLSchema,
  getAllRefs,
  // checkForDependency,
  getMissingDependencyType,
} from '../utils/buildPageUtils';
import { JsonSchema, SelectedModelSchema } from '../interfaces/BuildPageInterfaces';

interface UsePropertyReferenceValuesProps {
  jsonSchema: JsonSchema | null;
  allUserProperties: any;
  updateExistingModel: SelectedModelSchema | null;
}

export const usePropertyReferenceValues = ({
  jsonSchema,
  allUserProperties,
  updateExistingModel,
}: UsePropertyReferenceValuesProps) => {
  const [refValues, setRefValues] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchPropertyReferenceValues() {
      if (jsonSchema) {
        for (const [key, property] of Object.entries(jsonSchema.properties)) {
          const propertyHasRef = _.has(property, '$ref') && property['$ref'];
          const propertyHasAnyOf = (_.has(property, 'anyOf') || _.has(property, 'allOf')) && _.has(jsonSchema, '$defs');
          if (propertyHasRef || propertyHasAnyOf) {
            const title: string = property.hasOwnProperty('title') ? property.title || '' : key;
            const propertyRefs = propertyHasRef ? [property['$ref']] : getAllRefs(property);
            const [matchedProperties, unMatchedRefs] = matchPropertiesAndIdentifyUnmatchedRefs(
              allUserProperties,
              propertyRefs
            );

            const selectedModelRefValues = _.get(updateExistingModel, key, null);
            const htmlSchema = constructHTMLSchema(matchedProperties, title, property, selectedModelRefValues);

            let missingDependencyList: string[] = [];
            if (unMatchedRefs.length > 0) {
              for (const item of unMatchedRefs) {
                missingDependencyList = _.concat(missingDependencyList, {
                  label: htmlSchema.title,
                  model_type: item,
                  property_type: getMissingDependencyType(jsonSchema.$defs, item),
                });
              }
            }
            setRefValues((prev) => ({
              ...prev,
              [key]: {
                htmlSchema: htmlSchema,
                matchedProperties: matchedProperties,
                missingDependency: missingDependencyList,
              },
            }));
          }
        }
      }
    }

    fetchPropertyReferenceValues();
  }, [jsonSchema, allUserProperties, updateExistingModel]);

  return refValues;
};
