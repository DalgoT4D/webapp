import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import useSWR from 'swr';
import ManageNotifications from '../ManageNotificaitons';
import moment from 'moment';

// Mock useSWR
jest.mock('swr');

describe('ManageNotifications Component', () => {
  const mockNotifications = {
    total_notifications: 15,
    res: [
      {
        id: 1,
        urgent: false,
        author: 'Author 1',
        message: 'This is a test notification message',
        read_status: false,
        timestamp: moment().subtract(1, 'hour').toISOString(),
      },
      {
        id: 2,
        urgent: true,
        author: 'Author 2',
        message: 'Urgent notification message',
        read_status: true,
        timestamp: moment().subtract(5, 'hours').toISOString(),
      },
    ],
  };

  const mockMutate = jest.fn();

  beforeEach(() => {
    (useSWR as jest.Mock).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      mutate: mockMutate,
    });
  });

  test('renders the component with notifications', () => {
    render(
      <ManageNotifications
        tabWord="all"
        checkedRows={[]}
        setCheckedRows={jest.fn()}
        mutateAllRow={false}
        setMutateAllRows={jest.fn()}
      />
    );

    // Check if notifications are displayed
    expect(screen.getByText('This is a test notification message')).toBeInTheDocument();
    expect(screen.getByText('Urgent notification message')).toBeInTheDocument();
  });

  test.only('displays a checkbox for each notification and allows checking/unchecking', async() => {
    const setCheckedRows = jest.fn();

    render(
      <ManageNotifications
        tabWord="all"
        checkedRows={[]}
        setCheckedRows={setCheckedRows}
        mutateAllRow={false}
        setMutateAllRows={jest.fn()}
      />
    );

    // Check if checkboxes are displayed
    const checkboxes = screen.getAllByRole('checkbox');
    console.log(checkboxes.length, "length1s")
    expect(checkboxes).toHaveLength(5); // Includes the "select all" checkbox

    // Check the individual notification checkbox
    fireEvent.click(checkboxes[1]); // First notification checkbox
    await waitFor(()=>{
      expect(setCheckedRows).toHaveBeenCalledWith([1]);
    }) 

    fireEvent.click(checkboxes[1]); // Uncheck the first notification checkbox
    expect(setCheckedRows).toHaveBeenCalledWith([]);
  });

  test('selects and deselects all notifications with the "select all" checkbox', async () => {
    const setCheckedRows = jest.fn();

    // Set up the component with no notifications checked initially
    render(
      <ManageNotifications
        tabWord="all"
        checkedRows={[]}
        setCheckedRows={setCheckedRows}
        mutateAllRow={false}
        setMutateAllRows={jest.fn()}
      />
    );

    // Find the "select all" checkbox
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');

    // Click the "select all" checkbox
    fireEvent.click(selectAllCheckbox);

    // Wait for the state update (setCheckedRows to be called)
    await waitFor(() => {
      expect(setCheckedRows).toHaveBeenCalledWith([1, 2]); // All notification IDs selected
    });

    // Simulate all notifications being selected (reflect the state update)
    render(
      <ManageNotifications
        tabWord="all"
        checkedRows={[1, 2]} // Now, all notifications are selected
        setCheckedRows={setCheckedRows}
        mutateAllRow={false}
        setMutateAllRows={jest.fn()}
      />
    );

    // Click the "select all" checkbox again to deselect all
    fireEvent.click(selectAllCheckbox);

    // Wait for the state update
    await waitFor(() => {
      expect(setCheckedRows).toHaveBeenCalledWith([]); // All notifications deselected
    });
  });


  // test.only('expands and collapses notification row on arrow click', () => {
  //   render(
  //     <ManageNotifications
  //       tabWord="all"
  //       checkedRows={[]}
  //       setCheckedRows={jest.fn()}
  //       mutateAllRow={false}
  //       setMutateAllRows={jest.fn()}
  //     />
  //   );

  //   const arrowButton = screen.getAllByRole('button')[0]; // First notification's expand button
  //   fireEvent.click(arrowButton);

  //   // After expanding, the full message should be displayed
  //   expect(screen.getByText('This is a test notification message')).toBeInTheDocument();

  //   fireEvent.click(arrowButton);

  //   // After collapsing, the truncated message should appear
  //   expect(screen.getByText(/This is a test notification message.../)).toBeInTheDocument();
  // });

  test('handles pagination correctly', async () => {
    render(
      <ManageNotifications
        tabWord="all"
        checkedRows={[]}
        setCheckedRows={jest.fn()}
        mutateAllRow={false}
        setMutateAllRows={jest.fn()}
      />
    );

    // Pagination controls should be present
    const nextPageButton = screen.getByTestId('KeyboardArrowRightIcon');
    fireEvent.click(nextPageButton);

    // Expect mutate to be called to fetch new data on page change
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  test('shows urgent icon for urgent notifications', () => {
    render(
      <ManageNotifications
        tabWord="all"
        checkedRows={[]}
        setCheckedRows={jest.fn()}
        mutateAllRow={false}
        setMutateAllRows={jest.fn()}
      />
    );

    const urgentIcon = screen.getByTestId('ErrorOutlineIcon'); // Using MUI's test ID for icon
    expect(urgentIcon).toBeInTheDocument();
    expect(urgentIcon).toHaveStyle('color: red');
  });
});
