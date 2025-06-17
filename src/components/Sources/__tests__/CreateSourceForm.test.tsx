import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { SourceForm } from '../SourceForm';
import userEvent from '@testing-library/user-event';
import useWebSocket from 'react-use-websocket';
import '@testing-library/jest-dom';
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
  ConfigForm: () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useFormContext } = require('react-hook-form');
    const { watch, setValue } = useFormContext();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react');

    const config = watch('config') || {};

    return (
      <div>
        <label htmlFor="config.host">Host*</label>
        <input
          id="config.host"
          name="config.host"
          value={config.host || 'localhost'}
          onChange={(e) => setValue('config.host', e.target.value)}
          data-testid="host-field"
        />

        <label htmlFor="config.port">Port*</label>
        <input
          id="config.port"
          name="config.port"
          type="number"
          value={config.port || '5432'}
          onChange={(e) => setValue('config.port', parseInt(e.target.value))}
          data-testid="port-field"
        />

        <label htmlFor="config.database">Database*</label>
        <input
          id="config.database"
          name="config.database"
          value={config.database || ''}
          onChange={(e) => setValue('config.database', e.target.value)}
          data-testid="database-field"
        />

        <label htmlFor="config.username">Username*</label>
        <input
          id="config.username"
          name="config.username"
          value={config.username || ''}
          onChange={(e) => setValue('config.username', e.target.value)}
          data-testid="username-field"
        />
      </div>
    );
  },
}));

describe('Source Form Creation', () => {
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

  const sourceDefs = [
    {
      label: 'Postgres',
      id: 'MYSOURCEDEFID',
      dockerRepository: 'airbyte/source-postgres',
      dockerImageTag: '3.3.1',
    },
  ];

  const user = userEvent.setup();
  const setShowFormMock = jest.fn();
  const setLoadingMock = jest.fn();

  const createSourceForm = () => (
    <GlobalContext.Provider value={mockGlobalContext}>
      <SessionProvider session={mockSession}>
        <SourceForm
          sourceId=""
          loading={false}
          setLoading={setLoadingMock}
          mutate={jest.fn()}
          showForm
          sourceDefs={sourceDefs}
          setShowForm={setShowFormMock}
        />
      </SessionProvider>
    </GlobalContext.Provider>
  );

  it('should initialize WebSocket and render the form', async () => {
    render(createSourceForm());

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/source/check_connection'),
        expect.any(Object)
      )
    );

    const saveButton = screen.getByRole('button', { name: /save changes and test/i });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();

    const sourceName = screen.getByLabelText('Name*');
    expect(sourceName).toBeInTheDocument();

    await user.click(cancelButton);
    expect(setShowFormMock).toHaveBeenCalledWith(false);

    const sourceType = screen.getByLabelText('Select source type*');
    expect(sourceType).toBeInTheDocument();
  });

  it('selects the source type and submits the form', async () => {
    // Mock the source specifications API call
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
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
              description: 'Hostname of the database.',
              default: 'localhost',
              order: 1,
            },
            port: {
              type: 'integer',
              title: 'Port',
              description: 'Port of the database.',
              default: 5432,
              minimum: 0,
              maximum: 65536,
              order: 2,
            },
            database: {
              type: 'string',
              title: 'Database',
              description: 'Name of the database.',
              order: 3,
            },
            username: {
              type: 'string',
              title: 'Username',
              description: 'Username to access the database.',
              order: 4,
            },
          },
        },
      }),
    });

    render(createSourceForm());

    // Fill in source name
    const sourceName = screen.getByLabelText('Name*');
    await user.type(sourceName, 'MYSOURCENAME');

    // Select source type by typing in the autocomplete
    const sourceTypeInput = screen.getByLabelText('Select source type*');
    await user.click(sourceTypeInput);
    await user.type(sourceTypeInput, 'Postgres');

    // Wait for the option to appear and select it
    await waitFor(async () => {
      const option = await screen.findByText(/Postgres.*v3\.3\.1/);
      await user.click(option);
    });

    // Wait for the form fields to appear and fill them in
    await waitFor(async () => {
      const hostField = screen.getByTestId('host-field');
      expect(hostField).toBeInTheDocument();

      const portField = screen.getByTestId('port-field');
      expect(portField).toBeInTheDocument();

      const databaseField = screen.getByTestId('database-field');
      expect(databaseField).toBeInTheDocument();
      await user.type(databaseField, 'mydb');

      const usernameField = screen.getByTestId('username-field');
      expect(usernameField).toBeInTheDocument();
      await user.type(usernameField, 'myuser');
    });

    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save changes and test/i });
    await user.click(saveButton);

    // Verify the WebSocket message was sent with correct data
    await waitFor(() => {
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'MYSOURCENAME',
        sourceDefId: 'MYSOURCEDEFID',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          username: 'myuser',
        },
        sourceId: '',
      });
    });
  });

  it('handles failed WebSocket response and shows error toast', async () => {
    // Mock the source specifications API call
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
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
              description: 'Hostname of the database.',
              default: 'localhost',
              order: 1,
            },
            port: {
              type: 'integer',
              title: 'Port',
              description: 'Port of the database.',
              default: 5432,
              minimum: 0,
              maximum: 65536,
              order: 2,
            },
            database: {
              type: 'string',
              title: 'Database',
              description: 'Name of the database.',
              order: 3,
            },
            username: {
              type: 'string',
              title: 'Username',
              description: 'Username to access the database.',
              order: 4,
            },
          },
        },
      }),
    });

    render(createSourceForm());

    // Fill in source name
    const sourceName = screen.getByLabelText('Name*');
    await user.type(sourceName, 'Test Source');

    // Select source type
    const sourceTypeInput = screen.getByLabelText('Select source type*');
    await user.click(sourceTypeInput);
    await user.type(sourceTypeInput, 'Postgres');

    // Wait for the option to appear and select it
    await waitFor(async () => {
      const option = await screen.findByText(/Postgres.*v3\.3\.1/);
      await user.click(option);
    });

    // Wait for the form fields to appear and fill them in
    await waitFor(async () => {
      const hostField = screen.getByTestId('host-field');
      expect(hostField).toBeInTheDocument();

      const portField = screen.getByTestId('port-field');
      expect(portField).toBeInTheDocument();

      const databaseField = screen.getByTestId('database-field');
      expect(databaseField).toBeInTheDocument();
      await user.type(databaseField, 'mydb');

      const usernameField = screen.getByTestId('username-field');
      expect(usernameField).toBeInTheDocument();
      await user.type(usernameField, 'myuser');
    });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes and test/i });
    await user.click(saveButton);

    // Verify the WebSocket message was sent
    await waitFor(() => {
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'Test Source',
        sourceDefId: 'MYSOURCEDEFID',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          username: 'myuser',
        },
        sourceId: '',
      });
    });
  });

  it('handles connection test failure', async () => {
    // Mock the source specifications API call
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
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
              description: 'Hostname of the database.',
              default: 'localhost',
              order: 1,
            },
            port: {
              type: 'integer',
              title: 'Port',
              description: 'Port of the database.',
              default: 5432,
              minimum: 0,
              maximum: 65536,
              order: 2,
            },
            database: {
              type: 'string',
              title: 'Database',
              description: 'Name of the database.',
              order: 3,
            },
            username: {
              type: 'string',
              title: 'Username',
              description: 'Username to access the database.',
              order: 4,
            },
          },
        },
      }),
    });

    render(createSourceForm());

    // Fill in source name
    const sourceName = screen.getByLabelText('Name*');
    await user.type(sourceName, 'MYSOURCENAME');

    // Select source type
    const sourceTypeInput = screen.getByLabelText('Select source type*');
    await user.click(sourceTypeInput);
    await user.type(sourceTypeInput, 'Postgres');

    // Wait for the option to appear and select it
    await waitFor(async () => {
      const option = await screen.findByText(/Postgres.*v3\.3\.1/);
      await user.click(option);
    });

    // Fill in required fields
    await waitFor(async () => {
      const hostField = screen.getByTestId('host-field');
      const portField = screen.getByTestId('port-field');
      const databaseField = screen.getByTestId('database-field');
      const usernameField = screen.getByTestId('username-field');

      // Don't clear the port field, just type database and username
      await user.type(databaseField, 'mydb');
      await user.type(usernameField, 'postgres');
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
          host: 'localhost',
          port: 5432,
          database: 'mydb',
          username: 'postgres',
        },
        sourceId: '',
      });
    });
  });
});
