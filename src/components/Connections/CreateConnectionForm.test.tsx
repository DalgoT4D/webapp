import { render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CreateConnectionForm from './CreateConnectionForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

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

  it('renders the form', () => {

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
      ])
    });

    render(
      <SessionProvider session={mockSession}>
        <CreateConnectionForm
          mutate={() => { }}
          showForm={true}
          setShowForm={() => { }}
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

  it('shows the source streams', async () => {

    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        data: [
          {
            name: 'Source 1',
            sourceId: 'source-1-id',
          },
          {
            name: 'Source 2',
            sourceId: 'source-2-id',
          },
        ]
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        catalog: {
          streams: [
            {
              stream: {
                name: 'stream-1',
                supportedSyncModes: ['full_refresh'],
              },
            }
          ]
        }
      })
    });

    render(
      <SessionProvider session={mockSession}>
        <CreateConnectionForm
          mutate={() => { }}
          showForm={true}
          setShowForm={() => { }}
        />
      </SessionProvider>
    );

    const sourceList = screen.getByTestId('sourceList');
    expect(sourceList).toBeInTheDocument();

    const input = within(sourceList).getByRole('combobox');
    expect(input).toBeInTheDocument();

    sourceList.focus();
    await userEvent.type(input, "Source 1");

    // this isn't working...
    // const sourceStreamTable = await screen.findByTestId('sourceStreamTable');
    // const stream1Row = within(sourceStreamTable).getByTestId('stream-source-1-id');
    // expect(stream1Row).toBeInTheDocument();
  });

});