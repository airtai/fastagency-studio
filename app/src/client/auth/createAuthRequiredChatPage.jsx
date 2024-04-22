import { useAuth } from 'wasp/client/auth';

import React from 'react';
import { Redirect } from 'react-router-dom';

import LoadingComponent from '../components/LoadingComponent';

const createAuthRequiredChatPage = (Page) => {
  return (props) => {
    const { data: user, isError, isSuccess, isLoading } = useAuth();
    if (isSuccess) {
      if (user) {
        const redirectUrl = localStorage.getItem('fastagency:redirectUrl');
        if (redirectUrl) {
          localStorage.removeItem('fastagency:redirectUrl');
          window.location.href = redirectUrl;
          // return <Page {...props} user={user} redirectUrl={redirectUrl} />;
        } else {
          return <Page {...props} user={user} />;
        }
      } else {
        localStorage.setItem('fastagency:redirectUrl', window.location.pathname + window.location.search);
        return <Redirect to='/login' />;
      }
    } else if (isLoading) {
      return <LoadingComponent />;
    } else if (isError) {
      return (
        <>
          <Page {...props} user={user} />
        </>
      );
    } else {
      return (
        <>
          <Page {...props} user={user} />
        </>
      );
    }
  };
};

export default createAuthRequiredChatPage;
