import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Main } from '../Main';
import { SessionProvider } from 'next-auth/react';

// ======================================================================
const pushMock1 = jest.fn();
const pushMock2 = jest.fn();
const pushMock3 = jest.fn();
const pushMock4 = jest.fn();
const pushMock5 = jest.fn();

const useRouterMock = jest
  .fn()
  .mockReturnValueOnce({
    push: pushMock1,
    pathname: null,
  })
  .mockReturnValueOnce({
    push: pushMock2,
    pathname: null,
  })
  .mockReturnValueOnce({
    push: pushMock3,
    pathname: '/signup/createorg',
  })
  .mockReturnValueOnce({
    push: pushMock4,
    pathname: '/signup/createorg',
  })
  .mockReturnValue({
    push: pushMock5,
    pathname: '/dashboard',
  });

jest.mock('next/router', () => ({
  useRouter() {
    const urm = useRouterMock();
    return urm;
  },
}));

jest.mock('next/navigation');

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
    expect(useRouterMock).toHaveBeenCalled();
    expect(pushMock1).not.toHaveBeenCalled();
  });
});

// ======================================================================
describe('token but no org', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: 'token', org: null },
  };

  it('renders the component', () => {
    render(
      <SessionProvider session={mockSession}>
        <Main />
      </SessionProvider>
    );

    expect(useRouterMock).toHaveBeenCalled();
    expect(pushMock2).toHaveBeenCalledWith('/signup/createorg');
  });
});

// // ======================================================================
describe('token but no org, creating org', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: 'token', org: null },
  };

  it('renders the component', () => {
    render(
      <SessionProvider session={mockSession}>
        <Main>
          <div key="1" data-testid="creating-org-page" />
        </Main>
      </SessionProvider>
    );

    expect(useRouterMock).toHaveBeenCalled();
    expect(pushMock3).not.toHaveBeenCalled();
    const creatingOrg = screen.getByTestId('creating-org-page');
    expect(creatingOrg).toBeInTheDocument();
  });
});

// // ======================================================================
describe('token and org, on creating-org page', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: 'token', org: 'org' },
  };

  it('renders the component', () => {
    render(
      <SessionProvider session={mockSession}>
        <Main>
          <div key="1" data-testid="creating-org-page" />
        </Main>
      </SessionProvider>
    );

    expect(useRouterMock).toHaveBeenCalled();
    expect(pushMock4).toHaveBeenCalledWith('/');
  });
});

// // ======================================================================
describe('token and org, normal flow', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: 'token', org: 'org' },
  };

  it('renders the component', () => {
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

    expect(useRouterMock).toHaveBeenCalled();
    expect(pushMock5).not.toHaveBeenCalled();
    const normalFlow = screen.getByTestId('normal-flow');
    expect(normalFlow).toBeInTheDocument();
  });
});
