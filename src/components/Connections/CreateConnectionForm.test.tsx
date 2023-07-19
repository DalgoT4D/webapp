import {
  render,
  screen,
  within,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CreateConnectionForm from './CreateConnectionForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';

// const user = userEvent.setup();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// afterEach(() => {
//   const fakeResponse = {};
//   const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
//   const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
//   (global as any).fetch = mockedFetch;
// });

describe('Connections Setup', () => {
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

  it('renders the form', () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    render(
      <SessionProvider session={mockSession}>
        <CreateConnectionForm
          mutate={() => {}}
          showForm={true}
          setShowForm={() => {}}
        />
      </SessionProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const connectionName = screen.getByTestId('connectionName');
    expect(connectionName).toBeInTheDocument();

    const schemaName = screen.getByTestId('schemaName');
    expect(schemaName).toBeInTheDocument();

    const normalizationCheckbox = screen.getByTestId('normalizationCheckbox');
    expect(normalizationCheckbox).toBeInTheDocument();
  });

  it('check source stream on selection of source', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(SOURCES),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          catalog: {
            streams: [
              {
                stream: STREAMS[0],
              },
              {
                stream: STREAMS[1],
              },
            ],
          },
        }),
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
            <CreateConnectionForm
              mutate={() => {}}
              showForm={true}
              setShowForm={() => {}}
            />
          </SWRConfig>
        </SessionProvider>
      );
    });

    const sourceAutoCompelete = screen.getByTestId('sourceList');
    // check if the source autpcomplete exists
    await waitFor(() => {
      expect(sourceAutoCompelete).toBeInTheDocument();
    });

    // select the input text box inside autocomplete
    const sourceTextInput = within(sourceAutoCompelete).getByRole('combobox');
    sourceAutoCompelete.focus();

    // update the input text value and select it
    await fireEvent.change(sourceTextInput, {
      target: { value: 'Source 1' },
    });
    fireEvent.keyDown(sourceAutoCompelete, { key: 'ArrowDown' });
    await act(() => fireEvent.keyDown(sourceAutoCompelete, { key: 'Enter' }));

    // check if the source stream table is pushed to the dom
    const sourceStreamTable = await screen.findByTestId('sourceStreamTable');
    await waitFor(() => expect(sourceStreamTable).toBeInTheDocument());

    // source stream table should have two rows i.e. header and one source stream
    const sourceStreamTableRows = within(sourceStreamTable).getAllByRole('row');
    expect(sourceStreamTableRows.length).toBe(STREAMS.length + 1);

    // check if the headers are correct
    const headerCells = within(sourceStreamTableRows[0]).getAllByRole(
      'columnheader'
    );
    expect(headerCells.length).toBe(4);
    expect(headerCells[0].textContent).toBe('Stream');
    expect(headerCells[1].textContent).toBe('Sync?');
    expect(headerCells[2].textContent).toBe('Incremental?');
    expect(headerCells[3].textContent).toBe('Destination');

    // check if the stream mocked by us is present
    const streamRowCells = within(sourceStreamTableRows[1]).getAllByRole(
      'cell'
    );
    expect(streamRowCells.length).toBe(4);
    expect(streamRowCells[0].textContent).toBe(STREAMS[0].name);

    const connectButton = screen.getByText('Connect').closest('button');
    const streamSyncSwitch = screen.getByTestId('stream-sync-0').firstChild;
    let streamIncrementalSwitch = screen.getByTestId(
      'stream-incremental-0'
    ).firstChild;
    let streamSelectDestinationMode =
      screen.getByTestId('stream-destmode-0').childNodes[1];

    // stream is not selected for sync
    expect(streamSyncSwitch).not.toBeChecked();
    expect(connectButton).toBeDisabled();
    expect(streamIncrementalSwitch).toBeDisabled();
    expect(streamSelectDestinationMode).toBeDisabled();

    // select stream for sync
    await waitFor(() => userEvent.click(streamSyncSwitch));

    // Need to redraw these elements since jest updates its dom but
    // does not pass reference to some elements
    streamIncrementalSwitch = screen.getByTestId(
      'stream-incremental-0'
    ).firstChild;
    streamSelectDestinationMode =
      screen.getByTestId('stream-destmode-0').childNodes[1];

    // check if elements are abled
    expect(streamSyncSwitch).toBeChecked();
    expect(connectButton).not.toBeDisabled();
    expect(streamIncrementalSwitch).not.toBeDisabled();
    expect(streamSelectDestinationMode).not.toBeDisabled();

    // check stream incremental checkbox
    expect(streamIncrementalSwitch).not.toBeChecked();
    await act(() => userEvent.click(streamIncrementalSwitch));
    expect(streamIncrementalSwitch).toBeChecked();

    // check normalization after sync checkbox
    const normalizationCheckbox = screen.getByTestId('normalizationCheckbox')
      .firstChild?.firstChild;

    expect(normalizationCheckbox).not.toBeChecked();
    await act(() => userEvent.click(normalizationCheckbox));
    expect(normalizationCheckbox).toBeChecked();

    // stream not supporting incremental sync mode we should always have
    // incremental switch disabled
    // stream 2 doesn't support incremental sync
    const streamSyncSwitch1 = screen.getByTestId('stream-sync-1').firstChild;
    const streamIncrementalSwitch1 = screen.getByTestId(
      'stream-incremental-1'
    ).firstChild;
    expect(streamIncrementalSwitch1).toBeDisabled();
    // select stream 2 to sync
    await waitFor(() => userEvent.click(streamSyncSwitch1));
    expect(streamIncrementalSwitch1).toBeDisabled();
  });
});
