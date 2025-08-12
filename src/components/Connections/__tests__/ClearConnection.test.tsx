import { render, screen, within, act, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import '@testing-library/jest-dom';
import React from 'react';
import { Connections } from '../Connections';
import { generateWebsocketUrl } from '@/helpers/websocket';
import { Server } from 'mock-socket';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

jest.mock('@/helpers/websocket', () => ({
  generateWebsocketUrl: jest.fn(),
}));

// Mock the PendingActionsAccordion component to avoid API calls
jest.mock('./../PendingActions', () => ({
  __esModule: true,
  default: () => <div data-testid="pending-actions-accordion">Mocked PendingActionsAccordion</div>,
}));

jest.mock('./../CreateConnectionForm', () => ({
  __esModule: true,
  default: () => <div data-testid="create-connection-form">Mocked CreateConnectionForm</div>,
}));

describe('Clear connection suite', () => {
  const mockSession = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  const CONNECTIONS = [
    {
      connectionId: 'conn-1-id',
      blockId: 'test-conn-1',
      name: 'test-conn-1',
      source: { name: 'MySurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-1', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507' },
      clearConnDeploymentId: 'deployment-123',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('clears the connection successfully and handles failure', async () => {
    const mockServer = new Server('wss://mock-websocket-url');

    // Mock the generateWebsocketUrl function
    (generateWebsocketUrl as jest.Mock).mockImplementation(() => {
      return 'wss://mock-websocket-url';
    });
    // Mock fetch for all API calls that the component makes
    const mockFetch = jest
      .fn()
      // Initial connections data
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(CONNECTIONS),
      })
      // StreamSelectionDialog streams call
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          syncCatalog: {
            streams: [{ config: { selected: true }, stream: { name: 'stream1' } }],
          },
          connectionId: 'conn-1-id',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          syncCatalog: {
            streams: [{ config: { selected: true }, stream: { name: 'stream1' } }],
          },
          connectionId: 'conn-1-id',
        }),
      });

    (global as any).fetch = mockFetch;

    await act(async () => {
      render(
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
      );
    });

    // Locate the first row in the connections table
    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    const connCells = within(connectionsTableRows[1]).getAllByRole('cell');
    expect(connCells.length).toBe(4);

    // Open the action menu for the first connection
    const actionConnCell: any = connCells[3].firstChild;
    const actionThreeDotsButton: HTMLElement | null =
      within(actionConnCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // Select the "Clear Connection" option
    const actionMenuItems = screen.getAllByRole('menuitem');
    const clearAction = actionMenuItems[3];
    expect(clearAction).toBeInTheDocument();
    await act(() => fireEvent.click(clearAction!));

    // Check the streams in the clear dialog and select all to clear
    const streamsDialog = screen.getByRole('dialog');
    const selectAllCheckbox = within(streamsDialog).getByRole('checkbox', { name: /select all/i });
    await act(() => fireEvent.click(selectAllCheckbox));

    // Confirm the selection
    const clearStreamDialog = screen.getByRole('dialog');
    expect(clearStreamDialog).toBeInTheDocument();
    const confirmButton = within(clearStreamDialog).getByTestId('confirmbutton');
    await act(() => fireEvent.click(confirmButton));

    // Check for the confirmation dialog
    const finalConfirmDialog = screen.getByRole('dialog');
    expect(finalConfirmDialog).toBeInTheDocument();

    const confirmButtonFinal = within(finalConfirmDialog).getByTestId('confirmbutton');
    expect(confirmButtonFinal).toBeInTheDocument();
    const cancelButton = within(finalConfirmDialog).getByTestId('cancelbutton');
    expect(cancelButton).toBeInTheDocument();

    // Mock API success for clearing the connection
    const clearConnectionSuccess = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true }),
    });
    (global as any).fetch = clearConnectionSuccess;

    // Hit the final confirm button to submit streams for clear
    await act(() => fireEvent.click(confirmButtonFinal));
    expect(clearConnectionSuccess).toHaveBeenCalledWith(
      expect.stringContaining('deployment-123'),
      expect.any(Object)
    );

    // Mock API failure for clearing the connection
    const clearConnectionFailure = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: 'Something went wrong' }),
    });
    (global as any).fetch = clearConnectionFailure;
  });
});
