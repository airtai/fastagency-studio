import { signup } from 'wasp/client/auth';
import { login } from 'wasp/client/auth';

// PRIVATE API
export function useUsernameAndPassword({
  onError,
  onSuccess,
  isLogin,
}: {
  onError: (error: Error) => void;
  onSuccess: () => void;
  isLogin: boolean;
}) {
  async function handleSubmit(data: any) {
    try {
      if (!isLogin) {
        await signup(data);
      }
      await login(data.username, data.password);

      onSuccess();
    } catch (err: unknown) {
      onError(err as Error);
    }
  }

  return {
    handleSubmit,
  };
}
