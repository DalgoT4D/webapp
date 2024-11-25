import { render, screen, within, act, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import '@testing-library/jest-dom';
import { Connections } from '../Connections';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Clear connection suite', () => {
  const mockSession = {
    expires: '1',
    user: { email: 'a', name: 'Delta', image: 'c' },
  };

  const CONNECTIONS = [
    {
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
    // Mock fetch for initial connections data
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

    // Verify the confirmation dialog appears
    const confirmDialog = screen.getByRole('dialog');
    expect(confirmDialog).toBeInTheDocument();
    const confirmButton = within(confirmDialog).getByTestId('confirmbutton');

    // Mock API success for clearing the connection
    const clearConnectionSuccess = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true }),
    });
    (global as any).fetch = clearConnectionSuccess;

    // Confirm the clear action
    await act(() => fireEvent.click(confirmButton));
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

    // Attempt clearing the connection again
    await act(() => fireEvent.click(confirmButton));
    await waitFor(() => {
      expect(clearConnectionFailure).toHaveBeenCalled();
    });
  });
});
