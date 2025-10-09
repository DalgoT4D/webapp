import { render, screen } from '@testing-library/react';
import { Login } from '../pages/login/index';
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';

// Mock the useParentCommunication hook
jest.mock('../contexts/ParentCommunicationProvider', () => ({
  useParentCommunication: () => ({
    isEmbedded: false,
    parentToken: null,
    parentOrgSlug: null,
    hideHeader: false,
    isReady: false,
    isEmbeddingBlocked: false,
  }),
  ParentCommunicationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('tests for login form', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it('checks the initial render', () => {
    render(
      <SessionProvider session={mockSession}>
        <Login />
      </SessionProvider>
    );

    const form = screen.getByTestId('login-form');
    expect(form).toBeDefined();

    const usernameField = screen.getByTestId('username');
    const passwordField = screen.getByTestId('password');

    expect(usernameField).toBeDefined();
    expect(passwordField).toBeDefined();
  });
});
