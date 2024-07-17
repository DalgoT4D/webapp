import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DBTTaskList } from '../DBTTaskList';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { httpPost, httpDelete } from '@/helpers/http';

// Mock next-auth/react useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock a sample session object
const mockSession = {
  data: {
    user: {
      email: 'test@example.com',
    },
  },
};

describe('DBTTaskList Component', () => {
  // Mock initial props and context values
  const mockProps = {
    tasks: [
      { uuid: '1', command: 'DBT Command 1', generated_by: 'client', slug: 'dbtrun' },
      { uuid: '2', command: 'DBT Command 2', generated_by: 'server', slug: 'dbttest' },
    ],
    setDbtRunLogs: jest.fn(),
    setExpandLogs: jest.fn(),
    isAnyTaskLocked: false,
    fetchDbtTasks: jest.fn(),
  };

  beforeEach(() => {
    // Mock useSession hook
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders DBTTaskList component with correct elements', () => {
    render(
      <GlobalContext.Provider value={{ Permissions: { state: ['can_run_orgtask', 'can_delete_orgtask', 'can_create_orgtask'] } }}>
        <DBTTaskList {...mockProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('Task')).toBeInTheDocument(); // Check if the "Task" title is rendered
    expect(screen.getByText('DBT Command 1')).toBeInTheDocument(); // Check if task command is rendered
    expect(screen.getByText('DBT Command 2')).toBeInTheDocument(); // Check if task command is rendered
  });

  test('clicking execute button calls executeDbtJob function', async () => {
    render(
      <GlobalContext.Provider value={{ Permissions: { state: ['can_run_orgtask', 'can_delete_orgtask', 'can_create_orgtask'] } }}>
        <DBTTaskList {...mockProps} />
      </GlobalContext.Provider>
    );

    const executeButton = screen.getByTestId('task-1'); // Get the execute button for the first task
    fireEvent.click(executeButton);

    // Since executeDbtJob is an async function, we wait for the success message
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalled(); // Check if httpPost function was called
      expect(mockProps.setDbtRunLogs).toHaveBeenCalled(); // Check if setDbtRunLogs function was called
      expect(screen.getByText('Job ran successfully')).toBeInTheDocument(); // Check if success message is displayed
    });
  });

  test('clicking on more options button opens actions menu', () => {
    render(
      <GlobalContext.Provider value={{ Permissions: { state: ['can_run_orgtask', 'can_delete_orgtask', 'can_create_orgtask'] } }}>
        <DBTTaskList {...mockProps} />
      </GlobalContext.Provider>
    );

    const moreOptionsButton = screen.getByLabelText('More');
    fireEvent.click(moreOptionsButton);

    expect(screen.getByText('Delete')).toBeInTheDocument(); // Example check for menu item presence
  });

  test('deleting a task calls httpDelete and shows success message', async () => {
    render(
      <GlobalContext.Provider value={{ Permissions: { state: ['can_run_orgtask', 'can_delete_orgtask', 'can_create_orgtask'] } }}>
        <DBTTaskList {...mockProps} />
      </GlobalContext.Provider>
    );

    const moreOptionsButton = screen.getByLabelText('More');
    fireEvent.click(moreOptionsButton);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Confirm delete action in dialog
    const confirmDeleteButton = screen.getByText('Confirm');
    fireEvent.click(confirmDeleteButton);

    // Since deleteTask is an async function, wait for the success message
    await waitFor(() => {
      expect(httpDelete).toHaveBeenCalled(); // Check if httpDelete function was called
      expect(mockProps.fetchDbtTasks).toHaveBeenCalled(); // Check if fetchDbtTasks function was called after delete
      expect(screen.getByText('Task deleted')).toBeInTheDocument(); // Check if success message is displayed
    });
  });

  // Add more test cases as needed for other functionalities like opening dialogs, handling errors, etc.
});
