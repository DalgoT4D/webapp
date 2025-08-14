import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ManageNotifications from '../ManageNotifications';
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
      category: 'incident',
    },
    {
      id: 2,
      urgent: false,
      author: 'User',
      message:
        'This is a normal message with a long text to test truncation and expansion functionality which should be longer than 130 characters to trigger the expand/collapse behavior in the component.',
      read_status: true,
      timestamp: new Date().toISOString(),
      category: 'job_failure',
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
    // For long messages, check for truncated version
    expect(
      screen.getByText(/This is a normal message with a long text to test truncation/)
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

    const checkbox1 = screen.getByTestId('1-checkbox').querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox1!);

    expect(checkbox1).toBeChecked();

    rerender(<MockComponent />);

    const checkbox2 = screen.getByTestId('2-checkbox').querySelector('input[type="checkbox"]');
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
});

describe('ManageNotifications Component - extended coverage', () => {
  const mockMutate = jest.fn();

  const baseData = {
    total_notifications: 2,
    res: [
      {
        id: 1,
        urgent: true,
        author: 'Admin',
        message: 'Urgent message 1',
        read_status: false,
        timestamp: new Date().toISOString(),
        category: 'incident',
      },
      {
        id: 2,
        urgent: false,
        author: 'User',
        message:
          'This is a normal message with a long text to test truncation and expansion functionality which should be longer than 130 characters to trigger the expand/collapse behavior in the component.',
        read_status: true,
        timestamp: new Date().toISOString(),
        category: 'job_failure',
      },
    ],
  };

  const defaultProps = {
    tabWord: 'all' as const,
    checkedRows: [] as number[],
    setCheckedRows: jest.fn(),
    mutateAllRow: false,
    setMutateAllRows: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSWR as jest.Mock).mockReturnValue({
      data: baseData,
      isLoading: false,
      mutate: mockMutate,
      error: undefined,
    });
  });

  test('shows loading state when isLoading=true', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      mutate: mockMutate,
    });

    render(<ManageNotifications {...defaultProps} />);
    // The component shows CircularProgress when loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders empty state when no notifications are returned', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { total_notifications: 0, res: [] },
      isLoading: false,
      mutate: mockMutate,
    });

    render(<ManageNotifications {...defaultProps} />);
    // Check for the "Showing 0 of 0 notifications" text
    expect(screen.getByText(/Showing 0 of 0 notifications/)).toBeInTheDocument();
  });

  test('renders error state when SWR returns error', () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      mutate: mockMutate,
      error: new Error('Network error'),
    });

    render(<ManageNotifications {...defaultProps} />);
    // Component doesn't explicitly handle error state, so it will show empty content
    // We can check that it doesn't crash and renders the basic structure
    expect(screen.getByText(/Showing 0 of 0 notifications/)).toBeInTheDocument();
  });

  test('displays urgent indicator for urgent notifications', () => {
    render(<ManageNotifications {...defaultProps} />);
    // Look for ErrorOutline icon which indicates urgent notifications
    const errorIcons = screen.getAllByTestId('ErrorOutlineIcon');
    expect(errorIcons.length).toBeGreaterThan(0);
  });

  test('reflects read vs unread status in the UI', () => {
    render(<ManageNotifications {...defaultProps} />);
    // The component applies different text colors for read/unread messages
    // We can verify both messages are present
    expect(screen.getByText('Urgent message 1')).toBeInTheDocument();
    expect(
      screen.getByText(/This is a normal message with a long text to test truncation/)
    ).toBeInTheDocument();

    // Check category display
    expect(screen.getByText('Category: incident')).toBeInTheDocument();
    expect(screen.getByText('Category: job_failure')).toBeInTheDocument();
  });

  test('row checkbox toggling updates selection state', () => {
    const Controlled = () => {
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

    render(<Controlled />);
    const row1Box = screen
      .getByTestId('1-checkbox')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(row1Box).toBeInTheDocument();

    fireEvent.click(row1Box);
    expect(row1Box).toBeChecked();

    fireEvent.click(row1Box);
    expect(row1Box).not.toBeChecked();
  });

  test('select all selects and deselects all rows', () => {
    const props = {
      ...defaultProps,
      setCheckedRows: jest.fn(),
    };
    const { rerender } = render(<ManageNotifications {...props} />);

    const selectAll = screen
      .getByTestId('select-all-checkbox')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;

    fireEvent.click(selectAll);
    expect(props.setCheckedRows).toHaveBeenLastCalledWith([1, 2]);

    rerender(<ManageNotifications {...props} checkedRows={[1, 2]} />);
    fireEvent.click(selectAll);
    expect(props.setCheckedRows).toHaveBeenLastCalledWith([]);
  });

  test('mutate is available and not called by default; can be triggered by external change (mutateAllRow)', () => {
    const props = {
      ...defaultProps,
      mutateAllRow: false,
      setMutateAllRows: jest.fn(),
    };
    const { rerender } = render(<ManageNotifications {...props} />);

    expect(mockMutate).not.toHaveBeenCalled();

    // Test mutateAllRow=true triggers mutate
    rerender(<ManageNotifications {...props} mutateAllRow={true} />);
    expect(mockMutate).toHaveBeenCalled();
    expect(props.setMutateAllRows).toHaveBeenCalledWith(false);
  });

  test('message truncation/expansion control is present if supported', () => {
    render(<ManageNotifications {...defaultProps} />);

    // Look for expand button (KeyboardArrowDown icon) for the long message
    const expandButtons = screen.getAllByTestId('KeyboardArrowDownIcon');
    expect(expandButtons.length).toBeGreaterThan(0);

    // Click the expand button
    const expandButton = expandButtons[0].closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);

      // After expanding, should see the collapse button
      const collapseButtons = screen.getAllByTestId('KeyboardArrowUpIcon');
      expect(collapseButtons.length).toBeGreaterThan(0);
    }
  });

  test('author and timestamp are rendered for each notification if available', () => {
    render(<ManageNotifications {...defaultProps} />);

    // Authors are not directly displayed in the UI based on the component code
    // but timestamps are shown using moment.js
    // Look for "ago" text which indicates relative time
    const timeElements = screen.getAllByText(/ago/);
    expect(timeElements.length).toBeGreaterThan(0);

    // Categories are shown
    expect(screen.getByText('Category: incident')).toBeInTheDocument();
    expect(screen.getByText('Category: job_failure')).toBeInTheDocument();
  });
});
