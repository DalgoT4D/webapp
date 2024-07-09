import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SideDrawer } from '../SideDrawer';
import { sideMenu } from '@/config/menu';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter: any = useRouter;

const mockGlobalContextValue: any = {
  Permissions: { state: ['permission1', 'permission2'] },
  CurrentOrg: { state: { is_demo: true } },
};

describe('SideDrawer', () => {
  const setOpenMenu = jest.fn();
  const push = jest.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({
      pathname: '/',
      push,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  expect(sideMenu).toBeDefined();
  expect(sideMenu.length).toBeGreaterThan(0);

  beforeEach(() => {
    render(
      <GlobalContext.Provider value={mockGlobalContextValue}>
        <SideDrawer openMenu={true} setOpenMenu={setOpenMenu} />
      </GlobalContext.Provider>
    );
    const sideMenu = screen.getByTestId('side-menu'); //this tests the drawer too.
    expect(sideMenu).toBeInTheDocument();
  });

  it('renders fixed menu-itmes correctly', () => {
    const documentationLink = screen.getByText('Documentation');
    expect(documentationLink).toBeInTheDocument();

    const privacyPolicyLink = screen.getByText('Privacy Policy');
    expect(privacyPolicyLink).toBeInTheDocument();
  });

  it('should render all side menu items which are not hidden', () => {
    sideMenu
      .filter((item) => !item.hide)
      .forEach((item) => {
        const menuItem = screen.getByTestId(`menu-item-${item.index}`);
        expect(menuItem).toBeInTheDocument();
      });
  });

  it('should handle menu item click and navigation', async () => {
    sideMenu
      .filter((item) => !item.hide)
      .forEach((item) => {
        const menuItem = screen.getByTestId(`menu-item-${item.index}`);
        fireEvent.click(menuItem);

        waitFor(() => expect(push).toHaveBeenCalledWith(item.path));
        push.mockClear(); // Clear the mock to isolate each click
      });
  });

  it('should expand and collapse submenus', () => {
    sideMenu.filter(item => !item.parent && !item.hide).forEach(item => {
      const expandToggle = screen.queryByTestId(`expand-toggle-${item.index}`);
      if (expandToggle) {
        fireEvent.click(expandToggle);
        const collapseBox = screen.getByTestId(`collapse-box-${item.index}`);
        expect(collapseBox).toBeInTheDocument();
        fireEvent.click(expandToggle); 
        expect(collapseBox).toHaveStyle("height:0px");
      }
    });
  });

  it('should render child menu items when expanded', () => {
    sideMenu.filter(item => !item.parent && !item.hide).forEach(item => {
      const hasChildren = sideMenu.filter(subitem => subitem.parent === item.index && !subitem.hide);
      if (hasChildren.length > 0) {
        const expandToggle = screen.queryByTestId(`expand-toggle-${item.index}`);
        if (expandToggle) {
          fireEvent.click(expandToggle);
          hasChildren.forEach(subitem => {
            const childMenuItem = screen.getByTestId(`menu-item-${subitem.index}`);
            expect(childMenuItem).toBeInTheDocument();
          });
        }
      }
    });
  });

  it('should handle menu item click and close drawer when item has minimize flag', () => {
    sideMenu.forEach(item => {
      if (item.minimize && !item.hide) {
      
        const menuItem = screen.getByText(item.title);
        
        fireEvent.click(menuItem);
        expect(setOpenMenu).toHaveBeenCalledWith(false);
      }
    });
  });
});

