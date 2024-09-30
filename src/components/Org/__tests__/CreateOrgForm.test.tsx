import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '@/contexts/ContextProvider';
import { CreateOrgForm } from '../CreateOrgForm';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('../../../helpers/http');
jest.mock('../../ToastMessage/ToastHelper');

describe('CreateOrgForm Component', () => {
  const mockSession = { data: { user: { name: 'Test User' } } };
  const mockRouter = { refresh: jest.fn() };
  const mockGlobalContext = {};

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (errorToast as jest.Mock).mockImplementation(jest.fn());
    (successToast as jest.Mock).mockImplementation(jest.fn());
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      closeSideMenu: jest.fn(),
      showForm: true,
      setShowForm: jest.fn(),
      ...props,
    };

    return render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <CreateOrgForm {...defaultProps} />
      </GlobalContext.Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
  });

  it('renders form fields correctly', () => {
    renderComponent();
    // expect(screen.getByLabelText(/Organization name/i)).toBeInTheDocument();
    expect(screen.getByTestId('savebutton')).toBeInTheDocument();
    expect(screen.getByTestId('cancelbutton')).toBeInTheDocument();
  });

  it('handles close button click', () => {
    const closeSideMenu = jest.fn();
    const setShowForm = jest.fn();

    renderComponent({ closeSideMenu, setShowForm });

    fireEvent.click(screen.getByTestId('cancelbutton'));

    expect(closeSideMenu).toHaveBeenCalled();
    expect(setShowForm).toHaveBeenCalledWith(false);
  });

  it('validates required fields', async () => {
    renderComponent();

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(screen.getByText(/Organization name is required/i)).toBeInTheDocument();
    });
  });
  it('should handle form submission and display success toast', async () => {
    // Arrange
    httpPost.mockResolvedValueOnce({ slug: 'new-org-slug' });

    const closeSideMenu = jest.fn();
    const setShowForm = jest.fn();
    const { getByTestId, getByLabelText } = render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <CreateOrgForm closeSideMenu={closeSideMenu} showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    // Act
    const inputOrgDiv = screen.getByTestId('input-orgname');
    const inputOrg = within(inputOrgDiv).getByRole('textbox');
    fireEvent.change(inputOrg, { target: { value: 'New Org' } });
    fireEvent.click(getByTestId('savebutton'));

    // Assert
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith({ user: { name: 'Test User' } }, 'v1/organizations/', {
        name: 'New Org',
      });
      expect(localStorage.getItem('org-slug')).toBe('new-org-slug');
      expect(closeSideMenu).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });
});
