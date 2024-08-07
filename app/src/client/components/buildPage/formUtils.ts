import { Schema } from '../../interfaces/BuildPageInterfacesNew';

export function getDefaultValues(schema: Schema | {}) {
  const defaultValues: { [key: string]: any } = {};

  if ('json_schema' in schema) {
    Object.entries(schema.json_schema.properties).forEach(([key, property]: [string, any]) => {
      defaultValues[key] = property.default || '';
    });
  }
  return defaultValues;
}

type ValidationError = {
  type: string;
  loc: string[];
  msg: string;
  input: any;
  url: string;
  ctx?: any;
};

type ErrorOutput = { [key: string]: string };

export function parseValidationErrors(errors: ValidationError[]): ErrorOutput {
  const result: ErrorOutput = {};
  errors.forEach((error) => {
    const key = error.loc[error.loc.length - 1]; // Using the last item in 'loc' array as the key
    result[key] = error.msg;
  });
  return result;
}
