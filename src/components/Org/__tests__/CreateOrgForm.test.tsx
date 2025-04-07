import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '@/contexts/ContextProvider';
import { CreateOrgForm } from '../CreateOrgForm';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('../../../helpers/http');
jest.mock('../../ToastMessage/ToastHelper');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
    Toast: {
      state: {
        open: false,
        message: '',
        severity: 'success' as const,
        seconds: 3000,
        handleClose: jest.fn(),
      },
      dispatch: jest.fn(),
    },
    CurrentOrg: {
      state: {
        slug: '',
        name: '',
        base_plan: '',
        subscription_duration: '',
        can_upgrade_plan: false,
        superset_included: false,
        start_date: null,
        end_date: null,
        airbyte_workspace_id: '',
        viz_url: '',
        viz_login_type: '',
        wtype: '',
        is_demo: false,
      },
      dispatch: jest.fn(),
    },
    OrgUsers: {
      state: [],
      dispatch: jest.fn(),
    },
    UnsavedChanges: {
      state: false,
      dispatch: jest.fn(),
    },
  };

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (errorToast as jest.Mock).mockImplementation(jest.fn());
    (successToast as jest.Mock).mockImplementation(jest.fn());
    (httpGet as jest.Mock).mockResolvedValue({ status: 'SUCCESS' });
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
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
    (httpPost as jest.Mock).mockResolvedValueOnce({ slug: 'new-org-slug' });

    renderComponent({ closeSideMenu, setShowForm });

    // Fill in the organization name
    const inputOrgDiv = screen.getByTestId('input-orgname');
    const inputOrg = within(inputOrgDiv).getByRole('textbox');
    fireEvent.change(inputOrg, { target: { value: 'New Org' } });

    // Select base plan - Dalgo
    const basePlanAutoComplete = screen.getByTestId('baseplan');
    const basePlanInput = within(basePlanAutoComplete).getByRole('combobox');

    // Focus and type to open dropdown
    fireEvent.focus(basePlanInput);
    fireEvent.change(basePlanInput, { target: { value: 'Dalgo' } });

    // Select the option
    await act(async () => {
      const option = screen.getByText('Dalgo');
      fireEvent.click(option);
    });

    // Select superset included
    const supersetIncludedAutoComplete = screen.getByTestId('superset_included');
    const supersetIncludedInput = within(supersetIncludedAutoComplete).getByRole('combobox');

    // Focus and type to open dropdown
    fireEvent.focus(supersetIncludedInput);
    fireEvent.change(supersetIncludedInput, { target: { value: 'Yes' } });

    // Select the option
    await act(async () => {
      const option = screen.getByText('Yes');
      fireEvent.click(option);
    });

    // Select duration
    const durationAutoComplete = screen.getByTestId('duration');
    const durationInput = within(durationAutoComplete).getByRole('combobox');

    // Focus and type to open dropdown
    fireEvent.focus(durationInput);
    fireEvent.change(durationInput, { target: { value: 'Monthly' } });

    // Select the option
    await act(async () => {
      const option = screen.getByText('Monthly');
      fireEvent.click(option);
    });

    // Select start date
    const startDateInput = screen.getByTestId('startDate').querySelector('input');
    if (startDateInput) {
      await act(async () => {
        fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      });
    }

    // End date
    const endDateInput = screen.getByTestId('endDate').querySelector('input');
    if (endDateInput) {
      await act(async () => {
        fireEvent.change(endDateInput, { target: { value: '2024-02-01' } });
      });
    }

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByTestId('savebutton'));
    });

    // Verify the API call
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession.data, 'v1/organizations/', {
        name: 'New Org',
        base_plan: 'Dalgo',
        subscription_duration: 'Monthly',
        can_upgrade_plan: false,
        superset_included: true,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-02-01T00:00:00.000Z',
      });
    });

    // Verify form cleanup and navigation
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('org-slug', 'new-org-slug');
      expect(closeSideMenu).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
      expect(successToast).toHaveBeenCalledWith(
        'Organization created successfully!',
        [],
        expect.anything()
      );
    });
  });

  it('submits the form correctly for Free Trial plan', async () => {
    const user = userEvent.setup();
    const closeSideMenu = jest.fn();
    const setShowForm = jest.fn();
    // Mock the response for httpPost
    (httpPost as jest.Mock).mockResolvedValueOnce({ task_id: 'task-123' });

    renderComponent({ closeSideMenu, setShowForm });

    // Fill in the organization name
    const inputOrgDiv = screen.getByTestId('input-orgname');
    const inputOrg = within(inputOrgDiv).getByRole('textbox');
    await user.type(inputOrg, 'New Org');

    // Select Free Trial plan
    const basePlanDiv = screen.getByTestId('baseplan');
    const basePlanInput = within(basePlanDiv).getByRole('combobox');
    await user.click(basePlanInput);
    await user.type(basePlanInput, 'Free Trial');
    const freeTrial = screen.getByText('Free Trial');
    await user.click(freeTrial);

    // Fill in email
    const emailInput = within(screen.getByTestId('input-email')).getByRole('textbox');
    await user.type(emailInput, 'test@example.com');

    // Fill in superset EC2 machine ID
    const supersetEc2Input = within(screen.getByTestId('input-superset_ec2_machine_id')).getByRole(
      'textbox'
    );
    await user.type(supersetEc2Input, 'i-1234567890abcdef0');

    // Fill in superset port
    const supersetPortInput = within(screen.getByTestId('input-superset_port')).getByRole(
      'spinbutton'
    );
    await user.type(supersetPortInput, '8080');

    // Select superset included
    const supersetIncludedDiv = screen.getByTestId('superset_included');
    const supersetIncludedInput = within(supersetIncludedDiv).getByRole('combobox');
    await user.click(supersetIncludedInput);
    await user.type(supersetIncludedInput, 'Yes');
    const yesOption = screen.getByText('Yes');
    await user.click(yesOption);

    // Select start date
    const startDateInput = screen.getByTestId('startDate').querySelector('input');
    if (startDateInput) {
      await user.type(startDateInput, '2024-01-01');
    }

    // End date
    const endDateInput = screen.getByTestId('endDate').querySelector('input');
    if (endDateInput) {
      await user.type(endDateInput, '2024-02-01');
    }

    // Submit the form
    const submitButton = screen.getByTestId('savebutton');
    await user.click(submitButton);

    // Verify the API call with correct Free Trial values
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession.data, 'v1/organizations/free_trial', {
        name: 'New Org',
        base_plan: 'Free Trial',
        subscription_duration: 'Trial',
        can_upgrade_plan: true,
        superset_included: true,
        start_date: '2024-01-01T00:00:00.000Z',
        end_date: '2024-02-01T00:00:00.000Z',
        superset_ec2_machine_id: 'i-1234567890abcdef0',
        superset_port: '8080',
        email: 'test@example.com',
      });
    });

    // Verify form cleanup and navigation
    await waitFor(() => {
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
