import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import DBTTransformTab from '../DBTTransformTab';
import { httpGet } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/utils/common', () => ({
  delay: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/config/constant', () => ({
  flowRunLogsOffsetLimit: 50,
}));

jest.mock('../DBTRepositoryCard', () => {
  return function MockDBTRepositoryCard({ onConnectGit }: { onConnectGit: () => void }) {
    return (
      <div data-testid="dbt-repository-card">
        <button onClick={onConnectGit} data-testid="connect-git-btn">
          Connect Git
        </button>
      </div>
    );
  };
});

jest.mock('../DBTTaskList', () => ({
  DBTTaskList: function MockDBTTaskList({ tasks, isAnyTaskLocked, fetchDbtTasks }: any) {
    return (
      <div data-testid="dbt-task-list">
        <div data-testid="tasks-count">Tasks: {tasks.length}</div>
        <div data-testid="locked-status">Locked: {isAnyTaskLocked.toString()}</div>
        <button onClick={fetchDbtTasks} data-testid="fetch-tasks-btn">
          Fetch Tasks
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/Logs/LogCard', () => ({
  LogCard: function MockLogCard({ logs, expand }: any) {
    return (
      <div data-testid="log-card">
        <div data-testid="logs-count">Logs count: {logs.length}</div>
        <div data-testid="expanded-status">Expanded: {expand.toString()}</div>
      </div>
    );
  },
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockHttpGet = httpGet as jest.MockedFunction<typeof httpGet>;

const mockGlobalContextValue = {
  globalState: {},
  setGlobalState: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <GlobalContext.Provider value={mockGlobalContextValue}>{component}</GlobalContext.Provider>
  );
};

describe('DBTTransformTab', () => {
  const defaultProps = {
    gitConnected: false,
    onConnectGit: jest.fn(),
  };

  const mockSession = {
    user: { email: 'test@example.com' },
    accessToken: 'mock-token',
  };

  const mockTasks = [
    {
      id: 1,
      uuid: 'task-1',
      task_name: 'dbt_run',
      lock: false,
      slug: 'dbt-run',
    },
    {
      id: 2,
      uuid: 'task-2',
      task_name: 'dbt_test',
      lock: true,
      slug: 'dbt-test',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  it('renders all main components', () => {
    mockHttpGet.mockResolvedValue(mockTasks);

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    expect(screen.getByTestId('dbt-repository-card')).toBeInTheDocument();
    expect(screen.getByTestId('dbt-task-list')).toBeInTheDocument();
    expect(screen.getByTestId('log-card')).toBeInTheDocument();
  });

  it('fetches DBT tasks on mount when session is available', async () => {
    mockHttpGet.mockResolvedValue(mockTasks);

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalledWith(mockSession, 'prefect/tasks/transform/');
    });

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('Tasks: 2');
    expect(screen.getByTestId('locked-status')).toHaveTextContent('Locked: true');
  });

  it('does not fetch tasks when session is not available', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it('handles task fetching errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockHttpGet.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching DBT tasks:', expect.any(Error));
    });

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('Tasks: 0');
    consoleSpy.mockRestore();
  });

  it('sets task locked state correctly when tasks are locked', async () => {
    const lockedTasks = [
      { id: 1, lock: true, task_name: 'dbt_run' },
      { id: 2, lock: false, task_name: 'dbt_test' },
    ];
    mockHttpGet.mockResolvedValue(lockedTasks);

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('locked-status')).toHaveTextContent('Locked: true');
    });
  });

  it('sets task unlocked state when no tasks are locked', async () => {
    const unlockedTasks = [
      { id: 1, lock: false, task_name: 'dbt_run' },
      { id: 2, lock: false, task_name: 'dbt_test' },
    ];
    mockHttpGet.mockResolvedValue(unlockedTasks);

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('locked-status')).toHaveTextContent('Locked: false');
    });
  });

  it('calls onConnectGit when git connection is initiated', async () => {
    mockHttpGet.mockResolvedValue(mockTasks);

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    const connectGitButton = screen.getByTestId('connect-git-btn');
    act(() => {
      connectGitButton.click();
    });

    expect(defaultProps.onConnectGit).toHaveBeenCalledTimes(1);
  });

  it('renders with git connected state', async () => {
    mockHttpGet.mockResolvedValue(mockTasks);

    renderWithProviders(<DBTTransformTab {...defaultProps} gitConnected={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('dbt-repository-card')).toBeInTheDocument();
    });
  });

  it('initializes with correct default state', () => {
    mockHttpGet.mockResolvedValue([]);

    renderWithProviders(<DBTTransformTab {...defaultProps} />);

    expect(screen.getByTestId('logs-count')).toHaveTextContent('Logs count: 0');
    expect(screen.getByTestId('expanded-status')).toHaveTextContent('Expanded: false');
  });
});
