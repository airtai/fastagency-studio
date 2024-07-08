import { useState, useEffect } from 'react';
import _ from 'lodash';
import {
  getMatchedUserProperties,
  constructHTMLSchema,
  getAllRefs,
  checkForDependency,
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
            const allRefList = propertyHasRef ? [property['$ref']] : getAllRefs(property);
            const refUserProperties = getMatchedUserProperties(allUserProperties, allRefList);
            const missingDependencyList = checkForDependency(refUserProperties, allRefList);
            const title: string = property.hasOwnProperty('title') ? property.title || '' : key;
            const selectedModelRefValues = _.get(updateExistingModel, key, null);
            const htmlSchema = constructHTMLSchema(refUserProperties, title, property, selectedModelRefValues);
            let missingDependencyType: null | string = null;
            if (missingDependencyList.length > 0) {
              missingDependencyType = getMissingDependencyType(jsonSchema.$defs, allRefList);
            }
            setRefValues((prev) => ({
              ...prev,
              [key]: {
                htmlSchema: htmlSchema,
                refUserProperties: refUserProperties,
                missingDependency: {
                  type: missingDependencyType,
                  label: key,
                },
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
