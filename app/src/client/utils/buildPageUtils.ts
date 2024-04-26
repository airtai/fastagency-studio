import { SchemaCategory, ApiResponse } from '../interfaces/BuildPageInterfaces';

export const filerOutComponentData = (data: ApiResponse, componentName: string): SchemaCategory => {
  return data.list_of_schemas.filter((schema: any) => schema.name === componentName)[0];
};

export function capitalizeFirstLetter(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// export function getInitialFormElements(schema: SchemaCategory): {

// }
