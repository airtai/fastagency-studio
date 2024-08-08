import { ListOfSchemas, Schema } from '../../interfaces/BuildPageInterfacesNew';

export type UserFlow = 'update_model' | 'add_model';

export type SetActiveModelType = (model: string | null) => void;

export interface SelectOption {
  value: string;
  label: string;
}

export class PropertySchemaParser {
  // this class should take only the schema for the property (secret, llm) in the init
  private readonly propertySchemas: ListOfSchemas;
  private userFlow: UserFlow;
  private activeModel: string | null;
  private propertyName: string;
  private activeModelObj: any;
  private schema: Schema | undefined;

  constructor(propertySchemas: ListOfSchemas) {
    this.propertySchemas = propertySchemas;
    this.propertyName = propertySchemas.name;
    this.userFlow = 'add_model';
    this.activeModel = null;
    this.activeModelObj = null;
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
    if ('json_schema' in schema) {
      Object.entries(schema.json_schema.properties).forEach(([key, property]: [string, any]) => {
        if (this.activeModelObj && this.activeModelObj.json_str) {
          // If activeModelObj exists and has json_str, use its values
          defaultValues[key] =
            this.activeModelObj.json_str[key] !== undefined
              ? this.activeModelObj.json_str[key]
              : property.default || '';
        } else {
          // If activeModelObj is null or doesn't have json_str, use schema defaults
          defaultValues[key] = property.default || '';
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
}
