import React, { useMemo } from 'react';
import { ListOfSchemas, Schema } from '../../interfaces/BuildPageInterfacesNew';
import { useFormLogic } from './useFormLogic';
import { FormField } from './FormField';

interface DynamicFormProps {
  propertySchemasList: ListOfSchemas;
  addOrUpdateModel: string;
  setAddOrUpdateModel: React.Dispatch<React.SetStateAction<string | null>>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  propertySchemasList,
  addOrUpdateModel,
  setAddOrUpdateModel,
}) => {
  const { form, schema, handleCancel } = useFormLogic(propertySchemasList, addOrUpdateModel, setAddOrUpdateModel);

  const formFields = useMemo(() => {
    if ('json_schema' in schema) {
      return Object.entries(schema.json_schema.properties).map(([key, property]: [string, any]) => {
        if (key === 'uuid') {
          return null;
        }

        return (
          <form.Field
            key={key}
            name={key}
            children={(field) => <FormField field={field} property={property} fieldKey={key} />}
            validators={{
              onChange: ({ value }) => undefined,
            }}
          />
        );
      });
    } else {
      return null;
    }
  }, [schema, form]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {formFields}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <div className='col-span-full mt-7'>
            <div className='float-right'>
              <button
                className='rounded-md px-3.5 py-2.5 text-sm border border-airt-error text-airt-primary hover:bg-opacity-10 hover:bg-airt-error shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                type='reset'
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                data-testid='form-submit-button'
                type='submit'
                className={`ml-3 rounded-md px-3.5 py-2.5 text-sm bg-airt-primary text-airt-font-base hover:bg-opacity-85 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  !canSubmit ? 'cursor-not-allowed disabled' : ''
                }`}
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      />
    </form>
  );
};
