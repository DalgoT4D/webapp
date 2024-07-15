import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
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
    const sideMenu = screen.getByTestId('side-menu');
    expect(sideMenu).toBeInTheDocument();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('checks the side menu is defined and has menu-list', () => {
    expect(sideMenu).toBeDefined();
    expect(sideMenu.length).toBeGreaterThan(0);
  });

  //perfect
  it('renders fixed menu-itmes correctly', () => {
    const documentationLink = screen.getByText('Documentation');
    expect(documentationLink).toBeInTheDocument();

    const privacyPolicyLink = screen.getByText('Privacy Policy');
    expect(privacyPolicyLink).toBeInTheDocument();
  });

  //perfect
  it('should render all side menu items which are not hidden', () => {
    sideMenu
      .filter((item) => !item.hide)
      .forEach((item) => {
        const menuItem = screen.getByTestId(`menu-item-${item.index}`);
        expect(menuItem).toBeInTheDocument();
      });
  });

  //perfect
  it('should handle menu item click and navigation', async () => {
    const menuItem = screen.getByTestId('menu-item-2');
    expect(menuItem).toBeInTheDocument();
    const menuLink = within(menuItem).getByTestId('listButton');
    expect(menuLink).toBeInTheDocument();
    fireEvent.click(menuLink);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/pipeline'));
  });

  it('should render child items when expanded or vice versa', async () => {
    const toggleSwitch = screen.getByTestId(`expand-toggle-2`);
    expect(toggleSwitch).toBeInTheDocument();
    expect(screen.getByText('Ingest')).toBeInTheDocument();
    expect(screen.getByText('Transform')).toBeInTheDocument();
    expect(screen.getByText('Orchestrate')).toBeInTheDocument();

    fireEvent.click(toggleSwitch);

    await waitFor(() => {
      expect(screen.queryByText('Ingest')).not.toBeInTheDocument();
      expect(screen.queryByText('Transform')).not.toBeInTheDocument();
      expect(screen.queryByText('Orchestrate')).not.toBeInTheDocument();
    });

    fireEvent.click(toggleSwitch);

    await waitFor(() => {
      expect(screen.getByText('Ingest')).toBeInTheDocument();
      expect(screen.getByText('Transform')).toBeInTheDocument();
      expect(screen.getByText('Orchestrate')).toBeInTheDocument();
    });
  });

  it('should handle menu item click and close drawer when item has minimize flag', async () => {
    const expandToggle = screen.getByTestId(`expand-toggle-1`);
    expect(expandToggle).toBeInTheDocument();
    const minimizedMenu = sideMenu.find((item) => {
      item.minimize == true && !item.hide;
    });
    if (minimizedMenu) {
      const menuItem = screen.getByTestId(`menu-item-${minimizedMenu.index}`);
      fireEvent.click(menuItem);
      expect(setOpenMenu).toHaveBeenCalledWith(false);
      await waitFor(() => {
        expect(expandToggle).not.toBeInTheDocument();
      });
    }
  });
});
