import { render, screen, act, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { FlowRunHistory, FlowRun } from '../FlowRunHistory';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Flow Creation', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  // ================================================================================
  it('renders the form', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId=""
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    const closebutton = screen.getByTestId('closebutton');
    expect(closebutton).toBeInTheDocument();
    await userEvent.click(closebutton);
    expect(handleCloseMock).toHaveBeenCalledWith(false);
  });

  it('fetches the flow run history', async () => {
    const dt = new Date(new Date().valueOf() - 15 * 24 * 60 * 60 * 1000);
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'flow-0',
          status: 'failed',
          logs: [{ message: 'log-0-0' }, { message: 'log-0-1' }],
          startTime: dt.toString(),
          expectedStartTime: dt.toString(),
        } as FlowRun,
        {
          name: 'flow-1',
          status: 'COMPLETED',
          logs: [{ message: 'log-1-0' }, { message: 'log-1-1' }],
          startTime: dt.toString(),
          expectedStartTime: dt.toString(),
        } as FlowRun,
      ]),
    });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    const info0 = screen.getByTestId('info-0');
    expect(info0).toBeInTheDocument();
    expect(info0).toHaveStyle('backgroundColor: #981F1F');

    const info1 = screen.getByTestId('info-1');
    expect(info1).toBeInTheDocument();
    expect(info1).toHaveStyle('backgroundColor: #399D47');

    // check lastRunTime
    const { getByText } = within(screen.getByTestId('lastrun-0'));
    expect(getByText('15 days ago')).toBeInTheDocument();

    // warning for task 0
    const warningambericon0 = screen.getByTestId('warningambericon-0');
    expect(warningambericon0).toBeInTheDocument();
    // success for task 1
    const taskalticon1 = screen.getByTestId('taskalticon-1');
    expect(taskalticon1).toBeInTheDocument();

    // look for log messages
    const showlogs = screen.getByTestId('showlogs-0');
    await userEvent.click(showlogs);

    const { getByText: getByText0 } = within(screen.getByTestId('logmessages-0'));
    expect(getByText0('- log-0-0')).toBeInTheDocument();
    expect(getByText0('- log-0-1')).toBeInTheDocument();
    const showless = screen.getByTestId('showlogs-after-0');
    expect(showless).toBeInTheDocument();
  });

  it('shows loading spinner when fetching flow runs', async () => {
    // Mock a delayed response to test loading state
    (global as any).fetch = jest.fn().mockReturnValue(
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: jest.fn().mockResolvedValue([]),
            }),
          100
        )
      )
    );

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows "No runs to show" message when no flow runs exist', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    expect(screen.getByText('No runs to show')).toBeInTheDocument();
  });

  it('handles flow run with null startTime using expectedStartTime', async () => {
    const dt = new Date(new Date().valueOf() - 10 * 24 * 60 * 60 * 1000);
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'flow-with-null-starttime',
          status: 'failed',
          logs: [{ message: 'log-message' }],
          startTime: null,
          expectedStartTime: dt.toString(),
        } as FlowRun,
      ]),
    });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    const { getByText } = within(screen.getByTestId('lastrun-0'));
    expect(getByText('10 days ago')).toBeInTheDocument();
  });

  it('shows and hides logs when clicking show more/less buttons', async () => {
    const dt = new Date();
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'flow-test',
          status: 'COMPLETED',
          logs: [{ message: 'test-log' }],
          startTime: dt.toString(),
          expectedStartTime: dt.toString(),
        } as FlowRun,
      ]),
    });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    // Initially logs should not be visible
    expect(screen.queryByTestId('logmessages-0')).not.toBeInTheDocument();

    // Click show more
    const showMoreButton = screen.getByTestId('showlogs-0');
    expect(showMoreButton).toHaveTextContent('show more');
    await userEvent.click(showMoreButton);

    // Logs should now be visible
    expect(screen.getByTestId('logmessages-0')).toBeInTheDocument();
    expect(showMoreButton).toHaveTextContent('show less');

    // Click show less
    await userEvent.click(showMoreButton);

    // Logs should be hidden again
    expect(screen.queryByTestId('logmessages-0')).not.toBeInTheDocument();
    expect(showMoreButton).toHaveTextContent('show more');
  });

  it('shows fetch more button when there are more logs to fetch', async () => {
    const dt = new Date();
    // Create 200 log messages to trigger the fetch more functionality
    const logsArray = Array.from({ length: 200 }, (_, i) => ({ message: `log-${i}` }));

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'flow-with-many-logs',
          status: 'COMPLETED',
          logs: logsArray,
          startTime: dt.toString(),
          expectedStartTime: dt.toString(),
        } as FlowRun,
      ]),
    });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    // Show logs
    const showLogsButton = screen.getByTestId('showlogs-0');
    await userEvent.click(showLogsButton);

    // Fetch more button should be visible
    const fetchMoreButton = screen.getByTestId('offset-0');
    expect(fetchMoreButton).toBeInTheDocument();
    expect(fetchMoreButton).toHaveTextContent('Fetch more');
  });

  it('fetches more logs when fetch more button is clicked', async () => {
    const dt = new Date();
    // Create 200 log messages to trigger the fetch more functionality
    const logsArray = Array.from({ length: 200 }, (_, i) => ({ message: `log-${i}` }));

    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            id: 'flow-id-1',
            name: 'flow-with-many-logs',
            status: 'COMPLETED',
            logs: logsArray,
            startTime: dt.toString(),
            expectedStartTime: dt.toString(),
          } as FlowRun,
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          logs: {
            logs: [{ message: 'additional-log-1' }, { message: 'additional-log-2' }],
          },
        }),
      });

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    // Show logs
    const showLogsButton = screen.getByTestId('showlogs-0');
    await userEvent.click(showLogsButton);

    // Click fetch more
    const fetchMoreButton = screen.getByTestId('offset-0');
    await act(async () => {
      await userEvent.click(fetchMoreButton);
    });

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/prefect/flow_runs/flow-id-1/logs?offset=200'),
      expect.any(Object)
    );
  });

  it('does not fetch flow runs when showFlowRunHistory is false', async () => {
    const fetchSpy = jest.fn();
    (global as any).fetch = fetchSpy;

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId="fake-deployment-id"
            showFlowRunHistory={false}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not fetch flow runs when deploymentId is empty', async () => {
    const fetchSpy = jest.fn();
    (global as any).fetch = fetchSpy;

    const handleCloseMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowRunHistory
            deploymentId=""
            showFlowRunHistory={true}
            setShowFlowRunHistory={handleCloseMock}
          />
        </SessionProvider>
      );
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
