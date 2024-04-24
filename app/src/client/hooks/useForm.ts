import { useState, useEffect } from 'react';
import { JsonSchema, Model } from '../interfaces/ModelInterfaces';

interface UseFormProps {
  jsonSchema: JsonSchema;
  defaultValues?: Model | null;
}
interface FormData {
  [key: string]: any;
}

function getValueFromModel(model: Model, key: keyof Model): string | undefined {
  return model[key];
}

export const useForm = ({ jsonSchema, defaultValues }: UseFormProps) => {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const initialFormData: FormData = {};
    Object.keys(jsonSchema.properties).forEach((key) => {
      const property = jsonSchema.properties[key];
      if (defaultValues) {
        initialFormData[key] = defaultValues.hasOwnProperty(key)
          ? getValueFromModel(defaultValues, key as keyof Model)
          : '';
      } else {
        if (property.enum && property.enum.length === 1) {
          initialFormData[key] = property.enum[0]; // Auto-set single enum value
        } else {
          initialFormData[key] = property.default ?? ''; // Use default or empty string if no default
        }
      }
    });
    setFormData(initialFormData);
    setFormErrors({}); // Reset errors on schema change
  }, [jsonSchema, defaultValues]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: '' })); // Clear error on change
  };

  return {
    formData,
    handleChange,
    formErrors,
    setFormErrors, // Expose this to allow setting errors from the component
  };
};
