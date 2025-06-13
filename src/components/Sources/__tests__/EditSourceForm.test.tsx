import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import EditSourceForm from '../OldSourceForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import useWebSocket from 'react-use-websocket';

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

jest.mock('react-use-websocket', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Connections Setup', () => {
  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;

  beforeEach(() => {
    // Mock useWebSocket behavior
    sendJsonMessageMock = jest.fn();
    lastMessageMock = null;

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  const mockSession: Session = {
    expires: '1',
    user: { email: 'a' },
  };
  const user = userEvent.setup();

  // ============================================================
  it('renders the form', async () => {
    (global as any).fetch = jest
      .fn()
      // airbyte/sources/<sourceId>
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MY-SOURCEDEF-ID',
        }),
      })
      // airbyte/source_definitions/<sourceDefId>/specifications
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            properties: {
              host: {
                type: 'string',
                title: 'Host',
                field: 'host',
                default: 'localhost',
              },
            },
            required: ['host'],
          },
        ]),
      });

    const setShowFormMock = jest.fn();
    const setLoadingMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <EditSourceForm
          sourceId="fake-source-id"
          showForm
          setShowForm={(x) => setShowFormMock(x)}
          mutate={jest.fn}
          loading={false}
          setLoading={setLoadingMock}
          sourceDefs={[
            {
              label: 'Postgres',
              id: 'MYSOURCEDEFID',
              dockerRepository: 'airbyte/source-postgres',
              tag: '3.3.1',
            },
          ]}
        />
      </SessionProvider>
    );

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/source/check_connection'),
        expect.any(Object)
      )
    );

    await waitFor(() => {
      const savebutton = screen.getByTestId('savebutton');
      expect(savebutton).toBeInTheDocument();
    });

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    await waitFor(() => {
      expect(setLoadingMock).toHaveBeenLastCalledWith(false);
    });
    const sourceName = screen.getByLabelText('Name*') as HTMLInputElement;
    expect(sourceName).toBeInTheDocument();
    await waitFor(() => {
      expect(sourceName.value).toBe('MYSOURCENAME');
    });

    await user.click(cancelbutton);

    await waitFor(() => {
      expect(setShowFormMock).toHaveBeenCalledWith(false);
    });

    const sourceType = screen.getByLabelText('Select source type');
    expect(sourceType).toBeInTheDocument();
  });

  // ============================================================
  it('renders the form and updates a value', async () => {
    (global as any).fetch = jest
      .fn()
      // airbyte/sources/<sourceId>
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MY-SOURCEDEF-ID',
          sourceId: 'fake-source-id',
          sourceName: 'fake-source-name',
          workspaceId: 'fake-workspace-id',
          connectionConfiguration: {
            host: 'initial-host',
          },
        }),
      })
      // airbyte/sources/<sourceId>
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MY-SOURCEDEF-ID',
          sourceId: 'fake-source-id',
          sourceName: 'fake-source-name',
          workspaceId: 'fake-workspace-id',
          connectionConfiguration: {
            host: 'initial-host',
          },
        }),
      })
      // airbyte/source_definitions/<sourceDefId>/specifications
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            properties: {
              host: {
                type: 'string',
                title: 'Host',
                field: 'host',
                default: 'localhost',
              },
            },
            required: ['host'],
          },
        ]),
      });
    const setShowFormMock = jest.fn();
    const setLoadingMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <EditSourceForm
          sourceId="fake-source-id"
          showForm={true}
          setShowForm={(x) => setShowFormMock(x)}
          mutate={jest.fn}
          loading={false}
          setLoading={setLoadingMock}
          sourceDefs={[
            {
              label: 'Postgres',
              id: 'MYSOURCEDEFID',
              dockerRepository: 'airbyte/source-postgres',
              tag: '3.3.1',
            },
          ]}
        />
      </SessionProvider>
    );

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/source/check_connection'),
        expect.any(Object)
      )
    );

    await waitFor(() => {
      const savebutton = screen.getByTestId('savebutton');
      expect(savebutton).toBeInTheDocument();
    });

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    await waitFor(() => {
      expect(setLoadingMock).toHaveBeenLastCalledWith(false);
    });
    const sourceName = screen.getByLabelText('Name*') as HTMLInputElement;
    expect(sourceName).toBeInTheDocument();
    await waitFor(() => {
      expect(sourceName.value).toBe('MYSOURCENAME');
    });

    const sourceType = screen.getByLabelText('Select source type');
    expect(sourceType).toBeInTheDocument();

    await user.type(sourceName, '-appended');

    const savebutton = screen.getByTestId('savebutton');
    await user.click(savebutton);

    await waitFor(() => {
      expect(setLoadingMock).toHaveBeenCalled();
    });
  });
});
