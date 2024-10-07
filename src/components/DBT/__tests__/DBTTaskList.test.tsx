import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { DBTTaskList } from '../DBTTaskList';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpPost } from '@/helpers/http';
import { TASK_DBTRUN, TASK_DBTTEST } from '@/config/constant';

// Mocking dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../../../helpers/http', () => ({
  httpPost: jest.fn(),
  httpDelete: jest.fn(),
  httpGet: jest.fn(),
}));

const mockSession = {
  expires: '1',
  user: { email: 'a', name: 'Delta', image: 'c', token: 'test-token' },
};

const mockTasks = [
  {
    uuid: '1',
    command: 'dbt run',
    slug: TASK_DBTRUN,
    lock: { status: 'running', lockedBy: 'test@example.com', lockedAt: '2024-07-23T12:00:00Z' },
    generated_by: 'client',
  },
  {
    uuid: '2',
    command: 'dbt test',
    slug: TASK_DBTTEST,
    lock: null,
    generated_by: 'client',
  },
];

const mockPermissions = ['can_run_orgtask', 'can_delete_orgtask', 'can_create_orgtask'];

const mockContext = {
  Permissions: {
    state: mockPermissions,
  },
};

describe('DBTTaskList Component', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });
  });

  it('should render task list with commands', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList
          tasks={mockTasks}
          setDbtRunLogs={jest.fn()}
          setExpandLogs={jest.fn()}
          isAnyTaskLocked={false}
          fetchDbtTasks={jest.fn()}
        />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('dbt run')).toBeInTheDocument();
    expect(screen.getByText('dbt test')).toBeInTheDocument();
  });

  it('should call executeDbtJob when Execute button is clicked', async () => {
    (httpPost as jest.Mock).mockResolvedValueOnce({ status: 'success', result: [] });

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList
          tasks={mockTasks}
          setDbtRunLogs={jest.fn()}
          setExpandLogs={jest.fn()}
          isAnyTaskLocked={false}
          fetchDbtTasks={jest.fn()}
        />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-2'));

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession, `prefect/tasks/2/run/`, {});
    });
  });

  it('should display error message if executeDbtJob fails', async () => {
    (httpPost as jest.Mock).mockRejectedValueOnce(new Error('Job failed'));

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList
          tasks={mockTasks}
          setDbtRunLogs={jest.fn()}
          setExpandLogs={jest.fn()}
          isAnyTaskLocked={false}
          fetchDbtTasks={jest.fn()}
        />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-2'));

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession, `prefect/tasks/2/run/`, {});
    });
  });
});
