import { act, render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CreateDestinationForm from '../DestinationForm';

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

describe('destination create form - fetch definitions success', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  beforeEach(() => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'destination-def-name-1',
          destinationDefinitionId: 'destination-def-id-1',
        },
      ]),
    });
  });

  it('initial render of the form', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm mutate={() => {}} showForm={true} setShowForm={setShowForm} />
        </SessionProvider>
      );
    });

    const destinationName = screen.getByTestId('dest-name');
    expect(destinationName).toBeInTheDocument();

    const destinationType = screen.getByTestId('dest-type-autocomplete');
    expect(destinationType).toBeInTheDocument();

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeInTheDocument();

    // Form shouldn't submit if nothing is entered. Name is required
    userEvent.click(saveButton);
    expect(destinationName).toBeInTheDocument();
    expect(destinationType).toBeInTheDocument();
  });

  it('cancel button closes the form', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm mutate={() => {}} showForm={true} setShowForm={setShowForm} />
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
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce([
        {
          name: 'destination-def-name-1',
          destinationDefinitionId: 'destination-def-id-1',
        },
      ]),
    });
  });

  it('renders form without destination definitions', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm mutate={() => {}} showForm={true} setShowForm={setShowForm} />
        </SessionProvider>
      );
    });

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
                  required: ['mode', 'ca_certificate', 'client_certificate', 'client_key'],
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
  });

  it('select destination definition to load specs', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm mutate={() => {}} showForm={true} setShowForm={setShowForm} />
        </SessionProvider>
      );
    });

    // Select one of the defs in autocomplete
    let destinationDefAutocomplete = screen.getByTestId('dest-type-autocomplete');
    let destinationDefInput: HTMLInputElement = within(destinationDefAutocomplete).getByRole(
      'combobox'
    );

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
    destinationDefInput = within(destinationDefAutocomplete).getByRole('combobox');
    expect(destinationDefInput.value).toBe('destination-def-name-2');

    // Specifications should populate
    const hostSpec = screen.getByLabelText('Host*');
    expect(hostSpec).toBeInTheDocument();
    const dbNameSpec = screen.getByLabelText('DB Name');
    expect(dbNameSpec).toBeInTheDocument();
    const portSpec = screen.getByLabelText('SSL modes');
    expect(portSpec).toBeInTheDocument();

    // Mock the api call in submit function, a failed call
    const createDestinationOnSubmit = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        status: 'failed',
        logs: ['log-message-line-1', 'log-message-line-2'],
      }),
    });

    (global as any).fetch = createDestinationOnSubmit;

    const saveButton = screen.getByTestId('save-button');

    // Add name of the warehouse. Required field is empty
    const destNameInput = screen.getByLabelText('Name*');
    await userEvent.type(destNameInput, 'test-dest');
    // await userEvent.click(saveButton);
    // expect(createDestinationOnSubmit).not.toHaveBeenCalled();

    // Add the required field input
    await userEvent.type(hostSpec, 'test-host-sever-name');

    // Now submit
    await userEvent.click(saveButton);
    expect(createDestinationOnSubmit).toHaveBeenCalled();

    // Mock the api call in submit function, a success call and submit again
  });

  it('submit the form with check connection failure & show logs', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm mutate={() => {}} showForm={true} setShowForm={setShowForm} />
        </SessionProvider>
      );
    });

    // select destination definition
    const destinationDefAutocomplete = screen.getByTestId('dest-type-autocomplete');
    const destinationDefInput: HTMLInputElement = within(destinationDefAutocomplete).getByRole(
      'combobox'
    );

    await act(() => {
      fireEvent.change(destinationDefInput, {
        target: {
          value: 'destination-def-name-2',
        },
      });
    });

    const selectDef2 = screen.getByText('destination-def-name-2'); // Replace 'Option 2' with the actual text of the second option
    await act(async () => await fireEvent.click(selectDef2));

    // Mock the check connectivity call in submit function, a failed call
    const createDestinationOnSubmit = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        status: 'failed',
        logs: ['log-message-line-1', 'log-message-line-2'],
      }),
    });

    (global as any).fetch = createDestinationOnSubmit;

    const saveButton = screen.getByTestId('save-button');
    // Enter required fields
    const destNameInput = screen.getByLabelText('Name*');
    const hostSpec = screen.getByLabelText('Host*');
    await userEvent.type(destNameInput, 'test-dest');
    await userEvent.type(hostSpec, 'test-host-sever-name');
    await userEvent.click(saveButton);

    const request = createDestinationOnSubmit.mock.calls[0][1];
    const requestBody = JSON.parse(request.body);

    expect(requestBody.name).toBe('test-dest');
    expect(requestBody.destinationDefId).toBe('destination-def-id-2');
    expect(requestBody.config.host).toBe('test-host-sever-name');

    // Logs message lines should appear
    const logLine1 = screen.getByText('log-message-line-1');
    expect(logLine1).toBeInTheDocument();
    const logLine2 = screen.getByText('log-message-line-1');
    expect(logLine2).toBeInTheDocument();

    // Mock the api call with response with ok: false
    const createDestinationOnSubmitFail = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        status: 'failed',
        logs: ['log-message-line-1', 'log-message-line-2'],
      }),
    });
    (global as any).fetch = createDestinationOnSubmitFail;
    await userEvent.click(saveButton);
  });

  it('submit the form with check connection success', async () => {
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm mutate={() => {}} showForm={true} setShowForm={setShowForm} />
        </SessionProvider>
      );
    });

    // select destination definition
    const destinationDefAutocomplete = screen.getByTestId('dest-type-autocomplete');
    const destinationDefInput: HTMLInputElement = within(destinationDefAutocomplete).getByRole(
      'combobox'
    );

    await act(() => {
      fireEvent.change(destinationDefInput, {
        target: {
          value: 'destination-def-name-2',
        },
      });
    });

    const selectDef2 = screen.getByText('destination-def-name-2'); // Replace 'Option 2' with the actual text of the second option
    await act(async () => await fireEvent.click(selectDef2));

    // Mock the check connectivity call in submit function, a success call
    // Also mock successfull create warehouse api call
    const createDestinationOnSubmit = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          status: 'succeeded',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ success: 1 }),
      });

    (global as any).fetch = createDestinationOnSubmit;

    const saveButton = screen.getByTestId('save-button');
    // Enter required fields
    const destNameInput = screen.getByLabelText('Name*');
    const hostSpec = screen.getByLabelText('Host*');
    await userEvent.type(destNameInput, 'test-dest');
    await userEvent.type(hostSpec, 'test-host-sever-name');
    await userEvent.click(saveButton);

    const request = createDestinationOnSubmit.mock.calls[0][1];
    const requestBody = JSON.parse(request.body);

    expect(requestBody.name).toBe('test-dest');
    expect(requestBody.destinationDefId).toBe('destination-def-id-2');
    expect(requestBody.config.host).toBe('test-host-sever-name');

    await userEvent.click(saveButton);
    expect(createDestinationOnSubmit).toHaveBeenCalled();
  });
});
