import {
  act,
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CreateDestinationForm from '../DestinationForm';
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

describe('destination create form - fetch definitions success', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  beforeEach(() => {
    const sendJsonMessageMock = jest.fn();
    const lastMessageMock = null;
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'destination-def-name-1',
          destinationDefinitionId: 'destination-def-id-1',
        },
      ]),
    });

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  it('initial render of the form', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => { }}
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

    const destinationName = screen.getByTestId('dest-name');
    expect(destinationName).toBeInTheDocument();

    const destinationType = screen.getByTestId('dest-type-autocomplete');
    expect(destinationType).toBeInTheDocument();

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeInTheDocument();

    // Form shouldn't submit if nothing is entered. Name is required
    userEvent.click(saveButton);
    await waitFor(() => {
      expect(destinationName).toBeInTheDocument();
      expect(destinationType).toBeInTheDocument();
    });
  });

  it('cancel button closes the form', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => { }}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    const destinationName = screen.getByTestId('dest-name');
    expect(destinationName).toBeInTheDocument();

    const destinationType = screen.getByTestId('dest-type-autocomplete');
    expect(destinationType).toBeInTheDocument();

    // Cancel button should close the form
    const cancelButton = screen.getByTestId('cancel');
    await userEvent.click(cancelButton);
    await waitFor(() => {
      expect(setShowForm).toHaveBeenCalled();
    });
  });
});

describe('destination create form - fetch definitions failure', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  beforeEach(() => {
    const sendJsonMessageMock = jest.fn();
    const lastMessageMock = null;
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'destination-def-name-1',
          destinationDefinitionId: 'destination-def-id-1',
        },
      ]),
    });

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  it('renders form without destination definitions', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => { }}
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

    const destinationName = screen.getByTestId('dest-name');
    expect(destinationName).toBeInTheDocument();

    const destinationType = screen.getByTestId('dest-type-autocomplete');
    expect(destinationType).toBeInTheDocument();
  });
});

describe('destination create form - definitions + specifications', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  let sendJsonMessageMock: jest.Mock;
  let lastMessageMock: any;
  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'destination-def-name-1',
            destinationDefinitionId: 'destination-def-id-1',
          },
          {
            name: 'destination-def-name-2',
            destinationDefinitionId: 'destination-def-id-2',
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          properties: {
            database: {
              type: 'string',
              order: 2,
              title: 'DB Name',
              description: 'Name of the database.',
            },
            host: {
              type: 'string',
              order: 0,
              title: 'Host',
              description: 'Hostname of the database.',
            },
            ssl_mode: {
              type: 'object',
              oneOf: [
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
              order: 7,
              title: 'SSL modes',
              description:
                'SSL connection modes. \n <b>disable</b> - Chose this mode to disable encryption of communication between Airbyte and destination database\n <b>allow</b> - Chose this mode to enable encryption only when required by the source database\n <b>prefer</b> - Chose this mode to allow unencrypted connection only if the source database does not support encryption\n <b>require</b> - Chose this mode to always require encryption. If the source database server does not support encryption, connection will fail\n  <b>verify-ca</b> - Chose this mode to always require encryption and to verify that the source database server has a valid SSL certificate\n  <b>verify-full</b> - This is the most secure mode. Chose this mode to always require encryption and to verify the identity of the source database server\n See more information - <a href="https://jdbc.postgresql.org/documentation/head/ssl-client.html"> in the docs</a>.',
            },
          },
          required: ['host'],
        }),
      });

    sendJsonMessageMock = jest.fn();
    lastMessageMock = null;

    (useWebSocket as jest.Mock).mockReturnValue({
      sendJsonMessage: sendJsonMessageMock,
      lastMessage: lastMessageMock,
      onError: jest.fn(),
    });
  });

  it('select destination definition to load specs', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => { }}
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

    // Select one of the defs in autocomplete
    let destinationDefAutocomplete = screen.getByTestId(
      'dest-type-autocomplete'
    );
    let destinationDefInput: HTMLInputElement = within(
      destinationDefAutocomplete
    ).getByRole('combobox');

    await act(() => {
      fireEvent.change(destinationDefInput, {
        target: {
          value: 'destination-def-name-2',
        },
      });
    });

    const selectDef2 = screen.getByText('destination-def-name-2'); // Replace 'Option 2' with the actual text of the second option
    await act(async () => await fireEvent.click(selectDef2));
    // Make sure the option selected is set in autcomplete
    destinationDefAutocomplete = screen.getByTestId('dest-type-autocomplete');
    destinationDefInput = within(destinationDefAutocomplete).getByRole(
      'combobox'
    );
    expect(destinationDefInput.value).toBe('destination-def-name-2');

    // Specifications should populate
    const hostSpec = screen.getByLabelText('Host*');
    expect(hostSpec).toBeInTheDocument();
    const dbNameSpec = screen.getByLabelText('DB Name');
    expect(dbNameSpec).toBeInTheDocument();
    const portSpec = screen.getByLabelText('SSL modes');
    expect(portSpec).toBeInTheDocument();

    const saveButton = screen.getByTestId('save-button');

    // Add name of the warehouse. Required field is empty
    const destNameInput = screen.getByLabelText('Name*');
    await userEvent.type(destNameInput, 'test-dest');

    // Add the required field input
    await userEvent.type(hostSpec, 'test-host-sever-name');

    // Now submit
    await userEvent.click(saveButton);
    await waitFor(() => expect(sendJsonMessageMock).toHaveBeenCalled());
  });

  it('submit the form with check connection failure & show logs', async () => {
    // Render component
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => { }}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    // Verify WebSocket setup
    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );

    // Select destination definition
    const destinationDefAutocomplete = screen.getByTestId(
      'dest-type-autocomplete'
    );
    const destinationDefInput: HTMLInputElement = within(
      destinationDefAutocomplete
    ).getByRole('combobox');

    await act(() => {
      fireEvent.change(destinationDefInput, {
        target: { value: 'destination-def-name-2' },
      });
    });

    const selectDef2 = screen.getByText('destination-def-name-2');
    await act(async () => fireEvent.click(selectDef2));

    // Mock failed WebSocket message with logs
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

    const saveButton = screen.getByTestId('save-button');

    // Fill in required fields
    const destNameInput = screen.getByLabelText('Name*');
    const hostSpec = screen.getByLabelText('Host*');
    await userEvent.type(destNameInput, 'test-dest');
    await userEvent.type(hostSpec, 'test-host-sever-name');

    await act(async () => {
      userEvent.click(saveButton);
    });

    // Verify that WebSocket send message was triggered
    await waitFor(() =>
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'test-dest',
        destinationDefId: 'destination-def-id-2',
        config: expect.any(Object),
        destinationId: null,
      })
    );

    // Verify logs are displayed after receiving failed status in `lastMessageMock`
    await waitFor(() => {
      const logLine1 = screen.getByText('log-message-line-1');
      const logLine2 = screen.getByText('log-message-line-2');
      expect(logLine1).toBeInTheDocument();
      expect(logLine2).toBeInTheDocument();
    });
  });

  it('submit the form with check connection success', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => { }}
            showForm={true}
            setShowForm={setShowForm}
            warehouse={null}
          />
        </SessionProvider>
      );
    });

    // Verify WebSocket setup
    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/destination/check_connection'),
        expect.any(Object)
      )
    );

    // Select destination definition
    const destinationDefAutocomplete = screen.getByTestId(
      'dest-type-autocomplete'
    );
    const destinationDefInput: HTMLInputElement = within(
      destinationDefAutocomplete
    ).getByRole('combobox');

    await act(async () => {
      fireEvent.change(destinationDefInput, {
        target: { value: 'destination-def-name-2' },
      });
    });

    const selectDef2 = screen.getByText('destination-def-name-2');
    await act(async () => fireEvent.click(selectDef2));

    const createDestinationOnSubmit = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        status: 'succeeded',
      }),
    });

    (global as any).fetch = createDestinationOnSubmit;

    // Simulate a successful WebSocket response
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

    const saveButton = screen.getByTestId('save-button');

    const destNameInput = screen.getByLabelText('Name*');
    const hostSpec = screen.getByLabelText('Host*');
    await act(async () => {
      await userEvent.type(destNameInput, 'test-dest');
      await userEvent.type(hostSpec, 'test-host-sever-name');
      userEvent.click(saveButton);
    });

    // Verify WebSocket message was sent
    await waitFor(() =>
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'test-dest',
        destinationDefId: 'destination-def-id-2',
        config: expect.any(Object),
        destinationId: null,
      })
    );

    await waitFor(() => {
      if (lastMessageMock.data.status === 'success') {
        expect(createDestinationOnSubmit).toHaveBeenCalledTimes(1);
      }
    });
  });
});
