import { ListOfSchemas, Schema } from '../../interfaces/BuildPageInterfacesNew';

type UserFlow = 'update_model' | 'add_model';

export class PropertySchemaParser {
  // this class should take only the schema for the property (secret, llm) in the init
  private readonly propertySchemas: ListOfSchemas;
  private userFlow: UserFlow;

  constructor(propertySchemas: ListOfSchemas) {
    this.propertySchemas = propertySchemas;
    this.userFlow = 'add_model';
  }

  getSchemaForModel(model: string): Schema | {} {
    // check if model is in this.propertySchemas.schema
    const schema: Schema | undefined = this.propertySchemas.schemas.find((s) => s.name === model);
    if (schema) {
      return schema;
    }
    return {};
  }

  getUserFlow(): string {
    return this.userFlow;
  }
}
