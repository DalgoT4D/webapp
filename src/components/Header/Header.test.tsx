import { render, screen } from '@testing-library/react';
import { Header } from './Header'
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';

describe("tests for page header", () => {

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it("checks for signout button", () => {

    const mockSession: Session = {
      expires: '1',
      user: { email: 'a', name: 'Delta', image: 'c' },
    };

    render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    );

    const signoutButton = screen.getByTestId('signout');

    expect(signoutButton).toBeDefined();

  });

  it("shows \"no user\" if no user is logged in", () => {

    const mockSession: Session = {
      user: null
    };

    render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    );

    const userEmail = screen.getByTestId('useremail');

    expect(userEmail).toHaveTextContent("no user");

  });

  it("shows user's password if user is logged in", () => {

    const mockSession: Session = {
      user: { email: 'users-email' }
    };

    render(
      <SessionProvider session={mockSession}>
        <Header />
      </SessionProvider>
    );

    const userEmail = screen.getByTestId('useremail');

    expect(userEmail).toHaveTextContent("users-email");

  });

});