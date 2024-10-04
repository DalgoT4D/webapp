import { act, render, screen, waitFor, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import EditDestinationForm from '../DestinationForm';
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

describe('destination edit form - fetch definitions + specs successfully', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  const WAREHOUSE_SPECS = {
    properties: {
      database: {
        type: 'string',
        order: 2,
        title: 'DB Name',
        description: 'Name of the database.',
      },
      host: {
        type: 'string',
        title: 'Host',
        description: 'Hostname of the database.',
      },
      ssl_mode: {
        type: 'object',
        oneOf: [
          {
            title: 'disable',
            required: ['mode'],
            properties: {
              mode: {
                enum: ['disable'],
                type: 'string',
                const: 'disable',
                order: 0,
                default: 'disable',
              },
            },
            description: 'Disable SSL.',
            additionalProperties: false,
          },
          {
            title: 'verify-ca',
            required: ['mode', 'ca_certificate'],
            properties: {
              mode: {
                enum: ['verify-ca'],
                type: 'string',
                const: 'verify-ca',
                order: 0,
                default: 'verify-ca',
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-ca SSL mode.',
            additionalProperties: false,
          },
          {
            title: 'verify-full',
            required: [
              'mode',
              'ca_certificate',
              'client_certificate',
              'client_key',
            ],
            properties: {
              mode: {
                enum: ['verify-full'],
                type: 'string',
                const: 'verify-full',
                order: 0,
                default: 'verify-full',
              },
              client_key: {
                type: 'string',
                order: 3,
                title: 'Client key',
                multiline: true,
                description: 'Client key',
                airbyte_secret: true,
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_certificate: {
                type: 'string',
                order: 2,
                title: 'Client certificate',
                multiline: true,
                description: 'Client certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-full SSL mode.',
            additionalProperties: false,
          },
        ],
        title: 'SSL modes',
        description:
          'SSL connection modes. \n <b>disable</b> - Chose this mode to disable encryption of communication between Airbyte and destination database\n <b>allow</b> - Chose this mode to enable encryption only when required by the source database\n <b>prefer</b> - Chose this mode to allow unencrypted connection only if the source database does not support encryption\n <b>require</b> - Chose this mode to always require encryption. If the source database server does not support encryption, connection will fail\n  <b>verify-ca</b> - Chose this mode to always require encryption and to verify that the source database server has a valid SSL certificate\n  <b>verify-full</b> - This is the most secure mode. Chose this mode to always require encryption and to verify the identity of the source database server\n See more information - <a href="https://jdbc.postgresql.org/documentation/head/ssl-client.html"> in the docs</a>.',
      },
    },
    required: ['host'],
  };

  const WAREHOUSE = {
    destinationId: 'test-dest-id',
    destinationDefinitionId: 'test-def-id',
    name: 'test-warehouse',
    wtype: 'Postgres',
    icon: 'test-icon-url',
    connectionConfiguration: {
      database: 'test-db',
      host: 'test-server',
      ssl_mode: { mode: 'disable' },
    },
  };

  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;
  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'test-def-name',
            destinationDefinitionId: 'test-def-id',
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(WAREHOUSE_SPECS),
      });

    sendJsonMessageMock = jest.fn();
    lastMessageMock = null;

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  it('render the form with fields prefilled', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <EditDestinationForm
            warehouse={WAREHOUSE}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );
    expect(fetch).toHaveBeenCalledTimes(2);


    // destination name
    const destinationName: HTMLInputElement = within(
      screen.getByTestId('dest-name')
    ).getByRole('textbox');
    expect(destinationName).toBeInTheDocument();
    expect(destinationName.value).toBe('test-warehouse');

    // destination definition
    const defAutocomplete: HTMLInputElement = within(
      screen.getByTestId('dest-type-autocomplete')
    ).getByRole('combobox');
    expect(defAutocomplete).toBeInTheDocument();
    expect(defAutocomplete.value).toBe('test-def-name');

    // spec host
    const hostSpec: any = screen.getByText('Host*').parentElement;
    expect(hostSpec).not.toBeNull();
    const hostSpecInput: HTMLInputElement =
      within(hostSpec).getByRole('textbox');
    expect(hostSpecInput.value).toBe('test-server');

    // spec database
    const databaseSpec: any = screen.getByText('DB Name').parentElement;
    expect(databaseSpec).not.toBeNull();
    const databaseSpecInput: HTMLInputElement =
      within(databaseSpec).getByRole('textbox');
    expect(databaseSpecInput.value).toBe('test-db');

    // ssl mode spec
    const sslmodeSpec: any = screen.getByText('SSL modes').parentElement;
    expect(sslmodeSpec).not.toBeNull();
    const sslmodeSpecInput: HTMLInputElement =
      within(sslmodeSpec).getByRole('combobox');
    expect(sslmodeSpecInput.value).toBe('disable');
  });
});

describe('destination edit form - fetch definition (being edited does not match Postgres or Bigquery)', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  const WAREHOUSE_SPECS = {
    properties: {
      database: {
        type: 'string',
        order: 2,
        title: 'DB Name',
        description: 'Name of the database.',
      },
      host: {
        type: 'string',
        title: 'Host',
        description: 'Hostname of the database.',
      },
      ssl_mode: {
        type: 'object',
        oneOf: [
          {
            title: 'disable',
            required: ['mode'],
            properties: {
              mode: {
                enum: ['disable'],
                type: 'string',
                const: 'disable',
                order: 0,
                default: 'disable',
              },
            },
            description: 'Disable SSL.',
            additionalProperties: false,
          },
          {
            title: 'verify-ca',
            required: ['mode', 'ca_certificate'],
            properties: {
              mode: {
                enum: ['verify-ca'],
                type: 'string',
                const: 'verify-ca',
                order: 0,
                default: 'verify-ca',
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-ca SSL mode.',
            additionalProperties: false,
          },
          {
            title: 'verify-full',
            required: [
              'mode',
              'ca_certificate',
              'client_certificate',
              'client_key',
            ],
            properties: {
              mode: {
                enum: ['verify-full'],
                type: 'string',
                const: 'verify-full',
                order: 0,
                default: 'verify-full',
              },
              client_key: {
                type: 'string',
                order: 3,
                title: 'Client key',
                multiline: true,
                description: 'Client key',
                airbyte_secret: true,
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_certificate: {
                type: 'string',
                order: 2,
                title: 'Client certificate',
                multiline: true,
                description: 'Client certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-full SSL mode.',
            additionalProperties: false,
          },
        ],
        title: 'SSL modes',
        description:
          'SSL connection modes. \n <b>disable</b> - Chose this mode to disable encryption of communication between Airbyte and destination database\n <b>allow</b> - Chose this mode to enable encryption only when required by the source database\n <b>prefer</b> - Chose this mode to allow unencrypted connection only if the source database does not support encryption\n <b>require</b> - Chose this mode to always require encryption. If the source database server does not support encryption, connection will fail\n  <b>verify-ca</b> - Chose this mode to always require encryption and to verify that the source database server has a valid SSL certificate\n  <b>verify-full</b> - This is the most secure mode. Chose this mode to always require encryption and to verify the identity of the source database server\n See more information - <a href="https://jdbc.postgresql.org/documentation/head/ssl-client.html"> in the docs</a>.',
      },
    },
    required: ['host'],
  };

  const WAREHOUSE = {
    destinationId: 'test-dest-id',
    destinationDefinitionId: 'not-postgres-not-bigquery',
    name: 'test-warehouse',
    wtype: 'Postgres',
    icon: 'test-icon-url',
    connectionConfiguration: {
      database: 'test-db',
      host: 'test-server',
      ssl_mode: { mode: 'disable' },
    },
  };

  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;
  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'test-def-name',
            destinationDefinitionId: 'test-def-id',
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(WAREHOUSE_SPECS),
      });
    sendJsonMessageMock = jest.fn();
    lastMessageMock = null;

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  it('render the form without the specs', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <EditDestinationForm
            warehouse={WAREHOUSE}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });
    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );

    expect(fetch).toHaveBeenCalledTimes(1);

    // If definition is wrong, nothing is set

    // destination name
    const destinationName: HTMLInputElement = within(
      screen.getByTestId('dest-name')
    ).getByRole('textbox');
    expect(destinationName).toBeInTheDocument();
    expect(destinationName.value).toBe('');

    // destination definition
    const defAutocomplete: HTMLInputElement = within(
      screen.getByTestId('dest-type-autocomplete')
    ).getByRole('combobox');
    expect(defAutocomplete).toBeInTheDocument();
    expect(defAutocomplete.value).toBe('');
  });
});



describe('destination edit form - fetch definition failed', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  const WAREHOUSE_SPECS = {
    properties: {
      database: {
        type: 'string',
        order: 2,
        title: 'DB Name',
        description: 'Name of the database.',
      },
      host: {
        type: 'string',
        title: 'Host',
        description: 'Hostname of the database.',
      },
      ssl_mode: {
        type: 'object',
        oneOf: [
          {
            title: 'disable',
            required: ['mode'],
            properties: {
              mode: {
                enum: ['disable'],
                type: 'string',
                const: 'disable',
                order: 0,
                default: 'disable',
              },
            },
            description: 'Disable SSL.',
            additionalProperties: false,
          },
          {
            title: 'verify-ca',
            required: ['mode', 'ca_certificate'],
            properties: {
              mode: {
                enum: ['verify-ca'],
                type: 'string',
                const: 'verify-ca',
                order: 0,
                default: 'verify-ca',
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-ca SSL mode.',
            additionalProperties: false,
          },
          {
            title: 'verify-full',
            required: [
              'mode',
              'ca_certificate',
              'client_certificate',
              'client_key',
            ],
            properties: {
              mode: {
                enum: ['verify-full'],
                type: 'string',
                const: 'verify-full',
                order: 0,
                default: 'verify-full',
              },
              client_key: {
                type: 'string',
                order: 3,
                title: 'Client key',
                multiline: true,
                description: 'Client key',
                airbyte_secret: true,
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_certificate: {
                type: 'string',
                order: 2,
                title: 'Client certificate',
                multiline: true,
                description: 'Client certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-full SSL mode.',
            additionalProperties: false,
          },
        ],
        title: 'SSL modes',
        description:
          'SSL connection modes. \n <b>disable</b> - Chose this mode to disable encryption of communication between Airbyte and destination database\n <b>allow</b> - Chose this mode to enable encryption only when required by the source database\n <b>prefer</b> - Chose this mode to allow unencrypted connection only if the source database does not support encryption\n <b>require</b> - Chose this mode to always require encryption. If the source database server does not support encryption, connection will fail\n  <b>verify-ca</b> - Chose this mode to always require encryption and to verify that the source database server has a valid SSL certificate\n  <b>verify-full</b> - This is the most secure mode. Chose this mode to always require encryption and to verify the identity of the source database server\n See more information - <a href="https://jdbc.postgresql.org/documentation/head/ssl-client.html"> in the docs</a>.',
      },
    },
    required: ['host'],
  };

  const WAREHOUSE = {
    destinationId: 'test-dest-id',
    destinationDefinitionId: 'not-postgres-not-bigquery',
    name: 'test-warehouse',
    wtype: 'Postgres',
    icon: 'test-icon-url',
    connectionConfiguration: {
      database: 'test-db',
      host: 'test-server',
      ssl_mode: { mode: 'disable' },
    },
  };

  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;
  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'test-def-name',
            destinationDefinitionId: 'test-def-id',
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(WAREHOUSE_SPECS),
      });
    sendJsonMessageMock = jest.fn();
    lastMessageMock = null;

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });

  });

  it('render the form without the specs', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <EditDestinationForm
            warehouse={WAREHOUSE}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );
    // If definition api call fails, nothing is set

    // destination name
    const destinationName: HTMLInputElement = within(
      screen.getByTestId('dest-name')
    ).getByRole('textbox');
    expect(destinationName).toBeInTheDocument();
    expect(destinationName.value).toBe('');

    // destination definition
    const defAutocomplete: HTMLInputElement = within(
      screen.getByTestId('dest-type-autocomplete')
    ).getByRole('combobox');
    expect(defAutocomplete).toBeInTheDocument();
    expect(defAutocomplete.value).toBe('');
  });
});

describe('destination edit form - connectivity', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  const WAREHOUSE_SPECS = {
    properties: {
      database: {
        type: 'string',
        order: 2,
        title: 'DB Name',
        description: 'Name of the database.',
      },
      host: {
        type: 'string',
        title: 'Host',
        description: 'Hostname of the database.',
      },
      ssl_mode: {
        type: 'object',
        oneOf: [
          {
            title: 'disable',
            required: ['mode'],
            properties: {
              mode: {
                enum: ['disable'],
                type: 'string',
                const: 'disable',
                order: 0,
                default: 'disable',
              },
            },
            description: 'Disable SSL.',
            additionalProperties: false,
          },
          {
            title: 'verify-ca',
            required: ['mode', 'ca_certificate'],
            properties: {
              mode: {
                enum: ['verify-ca'],
                type: 'string',
                const: 'verify-ca',
                order: 0,
                default: 'verify-ca',
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-ca SSL mode.',
            additionalProperties: false,
          },
          {
            title: 'verify-full',
            required: [
              'mode',
              'ca_certificate',
              'client_certificate',
              'client_key',
            ],
            properties: {
              mode: {
                enum: ['verify-full'],
                type: 'string',
                const: 'verify-full',
                order: 0,
                default: 'verify-full',
              },
              client_key: {
                type: 'string',
                order: 3,
                title: 'Client key',
                multiline: true,
                description: 'Client key',
                airbyte_secret: true,
              },
              ca_certificate: {
                type: 'string',
                order: 1,
                title: 'CA certificate',
                multiline: true,
                description: 'CA certificate',
                airbyte_secret: true,
              },
              client_certificate: {
                type: 'string',
                order: 2,
                title: 'Client certificate',
                multiline: true,
                description: 'Client certificate',
                airbyte_secret: true,
              },
              client_key_password: {
                type: 'string',
                order: 4,
                title: 'Client key password',
                description:
                  'Password for keystorage. This field is optional. If you do not add it - the password will be generated automatically.',
                airbyte_secret: true,
              },
            },
            description: 'Verify-full SSL mode.',
            additionalProperties: false,
          },
        ],
        title: 'SSL modes',
        description:
          'SSL connection modes. \n <b>disable</b> - Chose this mode to disable encryption of communication between Airbyte and destination database\n <b>allow</b> - Chose this mode to enable encryption only when required by the source database\n <b>prefer</b> - Chose this mode to allow unencrypted connection only if the source database does not support encryption\n <b>require</b> - Chose this mode to always require encryption. If the source database server does not support encryption, connection will fail\n  <b>verify-ca</b> - Chose this mode to always require encryption and to verify that the source database server has a valid SSL certificate\n  <b>verify-full</b> - This is the most secure mode. Chose this mode to always require encryption and to verify the identity of the source database server\n See more information - <a href="https://jdbc.postgresql.org/documentation/head/ssl-client.html"> in the docs</a>.',
      },
    },
    required: ['host'],
  };

  const WAREHOUSE = {
    destinationId: 'test-dest-id',
    destinationDefinitionId: 'test-def-id',
    name: 'test-warehouse',
    wtype: 'Postgres',
    icon: 'test-icon-url',
    connectionConfiguration: {
      database: 'test-db',
      host: 'test-server',
      ssl_mode: { mode: 'disable' },
    },
  };

  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;
  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'test-def-name',
            destinationDefinitionId: 'test-def-id',
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(WAREHOUSE_SPECS),
      });

    sendJsonMessageMock = jest.fn();
    lastMessageMock = null;

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  it('submits the form with prefilled values and validates WebSocket and API call', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <EditDestinationForm
            warehouse={WAREHOUSE}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );

    // Mock connectivity API call
    const checkConnectivityEditConnectionMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          status: 'succeeded',
        }),
      });

    (global as any).fetch = checkConnectivityEditConnectionMock;

    // Set the WebSocket last message to simulate a successful connection response
    lastMessageMock = {
      data: JSON.stringify({
        status: 'success',
        data: {
          status: 'succeeded',
        },
      }),
    };

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });

    // Click the save button to trigger submission
    const saveButton = screen.getByTestId('save-button');
    await userEvent.click(saveButton);

    // Check WebSocket sendJsonMessage payload
    await waitFor(() =>
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'test-warehouse',
        config: {
          database: 'test-db',
          host: 'test-server',
          ssl_mode: { mode: 'disable' },
        },
        destinationId: 'test-dest-id',
      })
    );

    // Validate that the check connectivity API was called once after successful WebSocket response
    await waitFor(() => {
      expect(checkConnectivityEditConnectionMock).toHaveBeenCalledTimes(1);
    });
  });
  it('submits the form with connection failure, displaying error logs', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <EditDestinationForm
            warehouse={WAREHOUSE}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    // Verify WebSocket connection setup
    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );

    // Simulate a WebSocket response with failure and logs
    lastMessageMock = {
      data: JSON.stringify({
        status: 'success',
        data: {
          status: 'failed',
          logs: ['log-message-line-1', 'log-message-line-2'],
        },
      }),
    };

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });

    // Click the save button to trigger the submission
    const saveButton = screen.getByTestId('save-button');
    await act(async () => {
      userEvent.click(saveButton);
    });

    // Validate the WebSocket message payload sent on save
    await waitFor(() =>
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'test-warehouse',
        config: {
          database: 'test-db',
          host: 'test-server',
          ssl_mode: { mode: 'disable' },
        },
        destinationId: 'test-dest-id',
      })
    );

    // Check that error logs appear in the UI as expected
    await waitFor(() => {
      expect(screen.getByText('log-message-line-1')).toBeInTheDocument();
      expect(screen.getByText('log-message-line-2')).toBeInTheDocument();
    });
  });

});
