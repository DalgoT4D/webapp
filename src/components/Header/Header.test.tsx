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
