import { renderInContext } from 'wasp/client/test';
import { test, expect, describe, vi, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';

import { useAuth } from 'wasp/client/auth';

import App from '../App';

// vi.mock('wasp/client/auth', async (importOriginal) => {
//   const mod = await importOriginal<typeof import('wasp/client/operations')>();
//   return {
//     ...mod,
//     useAuth: vi
//       .fn()
//       .mockResolvedValue([
//         { id: 1, isSignUpComplete: true, lastActiveTimestamp: new Date() },
//       ]),
//   };
// });
const mocks = vi.hoisted(() => {
  return {
    useAuth: vi.fn(),
  };
});

vi.mock('wasp/client/auth', () => {
  return {
    useAuth: mocks.useAuth,
  };
});

describe('App', () => {
  // afterEach(() => {
  //   vi.resetAllMocks();
  // });

  test('renders App component', async () => {
    const mockUser = {
      data: { id: 1, isSignUpComplete: true, lastActiveTimestamp: new Date() },
      isError: false,
      isLoading: false,
    };
    mocks.useAuth.mockResolvedValue(mockUser);
    renderInContext(<App children={<div>Test</div>} />);

    await screen.findByText('Test');

    screen.debug();
    mocks.useAuth.mockRestore();
  });
});
