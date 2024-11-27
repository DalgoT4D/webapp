import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SideDrawer } from '../SideDrawer';
import { getSideMenu } from '@/config/menu';
import { useRouter } from 'next/router';
const sideMenu = getSideMenu(4);
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockGlobalContextValue: any = {
  Permissions: { state: ['permission1', 'can_view_dashboard'] },
  CurrentOrg: { state: { is_demo: true } },
  UnsavedChanges: { state: false },
};

describe('SideDrawer', () => {
  const mockedUseRouter: any = useRouter;
  const setOpenMenu = jest.fn();
  const pushMock = jest.fn();
  beforeEach(() => {
    mockedUseRouter.mockReturnValue({
      pathname: '/',
      push: pushMock,
    });
    render(
      <GlobalContext.Provider value={mockGlobalContextValue}>
        <SideDrawer openMenu={true} setOpenMenu={setOpenMenu} />
      </GlobalContext.Provider>
    );
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

  it('renders fixed menu-itmes correctly', () => {
    const documentationLink = screen.getByTestId('documentation');
    expect(documentationLink).toBeInTheDocument();

    const privacyPolicyLink = screen.getByTestId('privacypolicy');
    expect(privacyPolicyLink).toBeInTheDocument();
  });

  it('should render all side menu items which are not hidden', () => {
    sideMenu
      .filter((item) => !item.hide && item.parent === undefined)
      .forEach((item) => {
        if (item.index) {
          const menuItem = screen.getByTestId(`menu-item-${item.index}`);
          expect(menuItem).toBeInTheDocument();
        }
      });
  });

  it('should handle menu item click and navigation', async () => {
    const itemToTest = sideMenu.find((item) => item.path === '/pipeline');
    if (itemToTest && !itemToTest.hide) {
      const menuItem = screen.getByTestId(`menu-item-1`);
      expect(menuItem).toBeInTheDocument();
      const menuLink = within(menuItem).getByTestId('listButton');
      expect(menuLink).toBeInTheDocument();
      fireEvent.click(menuLink);

      await waitFor(() => {
        expect(pushMock).toHaveBeenCalledWith('/pipeline');
      });
    }
  });

  it('should render child items when expanded or vice versa', async () => {
    const toggleSwitch = screen.getByTestId(`expand-toggle-1`);
    expect(toggleSwitch).toBeInTheDocument();

    expect(screen.queryByTestId('menu-item-1.1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('menu-item-1.2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('menu-item-1.3')).not.toBeInTheDocument();
    fireEvent.click(toggleSwitch);

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
        const menuItem = screen.getByTestId(`menu-item-${minimizedMenu.index}`);

        const menuList = within(menuItem).getByTestId(`listButton`);
        fireEvent.click(menuList);

        expect(setOpenMenu).toHaveBeenCalledWith(false);
      }
    }
  });
});
