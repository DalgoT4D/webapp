import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SideDrawer } from '../SideDrawer';
import { getSideMenu } from '@/config/menu';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';

// Mock ProductWalk component
jest.mock('../../ProductWalk/ProductWalk', () => ({
  ProductWalk: () => <div data-testid="mocked-product-walk" />,
}));

// Mock fetchTransformType from pipeline transform
const mockFetchTransformType = jest.fn().mockResolvedValue({ transform_type: 'ui' });
jest.mock('@/pages/pipeline/transform', () => ({
  fetchTransformType: jest.fn().mockImplementation(() => mockFetchTransformType()),
}));

const sideMenu = getSideMenu({ transformType: 'ui' });
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockGlobalContextValue: any = {
  Permissions: { state: ['permission1', 'can_view_pipeline_overview'] },
  CurrentOrg: { state: { is_demo: true } },
  UnsavedChanges: { state: false },
};

// Mock session data
const mockSession = {
  data: {
    user: {
      token: 'test-token',
      email_verified: true,
    },
  },
  status: 'authenticated',
  expires: '2023-01-01',
};

describe('SideDrawer', () => {
  const mockedUseRouter: any = useRouter;
  const setOpenMenu = jest.fn();
  const pushMock = jest.fn();

  beforeEach(async () => {
    mockedUseRouter.mockReturnValue({
      pathname: '/',
      push: pushMock,
    });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <GlobalContext.Provider value={mockGlobalContextValue}>
            <SideDrawer openMenu={true} setOpenMenu={setOpenMenu} />
          </GlobalContext.Provider>
        </SessionProvider>
      );
    });

    // Wait for the loading state to finish
    await waitFor(() => {
      expect(mockFetchTransformType).toHaveBeenCalled();
    });

    const sideMenuList = screen.getByTestId('side-menu');
    expect(sideMenuList).toBeInTheDocument();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('checks the side menu is defined and has menu-list', () => {
    expect(sideMenu).toBeDefined();
    expect(sideMenu.length).toBeGreaterThan(0);
  });

  it('renders fixed menu-items correctly', async () => {
    const documentationLink = await screen.findByTestId('documentation');
    expect(documentationLink).toBeInTheDocument();

    const privacyPolicyLink = await screen.findByTestId('privacypolicy');
    expect(privacyPolicyLink).toBeInTheDocument();
  });

  it('should render all side menu items which are not hidden', async () => {
    await waitFor(() => {
      sideMenu
        .filter((item) => !item.hide && item.parent === undefined)
        .forEach((item) => {
          if (item.index) {
            const menuItem = screen.getByTestId(`menu-item-${item.index}`);
            expect(menuItem).toBeInTheDocument();
          }
        });
    });
  });

  it('should handle menu item click and navigation', async () => {
    const itemToTest = sideMenu.find((item) => item.path === '/pipeline');
    if (itemToTest && !itemToTest.hide) {
      const menuItem = await screen.findByTestId(`menu-item-1`);
      expect(menuItem).toBeInTheDocument();
      const menuLink = within(menuItem).getByTestId('listButton');
      expect(menuLink).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(menuLink);
      });

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/pipeline');
      });
    }
  });

  it('should render child items when expanded or vice versa', async () => {
    const toggleSwitch = await screen.findByTestId(`expand-toggle-1`);
    expect(toggleSwitch).toBeInTheDocument();

    expect(screen.queryByTestId('menu-item-1.1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('menu-item-1.2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('menu-item-1.3')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggleSwitch);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('menu-item-1.1')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-1.2')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-1.3')).toBeInTheDocument();
    });
  });

  it('should handle menu item click and close drawer when item has minimize flag', async () => {
    const minimizedMenu = sideMenu.find((item) => item.minimize && !item.hide);
    if (minimizedMenu) {
      expect(minimizedMenu).toBeDefined();

      if (minimizedMenu) {
        const menuItem = await screen.findByTestId(`menu-item-${minimizedMenu.index}`);
        const menuList = within(menuItem).getByTestId(`listButton`);

        await act(async () => {
          fireEvent.click(menuList);
        });

        expect(setOpenMenu).toHaveBeenCalledWith(false);
      }
    }
  });
});
