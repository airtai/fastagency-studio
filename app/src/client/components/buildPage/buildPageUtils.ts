import _ from 'lodash';

import { PropertiesSchema, ListOfSchemas } from '../../interfaces/BuildPageInterfaces';

/* These are the function you need*/

export const filerOutComponentData = (propertiesSchema: PropertiesSchema, componentName: string): ListOfSchemas => {
  return propertiesSchema.list_of_schemas.filter((schema: any) => schema.name === componentName)[0];
};

export const capitalizeFirstLetter = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const filterPropertiesByType = (userProperties: any, activeProperty: string) => {
  if (userProperties) {
    const properties = _.filter(userProperties, ['type_name', activeProperty]);
    return _.sortBy(properties, ['created_at']);
  }
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
