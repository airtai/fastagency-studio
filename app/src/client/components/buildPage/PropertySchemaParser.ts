import { ListOfSchemas, Schema } from '../../interfaces/BuildPageInterfacesNew';

type UserFlow = 'update_model' | 'add_model';

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

  constructor(propertySchemas: ListOfSchemas) {
    this.propertySchemas = propertySchemas;
    this.userFlow = 'add_model';
    this.activeModel = null;
    this.propertyName = propertySchemas.name;
  }

  getSchemaForModel(model: string): Schema | undefined {
    return this.propertySchemas.schemas.find((s) => s.name === model);
  }

  getDefaultValues(schema: Schema): { [key: string]: any } {
    const defaultValues: { [key: string]: any } = {};
    if ('json_schema' in schema) {
      Object.entries(schema.json_schema.properties).forEach(([key, property]: [string, any]) => {
        defaultValues[key] = property.default || '';
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
}
