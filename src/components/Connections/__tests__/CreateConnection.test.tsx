import { render, screen, within, fireEvent, act, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CreateConnectionForm from '../CreateConnectionForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
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
describe('Create connection', () => {
  let mockServer: Server;

  afterEach(async () => {
    if (mockServer) {
      await new Promise((resolve) => {
        mockServer.stop(resolve); // Fully stop the WebSocket server
      });
    }
  });

  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

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

  const STREAMS = [
    {
      name: 'stream-1',
      supportedSyncModes: ['full_refresh', 'incremental'],
    },
    {
      name: 'stream-2',
      supportedSyncModes: ['full_refresh'],
    },
  ];

  it('mocks generateWebsocketUrl and tests WebSocket connection', async () => {
    mockServer = new Server('wss://mock-websocket-url');
    const mockGenerateWebsocketUrl = generateWebsocketUrl;

    // Mock the generateWebsocketUrl function
    mockGenerateWebsocketUrl.mockImplementation((path, session) => {
      return 'wss://mock-websocket-url';
    });

    mockServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.sourceId) {
          socket.send(
            JSON.stringify({
              status: 'success',
              catalog: {
                streams: [
                  { stream: { name: 'Stream 1' }, config: [] },
                  { stream: { name: 'Stream 2' }, config: [] },
                ],
              },
            })
          );
        }
      });
    });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateConnectionForm
            mutate={() => {}}
            showForm={true}
            setShowForm={() => {}}
            setBlockId={() => {}}
            connectionId=""
            setConnectionId={() => {}}
            blockId=""
            filteredSourceStreams={[]}
          />
        </SessionProvider>
      );
    });

    // Assert the mocked function was called
    expect(mockGenerateWebsocketUrl).toHaveBeenCalledWith(
      'airbyte/connection/schema_catalog',
      mockSession
    );

    // Clean up the mock WebSocket server
    //mockServer.close();
  });

  it('renders the form', () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    render(
      <SessionProvider session={mockSession}>
        <CreateConnectionForm
          mutate={() => {}}
          connectionId=""
          setConnectionId={() => {}}
          showForm={true}
          setShowForm={() => {}}
          blockId=""
          setBlockId={() => {}}
        />
      </SessionProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const connectionName = screen.getByTestId('connectionName');
    expect(connectionName).toBeInTheDocument();

    const schemaName = screen.getByTestId('schemaName');
    expect(schemaName).toBeInTheDocument();
  });

  it('checks source stream selection and WebSocket interactions', async () => {
    mockServer = new Server('wss://mock-websocket-url');
    const mockGenerateWebsocketUrl = generateWebsocketUrl;

    // Mock the generateWebsocketUrl function
    mockGenerateWebsocketUrl.mockImplementation((path, session) => {
      return 'wss://mock-websocket-url';
    });

    // Mock fetch responses
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(SOURCES), // Mock sources list
    });

    // WebSocket server behavior
    mockServer.on('connection', (socket) => {
      // Respond to the frontend after the source selection
      socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.sourceId) {
          // Simulate the WebSocket response after source selection
          socket.send(
            JSON.stringify({
              data: {
                result: {
                  catalog: {
                    streams: [
                      { stream: STREAMS[0], config: [] },
                      { stream: STREAMS[1], config: [] },
                    ],
                  },
                },
              },
              message: '',
              status: 'success',
            })
          );
        }
      });
    });

    // Render the component
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <CreateConnectionForm
              mutate={() => {}}
              showForm={true}
              setShowForm={() => {}}
              setBlockId={() => {}}
              connectionId=""
              setConnectionId={() => {}}
              blockId=""
              filteredSourceStreams={[]}
            />
          </SWRConfig>
        </SessionProvider>
      );
    });

    // Step 1: Check source autocomplete is rendered
    const sourceAutocomplete = screen.getByTestId('sourceList');
    await waitFor(() => expect(sourceAutocomplete).toBeInTheDocument());

    // Step 2: Select a source from the autocomplete
    const sourceTextInput = within(sourceAutocomplete).getByRole('combobox');
    sourceAutocomplete.focus();
    await fireEvent.change(sourceTextInput, { target: { value: 'Source 1' } });
    fireEvent.keyDown(sourceAutocomplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(sourceAutocomplete, { key: 'Enter' }));

    // Wait for the WebSocket response to be processed
    await waitFor(() => {
      const sourceStreamTable = screen.getByTestId('sourceStreamTable');
      expect(sourceStreamTable).toBeInTheDocument();
    });

    // Step 3: Validate source stream table rows
    await waitFor(() => {
      const sourceStreamTable = screen.getByTestId('sourceStreamTable');

      const sourceStreamTableRows = within(sourceStreamTable).getAllByRole('row');
      expect(sourceStreamTableRows.length).toBe(STREAMS.length + 2); // Header + Streams
      // Step 4: Validate table headers
      const headerCells = within(sourceStreamTableRows[0]).getAllByRole('columnheader');
      expect(headerCells.length).toBe(6);
      expect(headerCells[0].textContent).toBe('Stream');
      expect(headerCells[1].textContent).toBe('Sync?');
      expect(headerCells[2].textContent).toBe('Incremental?');
      expect(headerCells[3].textContent).toBe('Destination');
      expect(headerCells[4].textContent).toBe('Cursor Field');
      expect(headerCells[5].textContent).toBe('Primary Key');

      // Clean up the mock WebSocket server
      //mockServer.close();
    });
  });

  it('create connection success with WebSocket and fetch interactions', async () => {
    mockServer = new Server('wss://mock-websocket-url');
    const mockGenerateWebsocketUrl = generateWebsocketUrl;

    // Mock the generateWebsocketUrl function
    mockGenerateWebsocketUrl.mockImplementation((path, session) => {
      return 'wss://mock-websocket-url';
    });
    // Mock initial fetch for sources
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(SOURCES), // Mock sources list
    });

    // WebSocket behavior
    mockServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.sourceId) {
          // Respond with the catalog streams
          socket.send(
            JSON.stringify({
              data: {
                result: {
                  catalog: {
                    streams: [
                      { stream: STREAMS[0], config: [] },
                      { stream: STREAMS[1], config: [] },
                    ],
                  },
                },
              },
              message: '',
              status: 'success',
            })
          );
        }
      });
    });

    // Render the component
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <CreateConnectionForm
              mutate={() => {}}
              showForm={true}
              setShowForm={() => {}}
              setBlockId={() => {}}
              connectionId=""
              setConnectionId={() => {}}
              blockId=""
            />
          </SWRConfig>
        </SessionProvider>
      );
    });

    // Step 1: Fill in connection name
    const connectionName = screen.getByLabelText('Name*');
    await userEvent.type(connectionName, 'test-conn-name');

    // Step 2: Validate source autocomplete is rendered
    const sourceAutocomplete = screen.getByTestId('sourceList');
    await waitFor(() => expect(sourceAutocomplete).toBeInTheDocument());

    // Step 3: Select a source
    const sourceTextInput = within(sourceAutocomplete).getByRole('combobox');
    sourceAutocomplete.focus();
    await fireEvent.change(sourceTextInput, { target: { value: 'Source 1' } });
    fireEvent.keyDown(sourceAutocomplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(sourceAutocomplete, { key: 'Enter' }));

    // Step 4: Validate source stream table renders after WebSocket response
    await waitFor(() => {
      const sourceStreamTable = screen.getByTestId('sourceStreamTable');
      expect(sourceStreamTable).toBeInTheDocument();
      // Step 5: Validate rows in the source stream table
      const sourceStreamTableRows = within(sourceStreamTable).getAllByRole('row');
      expect(sourceStreamTableRows.length).toBe(STREAMS.length + 2); // Header + Streams
    });

    // Step 6: Select a stream for syncing
    const streamSyncSwitch = screen.getByTestId('stream-sync-0').firstChild;
    await waitFor(() => userEvent.click(streamSyncSwitch));

    // Step 7: Mock fetch for connection creation
    const mockCreateConnectionFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: 1 }),
    });

    (global as any).fetch = mockCreateConnectionFetch;

    // Step 8: Submit the form
    const connectButton = screen.getByText('Connect').closest('button');
    await act(() => connectButton?.click());

    // Step 9: Validate fetch for connection creation is called
    expect(mockCreateConnectionFetch).toHaveBeenCalledTimes(1);

    // Clean up mock server
    //mockServer.close();
  });

  it('create connection failed with WebSocket and fetch interactions', async () => {
    mockServer = new Server('wss://mock-websocket-url');
    const mockGenerateWebsocketUrl = generateWebsocketUrl;

    // Mock the generateWebsocketUrl function
    mockGenerateWebsocketUrl.mockImplementation((path, session) => {
      return 'wss://mock-websocket-url';
    });
    // Mock fetch for sources and catalog
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(SOURCES), // Mock sources list
    });

    // WebSocket server behavior
    mockServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.sourceId) {
          // Respond with catalog data
          socket.send(
            JSON.stringify({
              data: {
                result: {
                  catalog: {
                    streams: [
                      { stream: STREAMS[0], config: [] },
                      { stream: STREAMS[1], config: [] },
                    ],
                  },
                },
              },
              message: '',
              status: 'success',
            })
          );
        }
      });
    });

    // Render the component
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <CreateConnectionForm
              mutate={() => {}}
              showForm={true}
              setShowForm={() => {}}
              setBlockId={() => {}}
              connectionId=""
              setConnectionId={() => {}}
              blockId=""
            />
          </SWRConfig>
        </SessionProvider>
      );
    });

    // Step 1: Fill in the connection name
    const connectionName = screen.getByLabelText('Name*');
    await userEvent.type(connectionName, 'test-conn-name');

    // Step 2: Validate source autocomplete is rendered
    const sourceAutocomplete = screen.getByTestId('sourceList');
    await waitFor(() => expect(sourceAutocomplete).toBeInTheDocument());

    // Step 3: Select a source
    const sourceTextInput = within(sourceAutocomplete).getByRole('combobox');
    sourceAutocomplete.focus();
    await fireEvent.change(sourceTextInput, { target: { value: 'Source 1' } });
    fireEvent.keyDown(sourceAutocomplete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(sourceAutocomplete, { key: 'Enter' }));

    // Step 4: Validate source stream table renders after WebSocket response
    await waitFor(() => {
      const sourceStreamTable = screen.getByTestId('sourceStreamTable');
      expect(sourceStreamTable).toBeInTheDocument();
      // Step 5: Validate rows in the source stream table
      const sourceStreamTableRows = within(sourceStreamTable).getAllByRole('row');
      expect(sourceStreamTableRows.length).toBe(STREAMS.length + 2); // Header + Streams
    });

    // Step 6: Select a stream for syncing
    const streamSyncSwitch = screen.getByTestId('stream-sync-0').firstChild;
    await waitFor(() => userEvent.click(streamSyncSwitch));

    // Step 7: Mock fetch for connection creation (failure)
    const mockCreateConnectionFetch = jest.fn().mockResolvedValueOnce({
      ok: false, // Simulate a failed response
      json: jest.fn().mockResolvedValueOnce({ detail: 'could not create connection' }),
    });

    (global as any).fetch = mockCreateConnectionFetch;

    // Step 8: Submit the form
    const connectButton = screen.getByText('Connect').closest('button');
    await act(() => connectButton?.click());

    // Step 9: Validate the fetch was called once
    expect(mockCreateConnectionFetch).toHaveBeenCalledTimes(1);

    //check  how to show this test failed.
    //mockServer.close();
  });
});
