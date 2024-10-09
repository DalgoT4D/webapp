import { render, screen } from '@testing-library/react';
import { Login } from '../pages/login/index';
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';

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
