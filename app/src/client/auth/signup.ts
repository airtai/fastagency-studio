import { api, handleApiError } from 'wasp/client/api';

export default async function signup(userFields: { username: string; password: string }): Promise<void> {
  try {
    await api.post('/auth/username/signup', userFields);
  } catch (error: any) {
    handleApiError(error);
  }
}
