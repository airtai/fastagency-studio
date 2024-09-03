import { useContext, useState, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import { styled } from './configs/stitches.config';
import { AuthContext } from './Auth';
import config from './configs/config';
import TosAndMarketingEmails from '../components/TosAndMarketingEmails';
import { State } from './Auth';
import { Link } from 'wasp/client/router';
import { Form, FormInput, FormItemGroup, FormLabel, FormError, FormTextarea, SubmitButton } from './Form';

import type { AdditionalSignupFields, AdditionalSignupField, AdditionalSignupFieldRenderFn, FormState } from './types';

import { useUsernameAndPassword } from './useUsernameAndPassword';
import { useHistory } from 'react-router-dom';

const SocialAuth = styled('div', {
  marginTop: '1.5rem',
  marginBottom: '1.5rem',
});

const SocialAuthButtons = styled('div', {
  marginTop: '0.5rem',
  display: 'flex',

  variants: {
    direction: {
      horizontal: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(48px, 1fr))',
      },
      vertical: {
        flexDirection: 'column',
        margin: '8px 0',
      },
    },
    gap: {
      small: {
        gap: '4px',
      },
      medium: {
        gap: '8px',
      },
      large: {
        gap: '16px',
      },
    },
  },
});

const googleSignInUrl = `${config.apiUrl}/auth/google/login`;

export const checkBoxErrMsg = {
  title: "To proceed, please ensure you've accepted our Terms & Conditions and Privacy Policy.",
  description: '',
};

export type LoginSignupFormFields = {
  [key: string]: string;
};

export const LoginSignupForm = ({
  state,
  socialButtonsDirection = 'horizontal',
  additionalSignupFields,
  errorMessage,
}: {
  state: 'login' | 'signup';
  socialButtonsDirection?: 'horizontal' | 'vertical';
  additionalSignupFields?: any;
  errorMessage?: any;
}) => {
  const { isLoading, setErrorMessage, setSuccessMessage, setIsLoading } = useContext(AuthContext);
  const [tocChecked, setTocChecked] = useState(false);
  const [marketingEmailsChecked, setMarketingEmailsChecked] = useState(false);
  const [loginFlow, setLoginFlow] = useState(state);

  const isLogin = state === 'login';
  const cta = isLogin ? 'Sign in' : 'Sign up';

  const hookForm = useForm<LoginSignupFormFields>();
  const {
    register,
    formState: { errors },
    handleSubmit: hookFormHandleSubmit,
  } = hookForm;

  useEffect(() => {
    if (tocChecked) {
      setErrorMessage(null);
    }
  }, [tocChecked]);

  const handleTocChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTocChecked(event.target.checked);
  };

  const handleMarketingEmailsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMarketingEmailsChecked(event.target.checked);
  };

  const updateLocalStorage = () => {
    localStorage.removeItem('hasAcceptedTos');
    localStorage.removeItem('hasSubscribedToMarketingEmails');
    localStorage.setItem('hasAcceptedTos', JSON.stringify(tocChecked));
    localStorage.setItem('hasSubscribedToMarketingEmails', JSON.stringify(marketingEmailsChecked));
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, googleSignInUrl: string) => {
    event.preventDefault();
    if (loginFlow === State.Login) {
      updateLocalStorage();
      window.location.href = googleSignInUrl;
    } else {
      if (tocChecked) {
        updateLocalStorage();
        window.location.href = googleSignInUrl;
      } else {
        setErrorMessage(checkBoxErrMsg);
      }
    }
  };
  const history = useHistory();
  const onErrorHandler = (error: any) => {
    setErrorMessage({ title: error.message, description: error.data?.data?.message });
  };

  const googleBtnText = loginFlow === State.Login ? 'Sign in with Google' : 'Sign up with Google';

  const { handleSubmit } = useUsernameAndPassword({
    isLogin,
    onError: onErrorHandler,
    onSuccess() {
      history.push('/build');
    },
  });

  async function onSubmit(data: any) {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await handleSubmit(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {loginFlow === State.Signup && (
        <TosAndMarketingEmails
          tocChecked={tocChecked}
          handleTocChange={handleTocChange}
          marketingEmailsChecked={marketingEmailsChecked}
          handleMarketingEmailsChange={handleMarketingEmailsChange}
          errorMessage={null}
        />
      )}
      <SocialAuth>
        <SocialAuthButtons gap='large' direction={socialButtonsDirection}>
          <button
            className='gsi-material-button'
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleClick(event, googleSignInUrl)}
          >
            <div className='gsi-material-button-state'></div>
            <div className='gsi-material-button-content-wrapper'>
              <div className='gsi-material-button-icon'>
                <svg
                  version='1.1'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 48 48'
                  xmlnsXlink='http://www.w3.org/1999/xlink'
                  style={{ display: 'block' }}
                >
                  <path
                    fill='#EA4335'
                    d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
                  ></path>
                  <path
                    fill='#4285F4'
                    d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
                  ></path>
                  <path
                    fill='#FBBC05'
                    d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
                  ></path>
                  <path
                    fill='#34A853'
                    d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
                  ></path>
                  <path fill='none' d='M0 0h48v48H0z'></path>
                </svg>
              </div>
              <span className='gsi-material-button-contents'>{googleBtnText}</span>
              <span style={{ display: 'none' }}>{googleBtnText}</span>
            </div>
          </button>
        </SocialAuthButtons>
      </SocialAuth>
      <div className='mt-2 mb-5 relative'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-gray-500'></div>
        </div>
        <div className='relative flex justify-center text-sm'>
          <span className='bg-airt-primary px-2'>Or continue with</span>
        </div>
      </div>
      <Form
        onSubmit={(e: any) => {
          e.preventDefault();
          if (loginFlow === State.Signup) {
            if (tocChecked) {
              updateLocalStorage();
              hookFormHandleSubmit(onSubmit)();
            } else {
              setErrorMessage(checkBoxErrMsg);
            }
          } else {
            hookFormHandleSubmit(onSubmit)();
          }
        }}
      >
        <FormItemGroup>
          <FormLabel>Username</FormLabel>
          <FormInput
            {...register('username', {
              required: 'Username is required',
            })}
            type='text'
            disabled={isLoading}
          />
          {errors.username && <FormError>{errors.username.message}</FormError>}
        </FormItemGroup>
        <FormItemGroup>
          <FormLabel>Password</FormLabel>
          <FormInput
            {...register('password', {
              required: 'Password is required',
            })}
            type='password'
            disabled={isLoading}
          />
          {errors.password && <FormError>{errors.password.message}</FormError>}
        </FormItemGroup>
        <AdditionalFormFields
          hookForm={hookForm}
          formState={{ isLoading }}
          additionalSignupFields={additionalSignupFields}
        />
        <FormItemGroup>
          <SubmitButton type='submit' disabled={isLoading}>
            {cta}
          </SubmitButton>
        </FormItemGroup>
      </Form>
      <div className='flex items-center justify-center'>
        <span className='text-sm block'>
          {loginFlow === State.Login ? "Don't have an account? " : 'Already have an account? '}
          <Link
            to={loginFlow === State.Login ? '/signup' : '/login'}
            className='no-underline hover:underline cursor-pointer text-airt-secondary'
          >
            {loginFlow === State.Login ? 'Sign up' : 'Sign in'}
          </Link>
        </span>
      </div>
    </>
  );
};

function AdditionalFormFields({
  hookForm,
  formState: { isLoading },
  additionalSignupFields,
}: {
  hookForm: UseFormReturn<LoginSignupFormFields>;
  formState: FormState;
  additionalSignupFields: AdditionalSignupFields;
}) {
  const {
    register,
    formState: { errors },
  } = hookForm;

  function renderField<ComponentType extends React.JSXElementConstructor<any>>(
    field: AdditionalSignupField,
    // Ideally we would use ComponentType here, but it doesn't work with react-hook-form
    Component: any,
    props?: React.ComponentProps<ComponentType>
  ) {
    return (
      <FormItemGroup key={field.name}>
        <FormLabel>{field.label}</FormLabel>
        <Component {...register(field.name, field.validations)} {...props} disabled={isLoading} />
        {errors[field.name] && <FormError>{errors[field.name]!.message}</FormError>}
      </FormItemGroup>
    );
  }

  if (areAdditionalFieldsRenderFn(additionalSignupFields)) {
    return additionalSignupFields(hookForm, { isLoading });
  }

  return (
    additionalSignupFields &&
    additionalSignupFields.map((field) => {
      if (isFieldRenderFn(field)) {
        return field(hookForm, { isLoading });
      }
      switch (field.type) {
        case 'input':
          return renderField<typeof FormInput>(field, FormInput, {
            type: 'text',
          });
        case 'textarea':
          return renderField<typeof FormTextarea>(field, FormTextarea);
        default:
          throw new Error(`Unsupported additional signup field type: ${field.type}`);
      }
    })
  );
}

function isFieldRenderFn(
  additionalSignupField: AdditionalSignupField | AdditionalSignupFieldRenderFn
): additionalSignupField is AdditionalSignupFieldRenderFn {
  return typeof additionalSignupField === 'function';
}

function areAdditionalFieldsRenderFn(
  additionalSignupFields: AdditionalSignupFields
): additionalSignupFields is AdditionalSignupFieldRenderFn {
  return typeof additionalSignupFields === 'function';
}
