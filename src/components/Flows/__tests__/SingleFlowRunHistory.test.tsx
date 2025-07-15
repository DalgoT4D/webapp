import { render, screen, act, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { SingleFlowRunHistory } from '../SingleFlowRunHistory';
import '@testing-library/jest-dom';
import { errorToast } from '../../ToastMessage/ToastHelper';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

jest.mock('../../ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
}));

jest.mock('@/helpers/http', () => ({
  httpGet: jest.fn(),
}));

const mockSession = {
  expires: 'false',
  user: { email: 'a' },
};

const defaultFlowRun = {
  id: 'flow-run-id',
  name: 'flow-run-name',
  status: 'flow-run-status',
  lastRun: 'flow-run-lastRun',
  startTime: 'flow-run-startTime',
  expectedStartTime: 'flow-run-expectedStartTime',
};

const renderComponent = (flowRun: any = null) => {
  return render(
    <SessionProvider session={mockSession}>
      <SingleFlowRunHistory flowRun={flowRun} />
    </SessionProvider>
  );
};

describe('Flow Creation', () => {
  // ================================================================================
  it('renders the form', async () => {
    const { httpGet } = jest.requireMock('@/helpers/http');
    httpGet.mockResolvedValueOnce({
      logs: { logs: [{ message: 'log-0-0' }, { message: 'log-0-1' }] },
    });

    await act(async () => {
      renderComponent(defaultFlowRun);
    });

    const logmessages = screen.getByTestId('logmessages');
    expect(logmessages).toBeInTheDocument();
    expect(screen.getByText('flow-run-lastRun')).toBeInTheDocument();
    expect(screen.getByTestId('single-flow-run-logs')).toBeInTheDocument();
  });

  it('renders safely when no flowRun is provided', () => {
    renderComponent(null);
    expect(screen.getByTestId('single-flow-run-logs')).toBeInTheDocument();
  });

  it('calls errorToast when fetchLogs fails', async () => {
    const { httpGet } = jest.requireMock('@/helpers/http');
    httpGet.mockRejectedValueOnce(new Error('Failed to fetch logs'));

    await act(async () => {
      renderComponent(defaultFlowRun);
    });

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Failed to fetch logs', [], expect.any(Object));
    });
  });

  it('calls errorToast when fetchLogSummaries fails', async () => {
    const { httpGet } = jest.requireMock('@/helpers/http');
    httpGet.mockRejectedValueOnce(new Error('Failed to fetch summaries'));

    await act(async () => {
      renderComponent(defaultFlowRun);
    });

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Failed to fetch summaries', [], expect.any(Object));
    });
  });
});
