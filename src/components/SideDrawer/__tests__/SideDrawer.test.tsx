import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SideDrawer } from '../SideDrawer';
import { sideMenu } from '@/config/menu';
import { useRouter } from 'next/router';

const push = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      pathname: '/',
      push,
    };
  },
}));

const mockGlobalContextValue = {
  Permissions: { state: ['permission1', 'permission2'] },
  CurrentOrg: { state: { is_demo: true } },
};


describe('SideDrawer', () => {
  expect(sideMenu).toBeDefined();
  expect(sideMenu.length).toBeGreaterThan(0);

  beforeEach(() => {
    render(
      <GlobalContext.Provider value={mockGlobalContextValue}>
        <SideDrawer openMenu={true} setOpenMenu={jest.fn()} />
      </GlobalContext.Provider>
    );
  });

  it('renders menu-itmes correctly', () => {
    const documentationLink = screen.getByText('Documentation');
    expect(documentationLink).toBeInTheDocument();

    const privacyPolicyLink = screen.getByText('Privacy Policy');
    expect(privacyPolicyLink).toBeInTheDocument();
  });

  it('toggles the child-menu-items correctly', async () => {
    const parentItem = sideMenu.find((item) =>
      sideMenu.some((child) => child.parent === item.index)
    );
    if (parentItem) {
      const expandToggleButton = screen.getByTestId(
        `expand-toggle-${parentItem.index}`
      );
      fireEvent.click(expandToggleButton);

      const childMenuItem = screen.getByTestId(
        `collapse-box-${parentItem.index}`
      );
      expect(childMenuItem).toBeInTheDocument();

      fireEvent.click(expandToggleButton);
      expect(childMenuItem).toHaveStyle('height: 0px');
    }
  });

  it('handles menu item clicks and navigation', () => {
    const menuItem = sideMenu.find((item) =>
     item.index
    );
    if (menuItem) {
      const itemButton = screen.getByTestId(`side-menu-item-${menuItem.index}`);
      fireEvent.click(itemButton);

    
      expect(push).toHaveBeenCalledWith(`${menuItem.path}`);
    }
  });

  // it('disables menu items based on permissions', () => {
  //   // Test disabling menu items based on permissions
  //   const disabledItemButton = screen.getByTestId('disabled-item-button'); // Replace with actual test ID
  //   expect(disabledItemButton).toBeDisabled();
  // });

  // it('renders ProductWalk component when is_demo is true', () => {
  //   // Test rendering of ProductWalk component when is_demo is true
  //   const productWalkComponent = screen.getByTestId('product-walk'); // Replace with actual test ID
  //   expect(productWalkComponent).toBeInTheDocument();
  // });
});
