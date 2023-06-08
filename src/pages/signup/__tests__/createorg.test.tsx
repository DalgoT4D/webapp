import { render, screen } from '@testing-library/react';
import { CreateOrg } from '../createorg'
import { SessionProvider } from 'next-auth/react';
import * as nextRouter from 'next/router';

describe("tests for createorg form", () => {

  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  nextRouter.useRouter = jest.fn();
  nextRouter.useRouter.mockImplementation(() => ({ route: '/' }));

  it("checks the initial render", () => {

    render(
      <SessionProvider session={mockSession}>
        <CreateOrg />
      </SessionProvider>
    );

    const form = screen.getByTestId('createorg-form');
    expect(form).toBeDefined();

    const orgnameField = screen.getByTestId('input-orgname');

    expect(orgnameField).toBeDefined();

  });

});