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
});
