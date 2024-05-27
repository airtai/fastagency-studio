import _ from 'lodash';

import { getModels } from 'wasp/client/operations';
import { SchemaCategory, ApiResponse, ApiSchema, JsonSchema } from '../interfaces/BuildPageInterfaces';
import { SelectedModelSchema } from '../interfaces/BuildPageInterfaces';
import { propertyDependencyMap } from './constants';
import { tr } from '@faker-js/faker';

export const filerOutComponentData = (data: ApiResponse, componentName: string): SchemaCategory => {
  return data.list_of_schemas.filter((schema: any) => schema.name === componentName)[0];
};

export function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const getSchemaByName = (schemas: ApiSchema[], schemaName: string): JsonSchema => {
  const apiSchema: ApiSchema | undefined = schemas.find((s) => s.name === schemaName);
  return apiSchema ? apiSchema.json_schema : schemas[0].json_schema;
};

export const getDependenciesCreatedByUser = async (type_name: string): Promise<SelectedModelSchema[]> => {
  const getProperty = async (property: string) => {
    return await getModels([''], { type_name: property });
  };
  const propertyDependencies = _.get(propertyDependencyMap, type_name);
  // const immediateDependency = _.castArray(_.last(propertyDependencies));
  const userPropertyDataPromises = _.map(propertyDependencies, getProperty);
  const userPropertyData = await Promise.all(userPropertyDataPromises);
  return _.flatten(userPropertyData);
};

interface constructHTMLSchemaValues {
  [key: string]: string[] | string | number;
}

export const constructHTMLSchema = (
  propertyDependencies: SelectedModelSchema[],
  title: string,
  property: any,
  selectedModelRefValues: null | number | object
): constructHTMLSchemaValues => {
  const capitalizeTitle = _.map(title.split('_'), capitalizeFirstLetter).join(' ');
  let properties = _.map(propertyDependencies, 'json_str.name');
  let defaultValue: string | number;
  if (selectedModelRefValues) {
    defaultValue =
      typeof selectedModelRefValues === 'number'
        ? selectedModelRefValues
        : _.filter(propertyDependencies, ['uuid', (selectedModelRefValues as any).uuid])[0].json_str.name;
  } else {
    defaultValue = _.has(property, 'default')
      ? property.default === null
        ? 'None'
        : _.find(propertyDependencies, ['model_name', removeRefSuffix(property.default)]).json_str.name
      : propertyDependencies[0]?.json_str.name;
  }

  if (properties.includes(defaultValue)) {
    properties = properties.filter((item: string) => item !== defaultValue);
    properties.unshift(defaultValue);
  } else {
    properties.unshift('None');
  }
  const isIntegerOrNull =
    propertyDependencies.length === 0 &&
    _.isEqual(
      _.map(property.anyOf, (o: any) => o.type),
      ['integer', 'null']
    );

  const returnType = isIntegerOrNull ? 'numericStepperWithClearButton' : 'string';
  const description = isIntegerOrNull ? property.description : '';
  return {
    default: defaultValue,
    description: description,
    enum: properties,
    title: capitalizeTitle,
    type: returnType,
  };
};

export const getKeyType = (refName: string, definitions: any): string => {
  const refObj = _.get(definitions, refName);
  return refObj.properties.type.enum[0];
};

interface PropertyReferenceValues {
  htmlSchema: constructHTMLSchemaValues;
  userPropertyData: SelectedModelSchema[];
}

export const getFormSubmitValues = (refValues: any, formData: any, isSecretUpdate: boolean) => {
  const newFormData = _.cloneDeep(formData);
  const refKeys = _.keys(refValues);
  if (refKeys.length === 0) {
    return isSecretUpdate ? _.omit(formData, ['api_key']) : formData;
  }
  _.forEach(refKeys, function (key: string) {
    if (_.has(formData, key)) {
      let selectedKey: string | number | undefined;
      if (formData[key] === null) {
        selectedKey = undefined;
      } else {
        selectedKey = formData[key]
          ? formData[key] && (typeof formData[key] === 'string' || typeof formData[key] === 'number')
            ? formData[key]
            : formData[key].json_str.name
          : refValues[key].htmlSchema.default;
      }
      const selectedData = refValues[key].refUserProperties.find((data: any) => data.json_str.name === selectedKey);
      newFormData[key] = typeof selectedKey === 'string' ? selectedData : selectedKey;
    }
  });
  return newFormData;
};

export const isDependencyAvailable = (dependencyObj: any): boolean => {
  if (_.keys(dependencyObj).length === 0) {
    return true;
  }
  const retVal = _.reduce(
    dependencyObj,
    function (result: boolean, value: number) {
      result = result && value > 0;
      return result;
    },
    true
  );

  return retVal;
};

export function formatDependencyErrorMessage(dependencyList: string[]): string {
  // Create a copy of the dependencyList
  let dependencyListCopy = [...dependencyList];

  if (dependencyListCopy.length === 0) {
    return '';
  } else if (dependencyListCopy.length === 1) {
    return dependencyListCopy[0];
  } else {
    let last = dependencyListCopy.pop();
    return `${dependencyListCopy.join(', one ')} and one ${last}`;
  }
}

export function getRefValues(input: Array<{ $ref: string }>): string[] {
  return input.map((item) => item.$ref);
}

export const removeRefSuffix = (ref: string): string => {
  const refArray = ref.split('/');
  let refName = refArray[refArray.length - 1];
  if (refName.endsWith('Ref')) {
    return refName.slice(0, -3);
  }
  return refName;
};

export function getMatchedUserProperties(allUserProperties: any, ref: string[]) {
  const refList = _.flatten(ref);
  const retVal = _.map(refList, function (ref: any) {
    const refName = removeRefSuffix(ref);
    return _(allUserProperties)
      .filter((property: any) => property.model_name === refName)
      .value();
  });
  return _.flatten(retVal);
}

export function getAllRefs(property: any): any[] {
  return _.map(_.get(property, 'anyOf'), (o: any) => o['$ref'] || o['type']);
}

export function checkForDependency(userPropertyData: object[], allRefList: string[]): string[] {
  if (userPropertyData.length === 0) {
    if (!_.includes(allRefList, 'null')) {
      return _.map(allRefList, removeRefSuffix);
    }
  }
  return [];
}

type dataObject = {
  uuid: string;
  type_name: string;
  model_name: string;
};

type filterDataToValidateType = {
  uuid: string;
  [key: string]: string | dataObject | null;
};

export function filterDataToValidate(data: filterDataToValidateType): filterDataToValidateType {
  return _.mapValues(data, function (o: string | dataObject) {
    return o !== null && typeof o === 'object' ? { uuid: o.uuid, type: o.type_name, name: o.model_name } : o;
  });
}

function deepSearch(property: any, deletePropertyUUID: string): any {
  const jsonStr = _.get(property, 'json_str');
  if (_.isObject(jsonStr)) {
    for (let key in jsonStr) {
      if (jsonStr[key] === deletePropertyUUID) {
        return property;
      } else if (_.isObject(jsonStr[key]) || _.isArray(jsonStr[key])) {
        let result = deepSearch({ json_str: jsonStr[key] }, deletePropertyUUID);
        if (result) {
          return result;
        }
      }
    }
  }
  return null;
}

export function dependsOnProperty(allUserProperties: any[], deletePropertyUUID: string): string {
  const property = _.find(allUserProperties, (property: { json_str: any }) => deepSearch(property, deletePropertyUUID));
  return property ? property.json_str.name : '';
}

export const getSecretUpdateFormSubmitValues = (formData: any, updateExistingModel: any) => {
  const newFormData = _.cloneDeep(formData);
  const isSectetAPIKeyValueIsUpdated = formData.api_key !== updateExistingModel.api_key;
  return isSectetAPIKeyValueIsUpdated ? newFormData : _.omit(formData, ['api_key']);
};

export const getSecretUpdateValidationURL = (validationURL: string, updateExistingModel: any) => {
  return validationURL.replace('/validate', `/${updateExistingModel.uuid}/validate`);
};

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
