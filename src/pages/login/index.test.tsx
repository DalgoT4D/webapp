import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from './index';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

describe('tests for the login page', () => {
  it('renders the form', () => {
    const mockSession: Session = {
      expires: '1',
      user: { email: 'a', name: 'Delta', image: 'c' },
    };

    render(
      <SessionProvider session={mockSession}>
        <Login />
      </SessionProvider>
    );

    const username = screen.getByTestId('username');
    expect(username).toBeInTheDocument();
    const password = screen.getByTestId('password');
    expect(password).toBeInTheDocument();
    const submitbutton = screen.getByTestId('submitbutton');
    expect(submitbutton).toBeInTheDocument();
  });
});
