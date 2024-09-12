import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageNotifications from '../ManageNotificaitons';
import useSWR from 'swr';

// Mock the useSWR hook for data fetching
jest.mock('swr');

// Mock data
const mockNotifications = {
  total_notifications: 2,
  res: [
    {
      id: 1,
      urgent: true,
      author: 'Admin',
      message: 'Urgent message 1',
      read_status: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      urgent: false,
      author: 'User',
      message: 'This is a normal message with a long text to test truncation.',
      read_status: true,
      timestamp: new Date().toISOString(),
    },
  ],
};

// Mock the props
const mockProps = {
  tabWord: 'all',
  checkedRows: [],
  setCheckedRows: jest.fn(),
  mutateAllRow: false,
  setMutateAllRows: jest.fn(),
};

// Mock the mutate function for SWR
const mockMutate = jest.fn();

describe('ManageNotifications Component', () => {
  beforeEach(() => {
    (useSWR as jest.Mock).mockReturnValue({
      data: mockNotifications,
      isLoading: false,
      mutate: mockMutate,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders notifications correctly', () => {
    render(<ManageNotifications {...mockProps} />);

    // Check that the notification messages are displayed
    expect(screen.getByText('Urgent message 1')).toBeInTheDocument();
    expect(
      screen.getByText('This is a normal message with a long text to test truncation.')
    ).toBeInTheDocument();
  });


  test('handles checkbox selection correctly', () => {
    // Define mock props with a useState hook to simulate checkedRows behavior
    const MockComponent = () => {
      const [checkedRows, setCheckedRows] = useState<number[]>([]);

      return (
        <ManageNotifications
          tabWord="all"
          checkedRows={checkedRows}
          setCheckedRows={setCheckedRows}
          mutateAllRow={false}
          setMutateAllRows={jest.fn()}
        />
      );
    };

    // Render the component wrapped in the mock component
    const { rerender } = render(<MockComponent />);

    // Find the checkbox input for the first notification (target the input inside the checkbox)
    const checkbox1 = screen.getByTestId('1-checkbox').querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox1!); // Simulate click

    // Assert that the checkbox is checked
    expect(checkbox1).toBeChecked();

    // Re-render the component with updated state
    rerender(<MockComponent />);

    // Find the checkbox input for the second notification
    const checkbox2 = screen.getByTestId('2-checkbox').querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox2!); // Simulate click

    // Assert that the second checkbox is checked
    expect(checkbox2).toBeChecked();
  });
  

  test('handles "select all" functionality', async () => {
    // Render the component
    const { rerender } = render(<ManageNotifications {...mockProps} />);
  
    // Find the "select all" checkbox input (target the input inside the checkbox)
    const selectAllCheckbox = screen.getByTestId('select-all-checkbox').querySelector('input[type="checkbox"]');
    
    // Simulate clicking the "select all" checkbox
    fireEvent.click(selectAllCheckbox!);
  
    // Expect that all notification IDs are selected
    expect(mockProps.setCheckedRows).toHaveBeenCalledWith([1, 2]);
  
    // Simulate all rows being selected by updating the checkedRows prop and re-render the component
    rerender(<ManageNotifications {...mockProps} checkedRows={[1, 2]} />);
  
    // Simulate clicking the "select all" checkbox again (unselect all)
    fireEvent.click(selectAllCheckbox!);
  
    // Expect setCheckedRows to be called with an empty array (deselect all)
    expect(mockProps.setCheckedRows).toHaveBeenCalledWith([]);
  });
  

  // test('expands and collapses long messages on row click', () => {
  //   render(<ManageNotifications {...mockProps} />);
  
  //   // The truncated version will be detected using partial match
  //   const truncatedMessage = (content: string) =>
  //     content.startsWith('This is a normal message with a long text');
  
  //   // The full message (after expansion)
  //   const fullMessage = 'This is a normal message with a long text to test truncation.';
  
  //   // Check if the truncated message is initially visible using a custom matcher
  //   expect(screen.getByText(truncatedMessage)).toBeInTheDocument();
  
  //   // Find the expand button (using the testId or icon button role)
  //   const expandButton = screen.getByRole('button', { name: /keyboardarrowdown/i });
  
  //   // Click the button to expand the message
  //   fireEvent.click(expandButton);
  
  //   // Verify that the full message is visible after expansion
  //   expect(screen.getByText(fullMessage)).toBeInTheDocument();
  
  //   // Find the collapse button (which switches to "keyboardarrowup" after expanding)
  //   const collapseButton = screen.getByRole('button', { name: /keyboardarrowup/i });
  
  //   // Click the button to collapse the message
  //   fireEvent.click(collapseButton);
  
  //   // Ensure the truncated message is visible again after collapsing using the custom matcher
  //   expect(screen.getByText(truncatedMessage)).toBeInTheDocument();
  // });
  
  
  // test('handles pagination changes', async () => {
  //   render(<ManageNotifications {...mockProps} />);

  //   // Change the rows per page to 20
  //   fireEvent.change(screen.getByRole('combobox'), { target: { value: '20' } });

  //   // Wait for pagination change
  //   await waitFor(() => {
  //     expect(mockMutate).toHaveBeenCalledTimes(1);
  //   });

  //   // Ensure the page size has been updated correctly
  //   expect(screen.getByText(/showing 2 of 2 notifications/i)).toBeInTheDocument();
  // });
});
