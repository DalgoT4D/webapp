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
// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

jest.mock('./CreateConnectionForm', () => {
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

jest.mock('./../Dialog/ConfirmationDialog', () => {
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
      source: { name: 'surveyCTO' },
      destination: { name: 'postgres' },
      lastRun: { startTime: '1686937507' },
    },
    {
      name: 'test-conn-2',
      source: { name: 'surveyCTO' },
      destination: { name: 'postgres' },
      lastRun: { startTime: '1686937507' },
    },
  ];

  it('add connection button in the dom', () => {
    render(
      <SessionProvider session={mockSession}>
        <Connections />
      </SessionProvider>
    );
    const addNewConnectionButton = screen.getByTestId('add-new-connection');
    expect(addNewConnectionButton).toBeInTheDocument();
  });

  it('check empty list', () => {
    render(
      <SessionProvider session={mockSession}>
        <Connections />
      </SessionProvider>
    );

    expect(
      screen.getByText('No connection found. Please create one')
    ).toBeInTheDocument();
  });

  it('check connections list', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
    });

    await act(async () => {
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
    });

    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    expect(connectionsTableRows.length).toBe(CONNECTIONS.length + 1);

    // Check if connections name is shown in the list
    for (let i = 0; i < CONNECTIONS.length; i++) {
      const connCells = within(connectionsTableRows[i + 1]).getAllByRole(
        'cell'
      );
      expect(connCells.length).toBe(4);
      expect(connCells[0].textContent).toBe(CONNECTIONS[i]['name']);
      expect(connCells[1].textContent).toBe(
        CONNECTIONS[i]['source']['name'] +
          ' → ' +
          CONNECTIONS[i]['destination']['name']
      );
      expect(connCells[2].textContent).toBe(
        lastRunTime(CONNECTIONS[i]['lastRun']['startTime'])
      );
    }
  });

  it('click add connection button', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
    });

    await act(async () => {
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
    });

    const addNewConnectionButton = screen.getByTestId('add-new-connection');
    expect(addNewConnectionButton).toBeInTheDocument();

    await userEvent.click(addNewConnectionButton);

    const createConnForm = screen.getByTestId('test-create-conn-form');
    expect(createConnForm).toBeInTheDocument();
  });
});
