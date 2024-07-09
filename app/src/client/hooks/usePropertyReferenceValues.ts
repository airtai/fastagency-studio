import { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import {
  matchPropertiesAndIdentifyUnmatchedRefs,
  constructHTMLSchema,
  getAllRefs,
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

  const fetchPropertyReferenceValues = useCallback(() => {
    if (!jsonSchema) return;

    const newRefValues: Record<string, any> = {};

    Object.entries(jsonSchema.properties).forEach(([key, property]) => {
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

        const missingDependencyList = unMatchedRefs.map((item) => ({
          label: htmlSchema.title,
          model_type: item,
          property_type: getMissingDependencyType(jsonSchema.$defs, item),
        }));

        newRefValues[key] = {
          htmlSchema: htmlSchema,
          matchedProperties: matchedProperties,
          missingDependency: missingDependencyList,
        };
      }
    });

    setRefValues(newRefValues);
  }, [jsonSchema, allUserProperties, updateExistingModel]);

  useEffect(() => {
    fetchPropertyReferenceValues();
  }, [fetchPropertyReferenceValues]);

  return refValues;
};
