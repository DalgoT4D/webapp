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

    expect(screen.getByText('Urgent message 1')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This is a normal message with a long text to test truncation.'
      )
    ).toBeInTheDocument();
  });

  test('handles checkbox selection correctly', () => {
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

    const { rerender } = render(<MockComponent />);

    const checkbox1 = screen
      .getByTestId('1-checkbox')
      .querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox1!);

    expect(checkbox1).toBeChecked();

    rerender(<MockComponent />);

    const checkbox2 = screen
      .getByTestId('2-checkbox')
      .querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox2!);
    expect(checkbox2).toBeChecked();
  });

  test('handles "select all" functionality', async () => {
    // Render the component
    const { rerender } = render(<ManageNotifications {...mockProps} />);
    const selectAllCheckbox = screen
      .getByTestId('select-all-checkbox')
      .querySelector('input[type="checkbox"]');
    fireEvent.click(selectAllCheckbox!);
    expect(mockProps.setCheckedRows).toHaveBeenCalledWith([1, 2]);
    rerender(<ManageNotifications {...mockProps} checkedRows={[1, 2]} />);
    fireEvent.click(selectAllCheckbox!);
    expect(mockProps.setCheckedRows).toHaveBeenCalledWith([]);
  });

  // test('expands and collapses long messages on row click', () => {
  //   render(<ManageNotifications {...mockProps} />);
  //   const truncatedMessage = 'This is a normal message with a long text';
  //   const fullMessage = 'This is a normal message with a long text to test truncation.';
  //   expect(screen.getByText((content) => content.startsWith(truncatedMessage))).toBeInTheDocument();
  //   const expandButton = screen.getByRole('button', { name: /keyboardarrowdown/i });
  //   fireEvent.click(expandButton);
  //   expect(screen.getByText(fullMessage)).toBeInTheDocument();
  //   const collapseButton = screen.getByRole('button', { name: /keyboardarrowup/i });
  //   fireEvent.click(collapseButton);
  //   expect(screen.getByText((content) => content.startsWith(truncatedMessage))).toBeInTheDocument();
  // });
});
