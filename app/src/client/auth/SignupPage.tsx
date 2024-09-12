import { AuthWrapper } from './authWrapper';
import imgUrl from '../static/logo.png';
import { State, LoginForm } from './LoginPage';
import { useHistory } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { useEffect } from 'react';

export function Signup() {
  const history = useHistory();

  const { data: user } = useAuth();

  useEffect(() => {
    if (user) {
      history.push('/build');
    }
  }, [user, history]);

  return (
    <AuthWrapper>
      <LoginForm logo={imgUrl} state={State.Signup} />
    </AuthWrapper>
  );
}
