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

  it('handles edit mode - loads existing connection data', async () => {
    const mockConnectionData = {
      name: 'existing-connection',
      source: { name: 'Source 1', id: 'source-1-id' },
      destinationSchema: 'production',
      syncCatalog: {
        streams: [
          {
            stream: { name: 'stream-1', supportedSyncModes: ['full_refresh', 'incremental'] },
            config: {
              selected: true,
              syncMode: 'incremental',
              destinationSyncMode: 'append_dedup',
              cursorField: ['updated_at'],
              primaryKey: [['id']],
            },
          },
        ],
      },
      catalogId: 'catalog-123',
      normalize: true,
    };

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockConnectionData),
    });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateConnectionForm
            mutate={() => {}}
            showForm={true}
            setShowForm={() => {}}
            setBlockId={() => {}}
            connectionId="connection-123"
            setConnectionId={() => {}}
            blockId=""
          />
        </SessionProvider>
      );
    });

    await waitFor(() => {
      const connectionName = screen.getByDisplayValue('existing-connection');
      expect(connectionName).toBeInTheDocument();
    });
  });

  it('handles form close and reset', async () => {
    const mockSetShowForm = jest.fn();
    const mockSetConnectionId = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <CreateConnectionForm
          mutate={() => {}}
          showForm={true}
          setShowForm={mockSetShowForm}
          setBlockId={() => {}}
          connectionId=""
          setConnectionId={mockSetConnectionId}
          blockId=""
        />
      </SessionProvider>
    );

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(mockSetShowForm).toHaveBeenCalledWith(false);
    expect(mockSetConnectionId).toHaveBeenCalledWith('');
  });

  it('handles connection update success', async () => {
    const mockConnectionData = {
      name: 'existing-connection',
      source: { name: 'Source 1', id: 'source-1-id' },
      destinationSchema: 'production',
      syncCatalog: {
        streams: [
          {
            stream: { name: 'stream-1', supportedSyncModes: ['full_refresh', 'incremental'] },
            config: {
              selected: true,
              syncMode: 'full_refresh',
              destinationSyncMode: 'overwrite',
              cursorField: [],
              primaryKey: [],
            },
          },
        ],
      },
      catalogId: 'catalog-123',
      normalize: false,
    };

    // Mock the GET request for existing connection
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockConnectionData),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ success: true }),
      });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateConnectionForm
            mutate={() => {}}
            showForm={true}
            setShowForm={() => {}}
            setBlockId={() => {}}
            connectionId="connection-123"
            setConnectionId={() => {}}
            blockId=""
          />
        </SessionProvider>
      );
    });

    await waitFor(() => {
      const connectionName = screen.getByDisplayValue('existing-connection');
      expect(connectionName).toBeInTheDocument();
    });

    // Submit the form to update
    const connectButton = screen.getByText('Connect');
    await userEvent.click(connectButton);

    // Verify the PUT request was made
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('Stream Column Selection', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const SOURCES = [
    {
      name: 'Source With Columns',
      sourceId: 'source-with-cols-id',
    },
  ];

  const STREAMS_WITH_COLUMNS = [
    {
      stream: {
        name: 'users',
        supportedSyncModes: ['full_refresh', 'incremental'],
        jsonSchema: {
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
            updated_at: { type: ['null', 'string'], format: 'date-time' },
          },
        },
        defaultCursorField: ['updated_at'],
        sourceDefinedPrimaryKey: [],
      },
      config: {
        selected: false,
        syncMode: 'full_refresh',
        destinationSyncMode: 'overwrite',
        primaryKey: [],
        cursorField: ['updated_at'],
      },
    },
  ];

  let mockServer: Server;

  // This helper function robustly finds a table cell, resolving ambiguity
  const findColumnCell = async (name: string) => {
    // Wait for all elements with the text to appear, then filter for the table cell
    const allElements = await screen.findAllByText(name);
    const cell = allElements.find((el) => el.tagName.toLowerCase() === 'td');
    if (!cell) {
      throw new Error(`Could not find a table cell ('td') with text: ${name}`);
    }
    return cell;
  };

  beforeEach(async () => {
    // Setup mock WebSocket server
    mockServer = new Server('wss://mock-websocket-url-columns');
    const mockGenerateWebsocketUrl = generateWebsocketUrl as jest.Mock;
    mockGenerateWebsocketUrl.mockReturnValue('wss://mock-websocket-url-columns');

    mockServer.on('connection', (socket) => {
      socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message as string);
        if (parsedMessage.sourceId) {
          socket.send(
            JSON.stringify({
              status: 'success',
              data: {
                result: {
                  catalog: { streams: STREAMS_WITH_COLUMNS },
                  catalogId: 'catalog-for-cols-123',
                },
              },
            })
          );
        }
      });
    });

    // Mock fetch for sources
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(SOURCES),
    });

    // Render the component
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{ dedupingInterval: 0, fetcher: (url) => fetch(url).then((res) => res.json()) }}
          >
            <CreateConnectionForm
              mutate={() => {}}
              showForm={true}
              setShowForm={() => {}}
              connectionId=""
              setConnectionId={() => {}}
            />
          </SWRConfig>
        </SessionProvider>
      );
    });

    // Select the source to load streams
    const sourceAutocomplete = await screen.findByTestId('sourceList');
    const sourceInput = within(sourceAutocomplete).getByRole('combobox');
    await userEvent.type(sourceInput, 'Source With Columns');
    const sourceOption = await screen.findByRole('option', { name: 'Source With Columns' });
    await userEvent.click(sourceOption);
  });

  afterEach(() => {
    if (mockServer) {
      mockServer.stop();
    }
  });

  it('should expand to show column details and allow toggling column sync', async () => {
    const user = userEvent.setup();
    // 1. Wait for the stream row to be ready, then select it
    const streamSyncSwitch = (await screen.findByTestId('stream-sync-0')).querySelector('input');
    await user.click(streamSyncSwitch!);

    // 2. Expand the column details section
    const expandButton = screen.getByRole('button', { name: /Expand column details/i });
    await user.click(expandButton);

    // 3. Verify column table is visible and toggle a column
    const emailCell = await findColumnCell('email');
    const emailRow = emailCell.closest('tr');
    const emailSyncSwitch = within(emailRow!).getByRole('checkbox') as HTMLInputElement;

    expect(emailSyncSwitch).toBeChecked();
    await user.click(emailSyncSwitch);
    expect(emailSyncSwitch).not.toBeChecked();
  });

  it('should disable sync switch for primary key and cursor fields', async () => {
    const user = userEvent.setup();

    // 1. Wait for stream to render, then select it and set to incremental
    const streamSyncSwitch = (await screen.findByTestId('stream-sync-0')).querySelector('input');
    await user.click(streamSyncSwitch!);
    const incrementalSwitch = screen.getByTestId('stream-incremental-0').querySelector('input');
    await user.click(incrementalSwitch!);

    // 2. Set destination mode to append_dedup
    const destModeSelect = screen.getByTestId('stream-destmode-0');
    await user.click(within(destModeSelect).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: /Append \/ Dedup/i }));

    // 3. Set a primary key ('id')
    const primaryKeySelect = screen.getByTestId('stream-primarykey-0');
    await user.click(within(primaryKeySelect).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'id' }));
    await user.keyboard('{escape}'); // Close dropdown

    // 4. Expand the column details
    await user.click(screen.getByRole('button', { name: /Expand column details/i }));

    // 5. Assert switches are disabled
    const cursorCell = await findColumnCell('updated_at');
    const cursorRow = cursorCell.closest('tr');
    expect(within(cursorRow!).getByRole('checkbox')).toBeDisabled();
    expect(within(cursorRow!).getByRole('checkbox')).toBeChecked();

    const pkCell = await findColumnCell('id');
    const pkRow = pkCell.closest('tr');
    expect(within(pkRow!).getByRole('checkbox')).toBeDisabled();
    expect(within(pkRow!).getByRole('checkbox')).toBeChecked();

    const nameCell = await findColumnCell('name');
    const nameRow = nameCell.closest('tr');
    expect(within(nameRow!).getByRole('checkbox')).not.toBeDisabled();
  });

  it('should automatically select a column when it is set as a primary key', async () => {
    const user = userEvent.setup();

    // 1. Wait for stream to render, then select and expand it
    const streamSyncSwitch = (await screen.findByTestId('stream-sync-0')).querySelector('input');
    await user.click(streamSyncSwitch!);
    await user.click(screen.getByRole('button', { name: /Expand column details/i }));

    // 2. Deselect the 'id' column initially
    const idCell = await findColumnCell('id');
    const idRow = idCell.closest('tr');
    const idSyncSwitch = within(idRow!).getByRole('checkbox') as HTMLInputElement;
    await user.click(idSyncSwitch);
    expect(idSyncSwitch).not.toBeChecked();

    // 3. Set sync and destination modes
    await user.click(screen.getByTestId('stream-incremental-0').querySelector('input')!);
    await user.click(within(screen.getByTestId('stream-destmode-0')).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: /Append \/ Dedup/i }));

    // 4. Select 'id' as the primary key
    await user.click(within(screen.getByTestId('stream-primarykey-0')).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'id' }));

    // 5. Verify the 'id' column's sync switch is now checked and disabled
    await waitFor(() => {
      expect(idSyncSwitch).toBeChecked();
      expect(idSyncSwitch).toBeDisabled();
    });
  });
});
