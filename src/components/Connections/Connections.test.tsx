import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Connections } from './Connections';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import userEvent from '@testing-library/user-event';
import { Dialog } from '@mui/material';

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
      <Dialog open={show} data-testid="test-create-conn-form">
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
      sourceDest: 'surveyCTO->postgres',
      lastSync: 'a day ago',
    },
    {
      name: 'test-conn-2',
      sourceDest: 'surveyCTO->postgres',
      lastSync: 'a day ago',
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

  it('check connection list headers', () => {
    render(
      <SessionProvider session={mockSession}>
        <Connections />
      </SessionProvider>
    );

    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    expect(connectionsTableRows.length).toBeGreaterThanOrEqual(1);

    // List headers
    const headerCells = within(connectionsTableRows[0]).getAllByRole(
      'columnheader'
    );
    expect(headerCells.length).toBe(4);
    expect(headerCells[0].textContent).toBe('Connection details');
    expect(headerCells[1].textContent).toBe('Source → Destination');
    expect(headerCells[2].textContent).toBe('Last sync');
    expect(headerCells[3].textContent).toBe('Actions');
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
      expect(connCells[1].textContent).toBe(CONNECTIONS[i]['sourceDest']);
      expect(connCells[2].textContent).toBe(CONNECTIONS[i]['lastSync']);
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

  it('click delete connection button', async () => {
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

    // look at only the first row of connection to check for delete button
    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    const connCells = within(connectionsTableRows[1]).getAllByRole('cell');
    expect(connCells.length).toBe(4);

    const deleteButton = connCells[3]?.firstChild?.childNodes[1];
    expect(deleteButton).toBeInTheDocument();
  });
});
