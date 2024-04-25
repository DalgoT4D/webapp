import { render, screen, within, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { Connections } from '../Connections';
import userEvent from '@testing-library/user-event';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

jest.mock('./../../../utils/common');

describe('Sync connection suite', () => {
  const user = userEvent.setup();
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  const CONNECTIONS = [
    {
      connectionId: 'connection-id-1',
      blockId: 'test-conn-1',
      name: 'test-conn-1',
      source: { name: 'MySurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-1', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507' },
      deploymentId: 'deploy-id-1',
    },
    {
      connectionId: 'connection-id-2',
      blockId: 'test-conn-2',
      name: 'test-conn-2',
      source: { name: 'YourSurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-2', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507' },
      deploymentId: 'deploy-id-2',
    },
  ];

  const SOURCES = [
    {
      name: 'Source 1',
      sourceId: 'source-1-id',
    },
    {
      name: 'Source 2',
      sourceId: 'source-2-id',
    },
  ];

  it('Sync connection', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(SOURCES),
      });

    render(
      <SessionProvider session={mockSession}>
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) =>
              fetch(resource, {}).then((res) => res.json()),
          }}
        >
          <Connections />
        </SWRConfig>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // look at only the first row of connection
    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    const connCells = within(connectionsTableRows[1]).getAllByRole('cell');
    await waitFor(() => {
      expect(connCells.length).toBe(4);
    });

    const actionConnCell: any | HTMLElement | undefined =
      connCells[3]?.firstChild;

    const syncButton = within(actionConnCell).getByTestId(
      `sync-${CONNECTIONS[0].blockId}`
    );

    // mock flow logs and flow status for successful sync
    const flowStatusAndLogsFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          flow_run_id: 'test-flow-run-id-1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          state_type: 'RUNNING',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          logs: {
            offset: 0,
            logs: [
              { message: 'message-1' },
              { message: 'message-2' },
              { message: 'message-3' },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          state_type: 'RUNNING',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          logs: {
            offset: 0,
            logs: [
              { message: 'message-4' },
              { message: 'message-5' },
              { message: 'message-6' },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          state_type: 'COMPLETED',
        }),
      });

    (global as any).fetch = flowStatusAndLogsFetch;

    await user.click(syncButton);

    await waitFor(() => {
      expect(screen.queryByTestId('sync-icon')).toBeNull();
    });
  });

  it('sync connection - flow run id not found', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce(() => ({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
      }))
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(SOURCES),
      });

    render(
      <SessionProvider session={mockSession}>
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) =>
              fetch(resource, {}).then((res) => res.json()),
          }}
        >
          <Connections />
        </SWRConfig>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // look at only the first row of connection
    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    const connCells = within(connectionsTableRows[1]).getAllByRole('cell');
    await waitFor(() => {
      expect(connCells.length).toBe(4);
    });

    const actionConnCell: any | HTMLElement | undefined =
      connCells[3]?.firstChild;

    const syncButton = within(actionConnCell).getByTestId(
      `sync-${CONNECTIONS[0].blockId}`
    );

    const fetchFlowRunIdFailed = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        detail: 'resource not found',
      }),
    });

    (global as any).fetch = fetchFlowRunIdFailed;

    await user.click(syncButton);

    await waitFor(() => {
      expect(fetchFlowRunIdFailed).toHaveBeenCalled();
    });
  });
});
