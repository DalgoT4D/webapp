import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '@/contexts/ContextProvider';
import { CreateOrgForm } from '../CreateOrgForm';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';

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
  // it('submits the form correctly and handles the response', async () => {
  //   const closeSideMenu = jest.fn();
  //   const setShowForm = jest.fn();
  //   // Mock the response for httpPost
  //   httpPost.mockResolvedValueOnce({ slug: 'new-org-slug' });

  //   // Render the component
  //   render(
  //     <GlobalContext.Provider value={{}}>
  //       <CreateOrgForm
  //         closeSideMenu={closeSideMenu}
  //         showForm={true}
  //         setShowForm={setShowForm}
  //       />
  //     </GlobalContext.Provider>
  //   );

  //   // Fill in the organization name
  //   const inputOrgDiv = screen.getByTestId('input-orgname');
  //   const inputOrg = within(inputOrgDiv).getByRole('textbox');
  //   fireEvent.change(inputOrg, { target: { value: 'New Org' } });

  //   // Select base plan
  //   const basePlanAutoComplete = screen.getByTestId('baseplan');

  //   // Check if the dropdown exists
  //   await waitFor(() => {
  //     expect(basePlanAutoComplete).toBeInTheDocument();
  //   });

  //   // Select the input text box inside Autocomplete
  //   const basePlanTextInput = within(basePlanAutoComplete).getByRole('combobox');
  //   basePlanAutoComplete.focus();

  //   // Update the input text value
  //   await fireEvent.change(basePlanTextInput, {
  //     target: { value: 'Dalgo' },
  //   });

  //   // Navigate and select the option
  //   fireEvent.keyDown(basePlanAutoComplete, { key: 'ArrowDown' });
  //   await act(() => fireEvent.keyDown(basePlanAutoComplete, { key: 'Enter' }));

  //   // Assert the value is selected
  //   expect(basePlanTextInput).toHaveValue('Dalgo');

  //   // Select the "Dalgo" option
  //   fireEvent.click(screen.getByText('Free Trial'));

  //   // Select duration
  //   const durationDiv = screen.getByLabelText('Select Duration');
  //   fireEvent.mouseDown(durationDiv);
  //   const durationOption = screen.getByText('Monthly');
  //   fireEvent.click(durationOption);

  //   // Select superset included
  //   const supersetDiv = screen.getByLabelText('Is Superset Included?');
  //   fireEvent.mouseDown(supersetDiv);
  //   const supersetOption = screen.getByText('Yes');
  //   fireEvent.click(supersetOption);

  //   // Fill start date
  //   const startDateInput = screen.getByLabelText('Start Date');
  //   fireEvent.change(startDateInput, { target: { value: '2023-11-01' } });

  //   // Fill end date
  //   const endDateInput = screen.getByLabelText('End Date');
  //   fireEvent.change(endDateInput, { target: { value: '2023-12-01' } });

  //   // Submit the form
  //   const saveButton = screen.getByTestId('savebutton');
  //   fireEvent.click(saveButton);

  //   // Assert that httpPost is called with correct payload
  //   await waitFor(() => {
  //     expect(httpPost).toHaveBeenCalledWith(
  //       { user: { name: 'Test User' } }, // Adjust session mock as needed
  //       'v1/organizations/',
  //       {
  //         name: 'New Org',
  //         base_plan: 'Dalgo',
  //         subscription_duration: 'Monthly',
  //         can_upgrade_plan: false,
  //         superset_included: true,
  //         start_date: '2023-11-01T00:00:00.000Z',
  //         end_date: '2023-12-01T00:00:00.000Z',
  //       }
  //     );
  //     expect(localStorage.getItem('org-slug')).toBe('new-org-slug');
  //     expect(closeSideMenu).toHaveBeenCalled();
  //     expect(setShowForm).toHaveBeenCalledWith(false);
  //   });
  // });
});
