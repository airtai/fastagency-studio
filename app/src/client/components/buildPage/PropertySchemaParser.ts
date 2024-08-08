import _ from 'lodash';

import { ListOfSchemas, Schema } from '../../interfaces/BuildPageInterfacesNew';

export type UserFlow = 'update_model' | 'add_model';

export type SetActiveModelType = (model: string | null) => void;

export interface SelectOption {
  value: string;
  label: string;
}

export interface UserProperties {
  uuid: string;
  user_uuid: string;
  type_name: string;
  model_name: string;
  model_uuid?: string;
  json_str: {
    name: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export class PropertySchemaParser {
  // this class should take only the schema for the property (secret, llm) in the init
  private readonly propertySchemas: ListOfSchemas;
  private userFlow: UserFlow;
  private activeModel: string | null;
  private propertyName: string;
  private activeModelObj: any;
  private schema: Schema | undefined;
  private userProperties: UserProperties[] | null;
  private refFields: { [key: string]: any } = {};

  constructor(propertySchemas: ListOfSchemas) {
    this.propertySchemas = propertySchemas;
    this.propertyName = propertySchemas.name;
    this.userFlow = 'add_model';
    this.activeModel = null;
    this.activeModelObj = null;
    this.userProperties = null;
  }

  private capitalizeWords(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getSchemaForModel(): Schema | undefined {
    if (!this.activeModel) {
      return undefined;
    }

    this.schema = this.propertySchemas.schemas.find((s) => s.name === this.activeModel);
    return this.schema;
  }

  getSchema(): Schema {
    if (this.schema) {
      return this.schema;
    }

    return this.propertySchemas.schemas[0];
  }

  getDefaultValues(): { [key: string]: any } {
    const defaultValues: { [key: string]: any } = {};
    const schema = this.getSchema();
    this.refFields = {}; // Reset refFields

    if ('json_schema' in schema) {
      Object.entries(schema.json_schema.properties).forEach(([key, property]: [string, any]) => {
        const isReferenceField = _.has(property, '$ref');
        if (isReferenceField) {
          // Handle reference fields
          const refType = property.$ref.split('/').pop().replace(/Ref$/, ''); // Extract reference type
          const matchingProperties = this.userProperties?.filter((prop) => prop.model_name === refType) || [];
          const enumValues = matchingProperties.map((prop) => prop.json_str.name);
          const defaultValue = enumValues.length > 0 ? enumValues[0] : null;

          this.refFields[key] = {
            property: matchingProperties,
            htmlForSelectBox: {
              description: '',
              enum: enumValues.length > 0 ? enumValues : null,
              default: defaultValue,
              title: this.capitalizeWords(key),
            },
          };
          defaultValues[key] = defaultValue || '';
        } else {
          // Handle non-reference fields
          if (this.activeModelObj && this.activeModelObj.json_str) {
            defaultValues[key] =
              key in this.activeModelObj.json_str
                ? this.activeModelObj.json_str[key]
                : (property as { default?: any }).default || '';
          } else {
            defaultValues[key] = (property as { default?: any }).default || '';
          }
        }
      });
    }
    return defaultValues;
  }

  getUserFlow(): string {
    return this.userFlow;
  }

  setUserFlow(flow: UserFlow): void {
    this.userFlow = flow;
  }

  getModelNames(): SelectOption[] {
    return this.propertySchemas.schemas.map((s) => ({ value: s.name, label: s.name }));
  }

  getActiveModel(): string | null {
    return this.activeModel;
  }

  setActiveModel(model: string | null): void {
    this.activeModel = model;
  }

  getPropertyName(): string {
    return this.propertyName;
  }

  setPropertyName(name: string): void {
    this.propertyName = name;
  }

  getValidationURL(): string {
    return `models/${this.propertyName}/${this.activeModel}/validate`;
  }

  setActiveModelObj(obj: any): void {
    this.activeModelObj = obj;
  }

  getActiveModelObj(): any {
    return this.activeModelObj;
  }

  getSecretUpdateValidationURL(): string {
    return `models/${this.propertyName}/${this.activeModel}/${this.activeModelObj.uuid}/validate`;
  }

  setUserProperties(o: UserProperties[]): void {
    this.userProperties = o;
  }

  getUserProperties(): UserProperties[] | null {
    return this.userProperties;
  }

  getRefFields(): { [key: string]: any } {
    return this.refFields;
  }
}
