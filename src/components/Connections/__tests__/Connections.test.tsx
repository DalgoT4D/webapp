import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Connections } from '../Connections';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import userEvent from '@testing-library/user-event';
import { Dialog } from '@mui/material';
import { lastRunTime } from '@/utils/common';
import { GlobalContext } from '@/contexts/ContextProvider';
// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

jest.mock('./../CreateConnectionForm', () => {
  const MockCreateConnection = ({ showForm }: any) => {
    return (
      <Dialog open={showForm} data-testid="test-create-conn-form">
        create-form-dialog-component
      </Dialog>
    );
  };

  MockCreateConnection.displayName = 'MockCreateConnection';

  return MockCreateConnection;
});

jest.mock('./../../Dialog/ConfirmationDialog', () => {
  const MockConfirmationDialog = ({ show }: any) => {
    return (
      <Dialog open={show} data-testid="test-confirm-dialog">
        confirmation-dialog-component
      </Dialog>
    );
  };

  MockConfirmationDialog.displayName = 'MockConfirmationDialog';

  return MockConfirmationDialog;
});

describe('Connections Setup', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  const CONNECTIONS = [
    {
      name: 'test-conn-1',
      source: { name: 'MySurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-1', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507', status: 'COMPLETED' },
    },
    {
      name: 'test-conn-2',
      source: { name: 'YourSurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-2', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507', status: 'FAILED' },
    },
    {
      name: 'test-conn-3',
      connectionId: 'test-conn-3',
      source: { name: 'MySurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-1', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507', status: 'COMPLETED' },
      lock: {
        status: 'queued',
        flowRunId: 'test-flow-run-id',
        lockedBy: 'test@example.com',
        lockedAt: '2024-03-20T10:00:00Z',
      },
    },
  ];

  const connections = (
    <SessionProvider session={mockSession}>
      <Connections />
    </SessionProvider>
  );

  const connectionWithConfig = (
    <GlobalContext.Provider
      value={{
        Permissions: {
          state: [
            'can_sync_sources',
            'can_reset_connection',
            'can_delete_connection',
            'can_edit_connection',
            'can_create_connection',
          ],
        },
        Toast: {
          state: { open: false, message: '', severity: 'success' },
          dispatch: jest.fn(),
        },
        CurrentOrg: {
          state: null,
          dispatch: jest.fn(),
        },
        OrgUsers: {
          state: [],
          dispatch: jest.fn(),
        },
        UnsavedChanges: {
          state: false,
          dispatch: jest.fn(),
        },
      }}
    >
      <SessionProvider session={mockSession}>
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
          }}
        >
          <Connections />
        </SWRConfig>
      </SessionProvider>
    </GlobalContext.Provider>
  );

  it('add connection button in the dom', () => {
    render(connections);
    const addNewConnectionButton = screen.getByTestId('add-new-connection');
    expect(addNewConnectionButton).toBeInTheDocument();
  });

  it('check empty list', () => {
    render(connections);

    expect(screen.getByText('No connection found. Please create one')).toBeInTheDocument();
  });

  it('check connections list', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
    });

    await act(async () => {
      render(connectionWithConfig);
    });

    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    expect(connectionsTableRows.length).toBe(CONNECTIONS.length + 1);

    // Check if connections name is shown in the list
    for (let i = 0; i < CONNECTIONS.length - 1; i++) {
      const connCells = within(connectionsTableRows[i + 1]).getAllByRole('cell');
      expect(connCells.length).toBe(4);
      expect(connCells[0].textContent).toBe(CONNECTIONS[i]['name']);
      expect(connCells[1].textContent).toBe(
        CONNECTIONS[i]['source']['name'] +
          CONNECTIONS[i]['source']['sourceName'] +
          '→' +
          CONNECTIONS[i]['destination']['name'] +
          CONNECTIONS[i]['destination']['destinationName']
      );
      expect(connCells[2].textContent).toBe(
        lastRunTime(CONNECTIONS[i]['lastRun']['startTime']) +
          (CONNECTIONS[i]['lastRun']['status'] === 'COMPLETED' ? 'success' : 'failed') +
          'View history'
      );
    }
  });

  it('click add connection button', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
    });

    await act(async () => {
      render(connectionWithConfig);
    });

    const addNewConnectionButton = screen.getByTestId('add-new-connection');
    expect(addNewConnectionButton).toBeInTheDocument();

    await userEvent.click(addNewConnectionButton);

    const createConnForm = screen.getByTestId('test-create-conn-form');
    expect(createConnForm).toBeInTheDocument();
  });

  it('should handle cancel queued job success case', async () => {
    const mockFetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(CONNECTIONS),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ success: true }),
        })
      );

    (global as any).fetch = mockFetch;

    render(connectionWithConfig);

    const cancelButton = await screen.findByTestId('cancel-queued-sync-test-conn-3');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('Cancel queued sync');

    await userEvent.click(cancelButton);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('prefect/flow_runs/test-flow-run-id/set_state'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('"name":"Cancelling","type":"CANCELLING"'),
      })
    );
  });

  it('should handle cancel queued job failure case', async () => {
    const mockFetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(CONNECTIONS),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: false }),
        })
      );

    (global as any).fetch = mockFetch;

    render(connectionWithConfig);

    const cancelButton = await screen.findByTestId('cancel-queued-sync-test-conn-3');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('Cancel queued sync');

    await userEvent.click(cancelButton);
    const failedButton = await screen.findByTestId('cancel-queued-sync-test-conn-3');
    expect(failedButton).toBeDisabled;

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('prefect/flow_runs/test-flow-run-id/set_state'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.stringContaining('"name":"Cancelling","type":"CANCELLING"'),
      })
    );
    expect(failedButton).not.toBeDisabled;
  });
});
