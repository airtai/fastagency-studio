export interface JsonSchema {
  $defs?: { [key: string]: SchemaDefinition };
  properties: { [key: string]: SchemaProperty };
  required?: string[];
  title: string;
  type: string;
}

export interface SchemaDefinition {
  properties: { [key: string]: SchemaProperty };
  required?: string[];
  title: string;
  type: string;
}

interface SchemaProperty {
  description?: string;
  title?: string;
  type?: string;
  format?: string;
  const?: string;
  default?: any;
  enum?: string[];
  allOf?: Array<{ $ref: string }>;
  maxLength?: number;
  minLength?: number;
  anyOf?: SchemaReference[];
  $ref?: string;
}

interface SchemaReference {
  $ref?: string;
  type?: string;
}

export interface ApiSchema {
  name: string;
  json_schema: JsonSchema;
}

export interface SchemaCategory {
  name: string;
  schemas: ApiSchema[];
}

export interface ApiResponse {
  list_of_schemas: SchemaCategory[];
}
