import { render, screen, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { SingleFlowRunHistory } from '../SingleFlowRunHistory';
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
      json: jest.fn().mockResolvedValueOnce({
        logs: {
          logs: [{ message: 'log-0-0' }, { message: 'log-0-1' }],
        },
      }),
    });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <SingleFlowRunHistory
            flowRun={{
              id: 'flow-run-id',
              name: 'flow-run-name',
              status: 'flow-run-status',
              lastRun: 'flow-run-lastRun',
              startTime: 'flow-run-startTime',
              expectedStartTime: 'flow-run-expectedStartTime',
            }}
          />
        </SessionProvider>
      );
    });

    const logmessages = screen.getByTestId('logmessages');
    expect(logmessages).toBeInTheDocument();
  });
});
