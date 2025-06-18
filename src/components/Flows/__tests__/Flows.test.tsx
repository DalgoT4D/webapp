import { render, screen, act, within, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Flows, FlowInterface, TaskLock } from '../Flows';
import { FlowRun } from '../SingleFlowRunHistory';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { GlobalContext } from '@/contexts/ContextProvider';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// Mock the useSyncLock hook
jest.mock('@/customHooks/useSyncLock', () => ({
  useSyncLock: () => ({
    tempSyncState: false,
    setTempSyncState: jest.fn(),
  }),
}));

// Mock the useTracking hook
jest.mock('@/contexts/TrackingContext', () => ({
  useTracking: () => jest.fn(),
}));

// Mock httpPost and httpDelete
jest.mock('@/helpers/http', () => ({
  httpPost: jest.fn(),
  httpDelete: jest.fn(),
}));

// Import the mocked functions
import { httpPost, httpDelete } from '@/helpers/http';

// Mock toast helpers
jest.mock('@/components/ToastMessage/ToastHelper', () => ({
  successToast: jest.fn(),
  errorToast: jest.fn(),
}));

describe('Flows Component', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'test@example.com' },
  };

  const mockGlobalContext = {
    Permissions: {
      state: [
        'can_view_pipeline',
        'can_run_pipeline',
        'can_edit_pipeline',
        'can_delete_pipeline',
        'can_create_pipeline',
      ],
      dispatch: jest.fn(),
    },
    Toast: {
      state: {
        message: '',
        open: false,
        severity: 'info' as const,
        currentToasts: [],
        isOpen: false,
        seconds: 5000,
        handleClose: jest.fn(),
      },
      dispatch: jest.fn(),
    },
    CurrentOrg: { state: { id: '1', name: 'Test Org' }, dispatch: jest.fn() },
    OrgUsers: { state: [], dispatch: jest.fn() },
    UnsavedChanges: { state: false, dispatch: jest.fn() },
  } as any;

  const defaultProps = {
    updateCrudVal: jest.fn(),
    mutate: jest.fn(),
    setSelectedFlowId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('handles flow with queued lock status', async () => {
    const queuedLock: TaskLock = {
      lockedBy: 'test@example.com',
      lockedAt: new Date().toISOString(),
      status: 'queued',
    };

    const queueInfo = {
      queue_no: 2,
      min_wait_time: 5,
      max_wait_time: 10,
    };

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'queued-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'queued-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: queuedLock,
                  queuedFlowRunWaitTime: queueInfo,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test queued status
    const flowstate = screen.getByTestId('flowstate-queued-flow');
    expect(flowstate).toBeInTheDocument();
    const { getByText } = within(flowstate);
    expect(getByText('queued')).toBeInTheDocument();
  });

  // ================================================================================
  it('handles flow with locked status', async () => {
    const lockedLock: TaskLock = {
      lockedBy: 'test@example.com',
      lockedAt: new Date().toISOString(),
      status: 'locked',
    };

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'locked-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'locked-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: lockedLock,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test locked status
    const flowstate = screen.getByTestId('flowstate-locked-flow');
    expect(flowstate).toBeInTheDocument();
    const { getByText } = within(flowstate);
    expect(getByText('locked')).toBeInTheDocument();
  });

  // ================================================================================
  it('handles flow with DBT test failed status', async () => {
    const startTime = new Date().toISOString();

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'dbt-failed-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'dbt-failed-deployment-id',
                  status: true,
                  lastRun: {
                    name: 'flow-run-dbt-failed',
                    status: 'FAILED',
                    state_name: 'DBT_TEST_FAILED',
                    startTime: startTime,
                    expectedStartTime: startTime,
                  } as FlowRun,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test DBT test failed status
    const flowstate = screen.getByTestId('flowstate-dbt-failed-flow');
    expect(flowstate).toBeInTheDocument();
    const { getByText } = within(flowstate);
    expect(getByText('dbt test failed')).toBeInTheDocument();
  });

  // ================================================================================
  it('handles flow with manual trigger by user', async () => {
    const startTime = '2025-05-21T10:00:00.0+00:00'; // After the tracking date

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'manual-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'manual-deployment-id',
                  status: true,
                  lastRun: {
                    name: 'flow-run-manual',
                    status: 'COMPLETED',
                    startTime: startTime,
                    expectedStartTime: startTime,
                    orguser: 'user@example.com',
                  } as FlowRun,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test that it shows the user who triggered the run
    const flowlastrun = screen.getByTestId('flowlastrun-by-manual-flow');
    expect(flowlastrun).toBeInTheDocument();
    const { getByText } = within(flowlastrun);
    expect(getByText('user')).toBeInTheDocument(); // trimmed email
  });

  it('handles quick run deployment success', async () => {
    (httpPost as jest.Mock).mockResolvedValueOnce({});

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'run-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'run-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Click run button
    const runButton = screen.getByTestId('btn-quickrundeployment-run-flow');
    await userEvent.click(runButton);

    // Verify API was called
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalledWith(
        mockSession,
        'prefect/v1/flows/run-deployment-id/flow_run/',
        {}
      );
    });
  });

  // ================================================================================
  it('handles quick run deployment error', async () => {
    (httpPost as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'error-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'error-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Click run button
    const runButton = screen.getByTestId('btn-quickrundeployment-error-flow');
    await userEvent.click(runButton);

    // Verify error handling
    await waitFor(() => {
      expect(httpPost).toHaveBeenCalled();
    });
  });

  // ================================================================================
  it('handles permissions correctly', async () => {
    const limitedContext = {
      ...mockGlobalContext,
      Permissions: {
        state: ['can_view_pipeline'], // Only view permission
        dispatch: jest.fn(),
      },
    };

    await act(async () => {
      render(
        <GlobalContext.Provider value={limitedContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'permission-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'permission-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Verify buttons are disabled due to lack of permissions
    const runButton = screen.getByTestId('btn-quickrundeployment-permission-flow');
    expect(runButton).toBeDisabled();
  });

  it('handles empty flows list', async () => {
    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows flows={[]} {...defaultProps} />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Should still render the header
    expect(screen.getByText('Pipelines')).toBeInTheDocument();
  });

  // ================================================================================
  it('handles flow with complete lock status showing last run', async () => {
    const completeLock: TaskLock = {
      lockedBy: 'test@example.com',
      lockedAt: new Date().toISOString(),
      status: 'complete',
    };

    const startTime = new Date().toISOString();

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'complete-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'complete-deployment-id',
                  status: true,
                  lastRun: {
                    name: 'flow-run-complete',
                    status: 'COMPLETED',
                    startTime: startTime,
                    expectedStartTime: startTime,
                  } as FlowRun,
                  lock: completeLock,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test locked status
    const flowstate = screen.getByTestId('flowstate-complete-flow');
    expect(flowstate).toBeInTheDocument();
    const { getByText } = within(flowstate);
    expect(getByText('locked')).toBeInTheDocument();

    // Should show last run instead of lock info since status is complete
    const flowlastrun = screen.getByTestId('flowlastrun-complete-flow');
    expect(flowlastrun).toBeInTheDocument();
  });

  // ================================================================================
  it('handles system user trigger display', async () => {
    const startTime = '2025-05-21T10:00:00.0+00:00'; // After the tracking date

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'system-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'system-deployment-id',
                  status: true,
                  lastRun: {
                    name: 'flow-run-system',
                    status: 'COMPLETED',
                    startTime: startTime,
                    expectedStartTime: startTime,
                    orguser: 'System',
                  } as FlowRun,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test that it shows System as the user who triggered the run
    const flowlastrun = screen.getByTestId('flowlastrun-by-system-flow');
    expect(flowlastrun).toBeInTheDocument();
    const { getByText } = within(flowlastrun);
    expect(getByText('System')).toBeInTheDocument();
  });

  // ================================================================================
  it('handles cancelled lock status', async () => {
    const cancelledLock: TaskLock = {
      lockedBy: 'test@example.com',
      lockedAt: new Date().toISOString(),
      status: 'cancelled',
    };

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'cancelled-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'cancelled-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: cancelledLock,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Test that cancelled status shows empty state
    const flowstate = screen.getByTestId('flowstate-cancelled-flow');
    expect(flowstate).toBeInTheDocument();
    const { getByText } = within(flowstate);
    expect(getByText('—')).toBeInTheDocument();
  });

  // ================================================================================
  it('handles flow with old run date (before tracking)', async () => {
    const startTime = '2025-05-19T10:00:00.0+00:00'; // Before the tracking date

    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'old-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'old-deployment-id',
                  status: true,
                  lastRun: {
                    name: 'flow-run-old',
                    status: 'COMPLETED',
                    startTime: startTime,
                    expectedStartTime: startTime,
                    orguser: 'user@example.com',
                  } as FlowRun,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Should not show "By" section for old runs
    expect(screen.queryByTestId('flowlastrun-by-old-flow')).not.toBeInTheDocument();
  });

  it('handles flow name display correctly', async () => {
    await act(async () => {
      render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'Test Flow Name',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'name-test-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // Should display the flow name
    expect(screen.getByText('Test Flow Name')).toBeInTheDocument();
  });

  it('handles no permissions scenario', async () => {
    const noPermissionsContext = {
      ...mockGlobalContext,
      Permissions: {
        state: [], // No permissions
        dispatch: jest.fn(),
      },
    };

    await act(async () => {
      render(
        <GlobalContext.Provider value={noPermissionsContext}>
          <SessionProvider session={mockSession}>
            <Flows
              flows={[
                {
                  name: 'no-permission-flow',
                  cron: '0 0 * * 1',
                  deploymentName: 'deployment-name',
                  deploymentId: 'no-permission-deployment-id',
                  status: true,
                  lastRun: null,
                  lock: null,
                  queuedFlowRunWaitTime: null,
                } as FlowInterface,
              ]}
              {...defaultProps}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      );
    });

    // All buttons should be disabled
    const runButton = screen.getByTestId('btn-quickrundeployment-no-permission-flow');
    expect(runButton).toBeDisabled();

    const logsButton = screen.getByTestId('btn-openhistory-no-permission-flow');
    expect(logsButton).toBeDisabled();
  });
});
