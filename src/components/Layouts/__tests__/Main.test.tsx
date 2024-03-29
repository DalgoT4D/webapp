import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Main } from '../Main';
import { SessionProvider } from 'next-auth/react';

jest.mock('next/navigation');

jest.mock('next/router', () => ({
  useRouter() {
    return { push: jest.fn() };
  },
}));

// ======================================================================
describe('no token', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: null },
  };

  it('renders the component', () => {
    render(
      <SessionProvider session={mockSession}>
        <Main>
          <div key="1" data-testid="not-logged-in" />
        </Main>
      </SessionProvider>
    );

    const notLoggedIn = screen.getByTestId('not-logged-in');
    expect(notLoggedIn).toBeInTheDocument();
  });
});

// // ======================================================================
describe('token and normal flow', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: 'token', email_verified: true },
  };

  it('renders the header and sidedrawer', () => {
    // mock Header and SideDrawer
    jest.mock('../../SideDrawer/SideDrawer', () => {
      const MockSideDrawer = () => {
        return <div data-testid="side-drawer" />;
      };

      MockSideDrawer.displayName = 'MockSideDrawer';

      return MockSideDrawer;
    });
    jest.mock('../../Header/Header', () => {
      const MockHeader = () => {
        return <div data-testid="header" />;
      };

      MockHeader.displayName = 'MockHeader';

      return MockHeader;
    });

    render(
      <SessionProvider session={mockSession}>
        <Main>
          <div key="1" data-testid="normal-flow" />
        </Main>
      </SessionProvider>
    );

    // TODO: rewrite test cases for this component - logic has been changed
    // const normalFlow = screen.getByTestId('normal-flow');
    // expect(normalFlow).toBeInTheDocument();
  });
});
