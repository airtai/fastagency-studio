import { validateForm as apiValidateForm } from 'wasp/client/operations';

export const validateForm = async (data: any, validationURL: string) => {
  try {
    const response = await apiValidateForm({ data, validationURL });
    return response;
  } catch (error) {
    throw error;
  }
};
