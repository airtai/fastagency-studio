import React from 'react';
import { render, screen, fireEvent, prettyDOM, waitFor } from '@testing-library/react';
import { renderInContext } from 'wasp/client/test';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Auth, { State } from '../auth/Auth';

// Mock the useHistory hook
vi.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: vi.fn(),
  }),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children, to }: { children: React.ReactNode; to: any }) => <a href={to}>{children}</a>,
}));

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sign up state', () => {
    test('renders Auth component in signup state correctly', () => {
      renderInContext(<Auth state={State.Signup} />);

      expect(screen.getByText('Create an account')).toBeDefined();
      expect(screen.getByTestId('username-label')).toBeDefined();
      expect(screen.getByTestId('password-label')).toBeDefined();
      expect(screen.getAllByRole('button', { name: /sign up/i })).toBeDefined();
      expect(screen.getAllByText(/sign up with google/i)).toBeDefined();
    });

    test('displays error message when form is submitted without input', async () => {
      renderInContext(<Auth state={State.Signup} />);

      const signUpButton = screen.getByTestId('form-submit');
      fireEvent.click(signUpButton);

      await waitFor(() => {
        expect(
          screen.getByText("To proceed, please ensure you've accepted our Terms & Conditions and Privacy Policy.")
        ).toBeDefined();
      });
    });

    test('displays error when form is filled and submitted without checking ToS', async () => {
      renderInContext(<Auth state={State.Signup} />);

      const usernameInput = screen.getByTestId('username');
      const passwordInput = screen.getByTestId('password');
      const signUpButton = screen.getByTestId('form-submit');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signUpButton);

      await waitFor(() => {
        expect(
          screen.getByText("To proceed, please ensure you've accepted our Terms & Conditions and Privacy Policy.")
        ).toBeDefined();
      });
    });

    test('displays error when form is not filled and submitted with checking ToS', async () => {
      renderInContext(<Auth state={State.Signup} />);

      const usernameInput = screen.getByTestId('username');
      const tocCheckbox = screen.getByTestId('toc-checkbox');
      const signUpButton = screen.getByTestId('form-submit');

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.click(tocCheckbox);

      expect(tocCheckbox).toBeChecked();

      fireEvent.click(signUpButton);

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
        expect(screen.queryByText('Password is required')).toBeInTheDocument();
      });
    });
  });

  describe('Log in state', () => {
    test('renders Auth component in login state correctly', () => {
      renderInContext(<Auth state={State.Login} />);

      expect(screen.getByText('Sign in to your account')).toBeDefined();
      expect(screen.getByTestId('username-label')).toBeDefined();
      expect(screen.getByTestId('password-label')).toBeDefined();
      expect(screen.getAllByRole('button', { name: /sign in/i })).toBeDefined();
      expect(screen.getAllByText(/sign in with google/i)).toBeDefined();

      const tocCheckbox = screen.queryByTestId('toc-checkbox');
      expect(tocCheckbox).toBeNull();
    });

    test('displays error message when form is submitted without input', async () => {
      renderInContext(<Auth state={State.Login} />);

      const signUpButton = screen.getByTestId('form-submit');
      fireEvent.click(signUpButton);

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).toBeInTheDocument();
        expect(screen.queryByText('Password is required')).toBeInTheDocument();
      });

      const usernameInput = screen.getByTestId('username');
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.click(signUpButton);

      await waitFor(() => {
        expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
        expect(screen.queryByText('Password is required')).toBeInTheDocument();
      });
    });
  });
});
