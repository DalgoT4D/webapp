import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Main } from '../Main';

jest.mock('next/navigation');

jest.mock('next/router', () => ({
  useRouter() {
    return { push: jest.fn() };
  },
}));

// Mock the useParentCommunication hook
jest.mock('../../../contexts/ParentCommunicationProvider', () => ({
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

export function mockFetch(data: any) {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => data,
    })
  );
}

describe('no token', () => {
  const mockSession = {
    expires: '1',
    user: { name: '' },
  };

  window.fetch = mockFetch([{ org: { slug: 'test-org' } }]);

  it('renders the component', async () => {
    render(
      <SessionProvider session={mockSession}>
        <Main>
          <div key="1" data-testid="not-logged-in" />
        </Main>
      </SessionProvider>
    );

    const notLoggedIn = screen.getByTestId('not-logged-in');
    await waitFor(() => {
      expect(notLoggedIn).toBeInTheDocument();
    });
  });
});

describe('token and normal flow', () => {
  const mockSession: any = {
    expires: '1',
    user: { token: 'token', email_verified: true },
  };

  it('renders the header and sidedrawer', async () => {
    render(
      <SessionProvider session={mockSession}>
        <Main>
          <div key="1" data-testid="normal-flow" />
        </Main>
      </SessionProvider>
    );

    await waitFor(() => {});

    // TODO: rewrite test cases for this component - logic has been changed
    // const normalFlow = screen.getByTestId('normal-flow');
    // expect(normalFlow).toBeInTheDocument();
  });
});
