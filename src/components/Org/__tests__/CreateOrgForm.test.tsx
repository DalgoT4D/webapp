import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
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
  const mockSession = {
    data: {
      expires: 'false',
      user: { email: 'a' },
    },
  };
  const mockRouter = { refresh: jest.fn() };
  const mockGlobalContext = {
    Permissions: {
      state: [],
      dispatch: jest.fn(),
    },
    Toast: { showToast: jest.fn() },
    CurrentOrg: null,
    OrgUsers: [],
    UnsavedChanges: { hasUnsavedChanges: false, setHasUnsavedChanges: jest.fn() },
  };

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
  it('submits the form correctly and handles the response', async () => {
    const closeSideMenu = jest.fn();
    const setShowForm = jest.fn();
    // Mock the response for httpPost
    httpPost.mockResolvedValueOnce({ slug: 'new-org-slug' });

    // Render the component
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <CreateOrgForm closeSideMenu={closeSideMenu} showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    // Fill in the organization name
    const inputOrgDiv = screen.getByTestId('input-orgname');
    const inputOrg = within(inputOrgDiv).getByRole('textbox');
    fireEvent.change(inputOrg, { target: { value: 'New Org' } });

    // Select base plan
    const basePlanAutoComplete = screen.getByTestId('baseplan');
    const basePlanTextInput = within(basePlanAutoComplete).getByRole('combobox');
    basePlanAutoComplete.focus();
    await fireEvent.change(basePlanTextInput, {
      target: { value: 'Dalgo' },
    });
    fireEvent.keyDown(basePlanAutoComplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(basePlanAutoComplete, { key: 'Enter' }));

    // Select superset included
    const supersetIncludedAutoComplete = screen.getByTestId('superset_included');
    const supersetIncludedValue = within(supersetIncludedAutoComplete).getByRole('combobox');
    supersetIncludedAutoComplete.focus();
    await fireEvent.change(supersetIncludedValue, {
      target: { value: 'Yes' },
    });
    fireEvent.keyDown(supersetIncludedAutoComplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(supersetIncludedAutoComplete, { key: 'Enter' }));

    // Select duration
    const selectDurationAutoComplete = screen.getByTestId('duration');
    const selectDurationInput = within(selectDurationAutoComplete).getByRole('combobox');
    selectDurationAutoComplete.focus();
    await fireEvent.change(selectDurationInput, {
      target: { value: 'Monthly' },
    });
    fireEvent.keyDown(selectDurationAutoComplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(selectDurationAutoComplete, { key: 'Enter' }));

    // Select start date
    const startDateInput = screen.getByTestId('startDate').querySelector('input');

    if (startDateInput) {
      await act(async () => {
        fireEvent.input(startDateInput, { target: { value: '2024-01-01' } });
      });
    }

    // End date
    const endDateInput = screen.getByTestId('endDate').querySelector('input');

    if (endDateInput) {
      await act(async () => {
        fireEvent.input(endDateInput, { target: { value: '2024-02-01' } });
      });
    }
    // Submit the form
    fireEvent.click(screen.getByTestId('savebutton'));
    // Verify the API call
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession.data, 'v1/organizations/', {
        name: 'New Org',
        base_plan: 'Dalgo',
        email: '',
        subscription_duration: 'Monthly',
        can_upgrade_plan: false,
        superset_included: true,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-02-01T00:00:00.000Z',
      });
    });

    // Verify form cleanup and navigation
    await waitFor(() => {
      expect(localStorage.getItem('org-slug')).toBe('new-org-slug');
      expect(closeSideMenu).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
      expect(successToast).toHaveBeenCalledWith(
        'Organization created successfully!',
        [],
        expect.anything()
      );
    });
  });

  it('submits the form correctly and handles the response when trial is free trial', async () => {
    const closeSideMenu = jest.fn();
    const setShowForm = jest.fn();
    // Mock the response for httpPost
    (httpPost as jest.Mock).mockResolvedValueOnce({ slug: 'new-org-slug' });

    // Render the component
    renderComponent({ closeSideMenu, setShowForm });

    // Fill in the organization name
    const inputOrgDiv = screen.getByTestId('input-orgname');
    const inputOrg = within(inputOrgDiv).getByRole('textbox');
    fireEvent.change(inputOrg, { target: { value: 'New Org' } });

    // Select Free Trial plan - using the more reliable way
    const basePlanAutoComplete = screen.getByTestId('baseplan');
    const basePlanTextInput = within(basePlanAutoComplete).getByRole('combobox');

    // Open dropdown and select Free Trial
    await act(async () => {
      basePlanAutoComplete.focus();
      fireEvent.change(basePlanTextInput, { target: { value: 'Free Trial' } });
      fireEvent.keyDown(basePlanAutoComplete, { key: 'ArrowDown' });
      fireEvent.keyDown(basePlanAutoComplete, { key: 'Enter' });
    });

    // Wait for and fill in email input that should appear
    await waitFor(() => {
      const inputEmailDiv = screen.getByTestId('input-email');
      const inputEmail = within(inputEmailDiv).getByRole('textbox');
      fireEvent.change(inputEmail, { target: { value: 'test@example.com' } });
    });

    // Select superset included
    const supersetIncludedAutoComplete = screen.getByTestId('superset_included');
    const supersetIncludedValue = within(supersetIncludedAutoComplete).getByRole('combobox');
    await act(async () => {
      supersetIncludedAutoComplete.focus();
      fireEvent.change(supersetIncludedValue, { target: { value: 'Yes' } });
      fireEvent.keyDown(supersetIncludedAutoComplete, { key: 'ArrowDown' });
      fireEvent.keyDown(supersetIncludedAutoComplete, { key: 'Enter' });
    });

    // Note: Duration should automatically be set to 'Trial' for Free Trial plan

    // Select start date
    const startDateInput = screen.getByTestId('startDate').querySelector('input');
    if (startDateInput) {
      await act(async () => {
        fireEvent.input(startDateInput, { target: { value: '2024-01-01' } });
      });
    }

    // End date
    const endDateInput = screen.getByTestId('endDate').querySelector('input');
    if (endDateInput) {
      await act(async () => {
        fireEvent.input(endDateInput, { target: { value: '2024-02-01' } });
      });
    }

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByTestId('savebutton'));
    });

    // Verify the API call with correct Free Trial values
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession.data, 'v1/organizations/', {
        name: 'New Org',
        base_plan: 'Free Trial',
        email: 'test@example.com',
        subscription_duration: 'Trial',
        can_upgrade_plan: true,
        superset_included: true,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-02-01T00:00:00.000Z',
      });
    });

    // Verify form cleanup and navigation
    await waitFor(() => {
      expect(localStorage.getItem('org-slug')).toBe('new-org-slug');
      expect(closeSideMenu).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
      expect(successToast).toHaveBeenCalledWith(
        'Organization created successfully!',
        [],
        expect.anything()
      );
    });
  });
});
