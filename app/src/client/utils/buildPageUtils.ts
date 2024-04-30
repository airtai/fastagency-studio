import _ from 'lodash';

import { getModels } from 'wasp/client/operations';
import { SchemaCategory, ApiResponse, ApiSchema, JsonSchema } from '../interfaces/BuildPageInterfaces';
import { SelectedModelSchema } from '../interfaces/BuildPageInterfaces';

export const filerOutComponentData = (data: ApiResponse, componentName: string): SchemaCategory => {
  return data.list_of_schemas.filter((schema: any) => schema.name === componentName)[0];
};

export function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatApiKey(apiKey: string) {
  if (apiKey.length) {
    if (apiKey.length > 7) {
      return `${apiKey.slice(0, 3)}...${apiKey.slice(-4)}`;
    } else {
      return `${apiKey.slice(0, 2)}${'*'.repeat(apiKey.length - 2)}`;
    }
  } else {
    return '';
  }
}

export const getSchemaByName = (schemas: ApiSchema[], schemaName: string): JsonSchema => {
  const apiSchema: ApiSchema | undefined = schemas.find((s) => s.name === schemaName);
  return apiSchema ? apiSchema.json_schema : schemas[0].json_schema;
};

interface PropertyDependencyMap {
  [key: string]: string[];
}

const propertyDependencyMap: PropertyDependencyMap = {
  secret: [''],
  llm: ['secret'],
};

export const getDependenciesCreatedByUser = async (property_type: string): Promise<SelectedModelSchema[]> => {
  const getProperty = async (property: string) => {
    return await getModels([''], { property_type: property });
  };
  const propertyDependencies = propertyDependencyMap[property_type];
  const userPropertyDataPromises = _.map(propertyDependencies, getProperty);
  const userPropertyData = await Promise.all(userPropertyDataPromises);
  return _.flatten(userPropertyData);
};

interface constructHTMLSchemaValues {
  [key: string]: string[] | string;
}

export const constructHTMLSchema = (
  propertyDependencies: SelectedModelSchema[],
  title: string
): constructHTMLSchemaValues => {
  const properties = _.map(propertyDependencies, 'property_name');
  return {
    default: properties[0],
    description: '',
    enum: properties,
    title: title,
    type: 'string',
  };
};

interface PropertyReferenceValues {
  htmlSchema: constructHTMLSchemaValues;
  userPropertyData: SelectedModelSchema[];
}

export const getPropertyReferenceValues = async (
  ref: string,
  definitions: any,
  key: string,
  property_type: string
): Promise<{} | PropertyReferenceValues> => {
  const refArray = ref.split('/');
  const refName = refArray[refArray.length - 1];
  if (!_.has(definitions, refName)) {
    return {}; // show error???
  }

  const title = _.map(key.split('_'), capitalizeFirstLetter).join(' ');

  const propertyDependencies = await getDependenciesCreatedByUser(property_type);
  const htmlSchema = constructHTMLSchema(propertyDependencies, title);
  const retVal: PropertyReferenceValues = {
    htmlSchema: htmlSchema,
    userPropertyData: propertyDependencies,
  };
  return retVal;
};
