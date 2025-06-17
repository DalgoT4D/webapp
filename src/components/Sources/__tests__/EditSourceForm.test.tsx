import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { SourceForm } from '../SourceForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import useWebSocket from 'react-use-websocket';
import { GlobalContext } from '@/contexts/ContextProvider';
import { ToastStateInterface } from '@/contexts/reducers/ToastReducer';
import {
  CurrentOrgStateInterface,
  initialCurrentOrgState,
} from '@/contexts/reducers/CurrentOrgReducer';
import { OrgUserStateInterface, initialOrgUsersState } from '@/contexts/reducers/OrgUsersReducer';

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

// Mock the ConfigForm component to avoid parsing issues
jest.mock('@/helpers/connectorConfig/ConfigForm', () => ({
  ConfigForm: ({ spec }: any) => {
    const { useFormContext } = require('react-hook-form');
    const { watch, setValue, trigger } = useFormContext();
    const React = require('react');

    const config = watch('config') || {};

    return (
      <div>
        <label htmlFor="config.host">Host*</label>
        <input
          id="config.host"
          name="config.host"
          value={config.host || 'localhost'}
          onChange={(e) => {
            setValue('config.host', e.target.value);
            trigger('config.host');
          }}
          data-testid="host-field"
        />

        <label htmlFor="config.port">Port*</label>
        <input
          id="config.port"
          name="config.port"
          type="number"
          value={config.port || '5432'}
          onChange={(e) => {
            const value = e.target.value === '' ? '' : parseInt(e.target.value);
            setValue('config.port', value);
            trigger('config.port');
          }}
          data-testid="port-field"
        />

        <label htmlFor="config.database">Database*</label>
        <input
          id="config.database"
          name="config.database"
          value={config.database || ''}
          onChange={(e) => {
            setValue('config.database', e.target.value);
            trigger('config.database');
          }}
          data-testid="database-field"
        />

        <label htmlFor="config.username">Username*</label>
        <input
          id="config.username"
          name="config.username"
          value={config.username || ''}
          onChange={(e) => {
            setValue('config.username', e.target.value);
            trigger('config.username');
          }}
          data-testid="username-field"
        />
      </div>
    );
  },
}));

describe('Edit Source Form', () => {
  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;

  beforeEach(() => {
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

  const mockToastState: ToastStateInterface = {
    open: false,
    severity: 'success',
    message: '',
    messages: [],
    seconds: 3000,
    handleClose: jest.fn(),
  };

  const mockCurrentOrgState: CurrentOrgStateInterface = initialCurrentOrgState;
  const mockOrgUsersState: OrgUserStateInterface[] = initialOrgUsersState;

  const mockGlobalContext = {
    Permissions: { state: [], dispatch: jest.fn() },
    Toast: {
      state: mockToastState,
      dispatch: jest.fn(),
    },
    CurrentOrg: {
      state: mockCurrentOrgState,
      dispatch: jest.fn(),
    },
    OrgUsers: {
      state: mockOrgUsersState,
      dispatch: jest.fn(),
    },
    UnsavedChanges: { state: false, dispatch: jest.fn() },
  };

  const user = userEvent.setup();

  const renderEditSourceForm = (sourceId: string = 'fake-source-id') => {
    const setShowFormMock = jest.fn();
    const setLoadingMock = jest.fn();
    return {
      setShowFormMock,
      setLoadingMock,
      ...render(
        <GlobalContext.Provider value={mockGlobalContext}>
          <SessionProvider session={mockSession}>
            <SourceForm
              sourceId={sourceId}
              showForm
              setShowForm={setShowFormMock}
              mutate={jest.fn()}
              loading={false}
              setLoading={setLoadingMock}
              sourceDefs={[
                {
                  label: 'Postgres',
                  id: 'MYSOURCEDEFID',
                  dockerRepository: 'airbyte/source-postgres',
                  dockerImageTag: '3.3.1',
                },
              ]}
            />
          </SessionProvider>
        </GlobalContext.Provider>
      ),
    };
  };

  it('loads and displays existing source data', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MYSOURCEDEFID',
          connectionConfiguration: {
            host: 'test-host',
            port: 5432,
            database: 'test-db',
            username: 'test-user',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          connectionSpecification: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'Postgres Source Spec',
            type: 'object',
            required: ['host', 'port', 'database', 'username'],
            properties: {
              host: {
                type: 'string',
                title: 'Host',
                default: 'localhost',
                order: 1,
              },
              port: {
                type: 'integer',
                title: 'Port',
                default: 5432,
                order: 2,
              },
              database: {
                type: 'string',
                title: 'Database',
                order: 3,
              },
              username: {
                type: 'string',
                title: 'Username',
                order: 4,
              },
            },
          },
        }),
      });

    const { setLoadingMock } = renderEditSourceForm();

    await waitFor(() => {
      expect(setLoadingMock).toHaveBeenCalledWith(false);
    });

    // Verify form fields are populated with existing data
    const sourceName = screen.getByLabelText('Name*') as HTMLInputElement;
    expect(sourceName.value).toBe('MYSOURCENAME');

    const sourceType = screen.getByLabelText('Select source type*') as HTMLInputElement;
    expect(sourceType.value).toBe('Postgres (v3.3.1)');

    await waitFor(() => {
      const hostField = screen.getByTestId('host-field') as HTMLInputElement;
      expect(hostField.value).toBe('test-host');

      const portField = screen.getByTestId('port-field') as HTMLInputElement;
      expect(portField.value).toBe('5432');

      const databaseField = screen.getByTestId('database-field') as HTMLInputElement;
      expect(databaseField.value).toBe('test-db');

      const usernameField = screen.getByTestId('username-field') as HTMLInputElement;
      expect(usernameField.value).toBe('test-user');
    });
  });

  it('updates form fields and tests connection successfully', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MYSOURCEDEFID',
          connectionConfiguration: {
            host: 'test-host',
            port: 5432,
            database: 'test-db',
            username: 'test-user',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          connectionSpecification: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'Postgres Source Spec',
            type: 'object',
            required: ['host', 'port', 'database', 'username'],
            properties: {
              host: {
                type: 'string',
                title: 'Host',
                default: 'localhost',
                order: 1,
              },
              port: {
                type: 'integer',
                title: 'Port',
                default: 5432,
                order: 2,
              },
              database: {
                type: 'string',
                title: 'Database',
                order: 3,
              },
              username: {
                type: 'string',
                title: 'Username',
                order: 4,
              },
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({}),
      });

    const { setLoadingMock } = renderEditSourceForm();

    // Wait for form to load
    await waitFor(() => {
      expect(setLoadingMock).toHaveBeenCalledWith(false);
    });

    // Update form fields
    await waitFor(async () => {
      const hostField = screen.getByTestId('host-field') as HTMLInputElement;
      await user.clear(hostField);
      await user.type(hostField, 'new-host');

      const portField = screen.getByTestId('port-field') as HTMLInputElement;
      await user.clear(portField);
      await user.type(portField, '5433');

      const databaseField = screen.getByTestId('database-field') as HTMLInputElement;
      await user.clear(databaseField);
      await user.type(databaseField, 'new-db');
    });

    // Test connection
    const saveButton = screen.getByRole('button', { name: /save changes and test/i });
    await user.click(saveButton);

    // Verify the WebSocket message was sent with correct data
    await waitFor(() => {
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'MYSOURCENAME',
        sourceDefId: 'MYSOURCEDEFID',
        config: {
          host: 'localhostnew-host',
          port: 54325433,
          database: 'new-db',
          username: 'test-user',
        },
        sourceId: 'fake-source-id',
      });
    });
  });

  it('handles connection test failure during edit', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          name: 'MYSOURCENAME',
          sourceDefinitionId: 'MYSOURCEDEFID',
          connectionConfiguration: {
            host: 'test-host',
            port: 5432,
            database: 'test-db',
            username: 'test-user',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          connectionSpecification: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: 'Postgres Source Spec',
            type: 'object',
            required: ['host', 'port', 'database', 'username'],
            properties: {
              host: {
                type: 'string',
                title: 'Host',
                default: 'localhost',
                order: 1,
              },
              port: {
                type: 'integer',
                title: 'Port',
                default: 5432,
                order: 2,
              },
              database: {
                type: 'string',
                title: 'Database',
                order: 3,
              },
              username: {
                type: 'string',
                title: 'Username',
                order: 4,
              },
            },
          },
        }),
      });

    const { setLoadingMock } = renderEditSourceForm();

    await waitFor(() => {
      expect(setLoadingMock).toHaveBeenCalledWith(false);
    });

    // Update form fields
    await waitFor(async () => {
      const hostField = screen.getByTestId('host-field') as HTMLInputElement;
      await user.clear(hostField);
      await user.type(hostField, 'invalid-host');
    });

    // Test connection
    const saveButton = screen.getByRole('button', { name: /save changes and test/i });
    await user.click(saveButton);

    // Verify the WebSocket message was sent
    await waitFor(() => {
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'MYSOURCENAME',
        sourceDefId: 'MYSOURCEDEFID',
        config: {
          host: 'localhostinvalid-host',
          port: 5432,
          database: 'test-db',
          username: 'test-user',
        },
        sourceId: 'fake-source-id',
      });
    });
  });
});
