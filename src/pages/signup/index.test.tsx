import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Signup from './index';
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

describe('tests for the signup page', () => {
  it('renders the form', () => {
    const mockSession: Session = {
      expires: '1',
      user: { email: 'a', name: 'Delta', image: 'c' },
    };

    render(
      <SessionProvider session={mockSession}>
        <Signup />
      </SessionProvider>
    );

    const username = screen.getByTestId('username');
    expect(username).toBeInTheDocument();
    const password = screen.getByTestId('password');
    expect(password).toBeInTheDocument();
    const confirmpassword = screen.getByTestId('confirmpassword');
    expect(confirmpassword).toBeInTheDocument();
    const signupcode = screen.getByTestId('signupcode');
    expect(signupcode).toBeInTheDocument();
    const submitbutton = screen.getByTestId('submitbutton');
    expect(submitbutton).toBeInTheDocument();
  });
});
