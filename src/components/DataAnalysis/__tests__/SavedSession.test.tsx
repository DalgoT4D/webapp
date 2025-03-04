import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SavedSession } from '../SavedSession';
import { useSession } from 'next-auth/react';
import { httpGet } from '@/helpers/http';

import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
}));

const mockHandleEditSession = jest.fn();
const mockOnClose = jest.fn();

const mockSession = {
  user: { name: 'Test User', email: 'test@example.com' },
};

const mockSavedSessions = {
  rows: [
    {
      session_id: '1',
      created_at: '2023-09-01T12:00:00Z',
      updated_at: '2023-09-02T12:00:00Z',
      session_name: 'Test Session 1',
      session_status: 'Completed',
      created_by: { email: 'user1@example.com' },
      response: [{ prompt: 'Test Prompt 1', response: 'Test Response 1' }],
      request_meta: { sql: 'SELECT * FROM test' },
      request_uuid: 'uuid-1',
    },
  ],
  total_rows: 50,
};

const defaultProps = {
  open: true,
  onClose: mockOnClose,
  handleEditSession: mockHandleEditSession,
  version: 'v1',
};

const mockGlobalContext = {
  UnsavedChanges: { state: false, dispatch: jest.fn() },
};

describe('SavedSession Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({ data: mockSession });
  });

  test('renders the SavedSession dialog correctly', async () => {
    httpGet.mockResolvedValue(mockSavedSessions);

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SavedSession {...defaultProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('Saved sessions')).toBeInTheDocument();
    expect(screen.getByText('Created on')).toBeInTheDocument();
    expect(screen.getByText('Updated on')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText('Last edited')).toBeInTheDocument();

    // Wait for the saved sessions data to be loaded
    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });
  });

  test('displays loading spinner while fetching sessions', async () => {
    httpGet.mockImplementation(() => new Promise(() => {})); // Simulate loading

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SavedSession {...defaultProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // CircularProgress appears while loading
  });

  test('handles pagination correctly', async () => {
    httpGet.mockResolvedValue(mockSavedSessions);

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SavedSession {...defaultProps} />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });

    const pagination = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(pagination);

    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(
        mockSession,
        'warehouse/ask/sessions?limit=10&offset=10&version=v1'
      );
    });
  });

  test('displays error toast when fetching sessions fails', async () => {
    const errorMessage = 'Failed to fetch sessions';
    httpGet.mockRejectedValue({ message: errorMessage });

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SavedSession {...defaultProps} />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith(errorMessage, [], mockGlobalContext);
    });
  });

  test('handles row click and edit session', async () => {
    httpGet.mockResolvedValue(mockSavedSessions);

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SavedSession {...defaultProps} />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });

    // Simulate row click to edit session
    const rowButton = screen.getByText('Test Session 1');
    fireEvent.click(rowButton);

    const openButton = screen.getByText('OPEN');
    fireEvent.click(openButton);

    await waitFor(() => {
      expect(mockHandleEditSession).toHaveBeenCalledWith({
        prompt: 'Test Prompt 1',
        summary: 'Test Response 1',
        oldSessionId: '1',
        session_status: 'Completed',
        session_name: 'Test Session 1',
        sqlText: 'SELECT * FROM test',
        taskId: 'uuid-1',
      });
    });

    expect(mockOnClose).toHaveBeenCalledTimes(2); // Ensure the dialog is closed after editing
  });

  test('calls onClose when CloseIcon is clicked', () => {
    httpGet.mockResolvedValue(mockSavedSessions);

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <SavedSession {...defaultProps} />
      </GlobalContext.Provider>
    );

    const closeButton = screen.getByTestId('CloseIcon');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
