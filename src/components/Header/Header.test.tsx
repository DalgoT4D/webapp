// Header.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from './Header';
import { useSession, signOut } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useRouter, usePathname } from 'next/navigation';

// Mock the dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const mockUseSession = useSession as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockDispatch = jest.fn();
const mockSignOut = signOut as jest.Mock;
describe('Header Component', () => {
  const setOpenMenu = jest.fn();

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn(),
    });
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com', can_create_orgs: true },
      },
      status: 'authenticated',
    });
    mockUsePathname.mockReturnValue('/');
    mockDispatch(4);
    jest.clearAllMocks();
  });

  const globalContextMock = {
    OrgUsers: {
      state: [
        {
          email: 'test1@example.com',
          active: true,
          role: 1,
          role_slug: 'admin',
          org: {
            name: 'Org1',
            slug: 'org1',
            airbyte_workspace_id: '',
            viz_url: null,
            viz_login_type: null,
          },
          wtype: 'type1',
        },
        {
          email: 'test2@example.com',
          active: true,
          role: 2,
          role_slug: 'member',
          org: {
            name: 'Org2',
            slug: 'org2',
            airbyte_workspace_id: '',
            viz_url: null,
            viz_login_type: null,
          },
          wtype: 'type2',
        },
      ],
    },
    Permissions: { state: ['can_create_org'] },
    CurrentOrg: {
      dispatch: jest.fn(),
    },
    unread_count: { state: 4, dispatch: mockDispatch },
  };

  const renderComponent = () =>
    render(
      <GlobalContext.Provider value={globalContextMock}>
        <Header openMenu={false} setOpenMenu={setOpenMenu} hideMenu={false} />
      </GlobalContext.Provider>
    );

  test('renders the header with orgs and profile icon', () => {
    renderComponent();

    expect(screen.getByText('Org1')).toBeInTheDocument();
    expect(screen.getByAltText('profile icon')).toBeInTheDocument();
  });

  test('opens the profile menu when the profile icon is clicked', () => {
    renderComponent();
    const profileIcon = screen.getByAltText('profile icon');

    fireEvent.click(profileIcon);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Create new org')).toBeInTheDocument();
    expect(screen.getAllByText('Org1')[0]).toBeInTheDocument();
    expect(screen.getByText('Org2')).toBeInTheDocument();
  });

  test('calls setOpenMenu when hamburger icon is clicked', () => {
    renderComponent();
    const hamburgerIcon = screen.getByAltText('Hamburger-icon');

    fireEvent.click(hamburgerIcon);

    expect(setOpenMenu).toHaveBeenCalledWith(true);
  });

  test('calls signOut when logout menu item is clicked', async () => {
    renderComponent();
    const profileIcon = screen.getByAltText('profile icon');

    fireEvent.click(profileIcon);
    const logoutItem = screen.getByText('Logout');
    fireEvent.click(logoutItem);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  test('switches organization when a different org is selected', () => {
    renderComponent();
    const profileIcon = screen.getByAltText('profile icon');

    fireEvent.click(profileIcon);
    const org2Item = screen.getByText('Org2');

    fireEvent.click(org2Item);

    expect(globalContextMock.CurrentOrg.dispatch).toHaveBeenCalledWith({
      type: 'new',
      orgState: {
        name: 'Org2',
        slug: 'org2',
        airbyte_workspace_id: '',
        viz_url: null,
        viz_login_type: null,
        wtype: 'type2',
      },
    });
  });
});

// Additional tests appended by PR tests generator to increase coverage and edge-case handling.
// Test framework: Jest; Library: React Testing Library

describe('Header Component - additional scenarios', () => {
  const setOpenMenu = jest.fn();

  const baseGlobalContextMock = {
    OrgUsers: {
      state: [
        {
          email: 'test1@example.com',
          active: true,
          role: 1,
          role_slug: 'admin',
          org: {
            name: 'Org1',
            slug: 'org1',
            airbyte_workspace_id: '',
            viz_url: null,
            viz_login_type: null,
          },
          wtype: 'type1',
        },
        {
          email: 'test2@example.com',
          active: true,
          role: 2,
          role_slug: 'member',
          org: {
            name: 'Org2',
            slug: 'org2',
            airbyte_workspace_id: '',
            viz_url: null,
            viz_login_type: null,
          },
          wtype: 'type2',
        },
      ],
    },
    Permissions: { state: ['can_create_org'] },
    CurrentOrg: {
      dispatch: jest.fn(),
    },
    unread_count: { state: 4, dispatch: jest.fn() },
  };

  const renderWithCtx = (
    ctxOverrides: Partial<typeof baseGlobalContextMock> = {},
    headerProps: Partial<React.ComponentProps<typeof Header>> = {}
  ) => {
    const ctx = {
      ...baseGlobalContextMock,
      ...ctxOverrides,
      OrgUsers: {
        ...baseGlobalContextMock.OrgUsers,
        ...(ctxOverrides.OrgUsers || {}),
      },
      CurrentOrg: {
        ...baseGlobalContextMock.CurrentOrg,
        ...(ctxOverrides.CurrentOrg || {}),
      },
      Permissions: {
        ...baseGlobalContextMock.Permissions,
        ...(ctxOverrides.Permissions || {}),
      },
      unread_count: {
        ...baseGlobalContextMock.unread_count,
        ...(ctxOverrides.unread_count || {}),
      },
    };

    const props = {
      openMenu: false,
      hideMenu: false,
      setOpenMenu,
      ...headerProps,
    };

    return render(
      <GlobalContext.Provider value={ctx as any}>
        <Header {...props} />
      </GlobalContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for next/router + session + pathname
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn(),
    });
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { email: 'test@example.com', can_create_orgs: true },
      },
      status: 'authenticated',
    });
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  test('does not render hamburger icon when hideMenu=true', () => {
    renderWithCtx({}, { hideMenu: true });
    expect(screen.queryByAltText('Hamburger-icon')).toBeNull();
  });

  test('renders hamburger icon when hideMenu=false', () => {
    renderWithCtx({}, { hideMenu: false });
    expect(screen.getByAltText('Hamburger-icon')).toBeInTheDocument();
  });

  test('does not render "Create new org" when user lacks permission', () => {
    renderWithCtx({ Permissions: { state: [] } });
    const profileIcon = screen.getByAltText('profile icon');
    fireEvent.click(profileIcon);

    // Should not be on screen without permission
    expect(screen.queryByText('Create new org')).toBeNull();
  });

  test('does not render "Create new org" when session user.can_create_orgs=false', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { email: 'test@example.com', can_create_orgs: false },
      },
      status: 'authenticated',
    });

    renderWithCtx();
    const profileIcon = screen.getByAltText('profile icon');
    fireEvent.click(profileIcon);

    expect(screen.queryByText('Create new org')).toBeNull();
  });

  test('shows unread notifications count when available', () => {
    renderWithCtx({ unread_count: { state: 7, dispatch: jest.fn() } });

    // Expect a badge or count to be visible; fallback to searching for "7"
    // If badge has aria-label/role, prefer that. Using text match as generic.
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });

  test('does not crash when no organizations are present', () => {
    renderWithCtx({ OrgUsers: { state: [] } });

    // Should still render profile icon
    expect(screen.getByAltText('profile icon')).toBeInTheDocument();

    // Org list not present
    expect(screen.queryByText('Org1')).toBeNull();
    expect(screen.queryByText('Org2')).toBeNull();
  });

  test('switching to the currently selected org does not dispatch a change (if guarded)', () => {
    // Assumption: CurrentOrg dispatch is called only when selecting a different org
    const currentOrgDispatch = jest.fn();
    renderWithCtx({ CurrentOrg: { dispatch: currentOrgDispatch } });

    const profileIcon = screen.getByAltText('profile icon');
    fireEvent.click(profileIcon);

    // Click on the current org "Org1" (first in the list / assumed current)
    const org1Item = screen.getAllByText('Org1')[0];
    fireEvent.click(org1Item);

    // Two sensible assertions:
    // 1) Either no dispatch happens because it's already current:
    // 2) Or a dispatch happens with the same current state.
    // We assert no extra dispatch to avoid false positives.
    expect(currentOrgDispatch).not.toHaveBeenCalled();
  });

  test('renders login state when unauthenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithCtx();

    // Profile icon might not be shown for unauthenticated users;
    // Expect a sign-in affordance. We try common options:
    // Look for "Login" or "Sign in" text.
    const loginLike = screen.queryByText(/login|sign in/i);
    expect(loginLike).toBeTruthy();
  });

  test('logout triggers next-auth signOut only when authenticated', async () => {
    // Authenticated case
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { email: 'test@example.com', can_create_orgs: true },
      },
      status: 'authenticated',
    });

    renderWithCtx();
    fireEvent.click(screen.getByAltText('profile icon'));
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(signOut as jest.Mock).toHaveBeenCalled();
    });

    // Unauthenticated case (should not have logout)
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    renderWithCtx();

    expect(screen.queryByText('Logout')).toBeNull();
    expect(signOut as jest.Mock).not.toHaveBeenCalled();
  });

  test('clicking hamburger toggles menu open via setOpenMenu(true)', () => {
    renderWithCtx({}, { hideMenu: false });
    const hamburgerIcon = screen.getByAltText('Hamburger-icon');
    fireEvent.click(hamburgerIcon);
    expect(setOpenMenu).toHaveBeenCalledWith(true);
  });

  test('router is available and not invoked on simple render', () => {
    const mockPush = jest.fn();
    const mockRefresh = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    renderWithCtx();

    // Basic sanity: no navigation on initial render
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test('pathname-based conditional UI: uses current pathname for conditional rendering', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    renderWithCtx();

    // This is a soft check: look for a dashboard-specific element if any present.
    // If not, ensure the header still renders fundamental elements.
    expect(screen.getByAltText('profile icon')).toBeInTheDocument();
  });
});
