import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { DBTTaskList } from '../DBTTaskList';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { TASK_DBTRUN, TASK_DBTTEST } from '@/config/constant';
import { useTracking } from '@/contexts/TrackingContext';

// Mocking dependencies
jest.mock('next-auth/react');
jest.mock('@/contexts/TrackingContext');
jest.mock('@/helpers/http');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
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
    label: 'DBT Run Task',
    lock: { status: 'running', lockedBy: 'test@example.com', lockedAt: '2024-03-20T12:00:00Z' },
    generated_by: 'client',
    deploymentId: 'deploy-1',
  },
  {
    uuid: '2',
    command: 'dbt test',
    slug: TASK_DBTTEST,
    label: 'DBT Test Task',
    lock: null,
    generated_by: 'client',
    deploymentId: '',
  },
];

const mockDispatch = jest.fn();

const mockContext = {
  Permissions: {
    state: ['can_run_orgtask', 'can_delete_orgtask', 'can_create_orgtask'],
  },
  Toast: {
    dispatch: mockDispatch,
    state: {
      open: false,
      message: '',
      messages: [],
      severity: 'success',
    },
  },
};

const defaultProps = {
  tasks: mockTasks,
  setDbtRunLogs: jest.fn(),
  setExpandLogs: jest.fn(),
  isAnyTaskLocked: false,
  fetchDbtTasks: jest.fn(),
  setFlowRunId: jest.fn(),
  fetchLogs: jest.fn(),
};

describe('DBTTaskList Component', () => {
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });
    (useTracking as jest.Mock).mockReturnValue(mockTrackEvent);
  });

  it('renders task list with correct task information', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('DBT Run Task')).toBeInTheDocument();
    expect(screen.getByText('DBT Test Task')).toBeInTheDocument();
    expect(screen.getByText('dbt run')).toBeInTheDocument();
    expect(screen.getByText('dbt test')).toBeInTheDocument();
  });

  it('executes dbt run task with deployment successfully', async () => {
    const mockFlowRunResponse = { flow_run_id: 'flow-123' };
    const mockFlowRunStatus = { state_type: 'COMPLETED' };

    (httpPost as jest.Mock).mockResolvedValueOnce(mockFlowRunResponse);
    (httpGet as jest.Mock).mockResolvedValueOnce(mockFlowRunStatus);

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-1'));

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession, 'prefect/v1/flows/deploy-1/flow_run/', {});
      expect(defaultProps.setFlowRunId).toHaveBeenCalledWith('flow-123');
      expect(defaultProps.fetchDbtTasks).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith('[DBT Run Task] Button Clicked');
    });
  });

  it('handles dbt run task failure with proper error toast', async () => {
    const error = new Error('Deployment failed');
    (httpPost as jest.Mock).mockRejectedValueOnce(error);

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-1'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new',
          toastState: expect.objectContaining({
            open: true,
            message: 'Deployment failed',
            severity: 'error',
          }),
        })
      );
    });
  });

  it('executes dbt test task successfully', async () => {
    const mockResponse = {
      status: 'success',
      result: ['test log 1', 'test log 2'],
    };
    (httpPost as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-2'));

    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(mockSession, 'prefect/tasks/2/run/', {});
      expect(defaultProps.setDbtRunLogs).toHaveBeenCalledWith(['test log 1', 'test log 2']);
    });
  });

  it('handles dbt test task with flow run id', async () => {
    const mockResponse = {
      status: 'success',
      result: [{ id: 'test-id', state_details: { flow_run_id: 'flow-123' } }],
    };
    const mockLogs = {
      logs: {
        logs: [{ message: 'log 1' }, { message: 'log 2' }],
      },
    };

    (httpPost as jest.Mock).mockResolvedValueOnce(mockResponse);
    (httpGet as jest.Mock).mockResolvedValueOnce(mockLogs);

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-2'));

    await waitFor(() => {
      expect(httpGet).toHaveBeenCalledWith(mockSession, 'prefect/flow_runs/flow-123/logs');
    });
  });

  it('handles task deletion successfully', async () => {
    (httpDelete as jest.Mock).mockResolvedValueOnce({ success: true });

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Open menu for the second task (client-generated)
    const buttonWithSvg = screen.getAllByRole('button', {
      name: (content, element) => element.querySelector('svg') !== null,
    });
    fireEvent.click(buttonWithSvg[0]);
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByText('I Understand the consequences, confirm'));

    await waitFor(() => {
      expect(httpDelete).toHaveBeenCalledWith(mockSession, `prefect/tasks/1/`);
      expect(defaultProps.fetchDbtTasks).toHaveBeenCalled();
    });
  });

  it('disables execute button when task is locked', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} isAnyTaskLocked={true} />
      </GlobalContext.Provider>
    );

    const executeButtons = screen.getAllByRole('button', { name: /Execute/i });
    executeButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('shows lock information when task is locked', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} isAnyTaskLocked={true} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('Triggered by: test')).toBeInTheDocument();
  });

  it('opens create task dialog when new task button is clicked', () => {
    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByText('+ New Task'));

    expect(screen.getByText('Add a new org task')).toBeInTheDocument();
    expect(mockTrackEvent).toHaveBeenCalledWith('[+ New Task] Button Clicked');
  });

  it('handles missing deployment ID gracefully', async () => {
    const tasksWithoutDeployment = [
      {
        ...mockTasks[0],
        deploymentId: '',
      },
    ];

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} tasks={tasksWithoutDeployment} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-1'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new',
          toastState: expect.objectContaining({
            open: true,
            message: 'No deployment found for this DBT task',
            severity: 'error',
          }),
        })
      );
    });
  });

  // it('handles flow run status polling', async () => {
  //   const mockFlowRunResponse = { flow_run_id: 'flow-123' };
  //   const mockRunningStatus = { state_type: 'RUNNING' };
  //   const mockCompletedStatus = { state_type: 'COMPLETED' };

  //   (httpPost as jest.Mock).mockResolvedValueOnce(mockFlowRunResponse);
  //   (httpGet as jest.Mock)
  //     .mockResolvedValueOnce(mockRunningStatus)
  //     .mockResolvedValueOnce(mockCompletedStatus);

  //   render(
  //     <GlobalContext.Provider value={mockContext}>
  //       <DBTTaskList {...defaultProps} />
  //     </GlobalContext.Provider>
  //   );

  //   fireEvent.click(screen.getByTestId('task-1'));

  //   await waitFor(() => {
  //     expect(defaultProps.setFlowRunId).toHaveBeenCalledWith('flow-123');
  //     expect(defaultProps.fetchDbtTasks).toHaveBeenCalled();
  //     expect(defaultProps.fetchLogs).toHaveBeenCalledWith('flow-123');
  //   });
  // });

  it('handles flow run failure status', async () => {
    const mockFlowRunResponse = { flow_run_id: 'flow-123' };
    const mockFailedStatus = { state_type: 'FAILED' };

    (httpPost as jest.Mock).mockResolvedValueOnce(mockFlowRunResponse);
    (httpGet as jest.Mock).mockResolvedValueOnce(mockFailedStatus);

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTaskList {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('task-1'));

    await waitFor(() => {
      expect(defaultProps.setFlowRunId).toHaveBeenCalledWith('flow-123');
      expect(defaultProps.fetchDbtTasks).toHaveBeenCalled();
    });
  });
});
