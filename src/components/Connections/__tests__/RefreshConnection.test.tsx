import { render, screen, within, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { Connections } from '../Connections';
import { generateWebsocketUrl } from '@/helpers/websocket';
import { Server } from 'mock-socket';
// const user = userEvent.setup();

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

describe('Refresh connection', () => {
  const mockSession: Session = {
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
    },
    {
      blockId: 'test-conn-2',
      name: 'test-conn-2',
      source: { name: 'YourSurveyCTO', sourceName: 'surveyCTO' },
      destination: { name: 'postgres-2', destinationName: 'postgres' },
      lastRun: { startTime: '1686937507' },
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

  beforeEach(() => {});

  it('refresh connection', async () => {
    const mockServer = new Server('wss://mock-websocket-url');
    const mockGenerateWebsocketUrl = generateWebsocketUrl;

    // Mock the generateWebsocketUrl function
    mockGenerateWebsocketUrl.mockImplementation((path, session) => {
      return 'wss://mock-websocket-url';
    });

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

    // look at only the first row of connection
    const connectionsTable = screen.getByRole('table');
    const connectionsTableRows = within(connectionsTable).getAllByRole('row');
    const connCells = within(connectionsTableRows[1]).getAllByRole('cell');
    expect(connCells.length).toBe(4);

    const actionConnCell: any | HTMLElement | undefined = connCells[3]?.firstChild;

    const actionThreeDotsButton: HTMLElement | null =
      within(actionConnCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const refreshAction = actionMenuItems[2];
    await act(() => refreshAction.click());

    const confirmButton = screen.getByTestId('confirmbutton');

    // Mock the refresh api call success
    const refreshConnSuccess = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: 1,
      }),
    });
    (global as any).fetch = refreshConnSuccess;

    await act(() => confirmButton.click());

    expect(refreshConnSuccess).toHaveBeenCalled();

    // Mock the refresh api call failure
    const refreshConnFailure = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        detail: 'something went wrong',
      }),
    });
    (global as any).fetch = refreshConnFailure;

    await act(() => confirmButton.click());

    expect(refreshConnFailure).toHaveBeenCalled();
  });
});
