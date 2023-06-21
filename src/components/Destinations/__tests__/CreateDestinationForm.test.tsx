import { act, render, screen, within, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CreateDestinationForm from '../CreateDestinationForm';

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

describe('destination create form', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const setShowForm = jest.fn();

  it('initial render of the form', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
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
    });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => {}}
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

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeInTheDocument();

    // Form shouldn't submit if nothing is entered
    userEvent.click(saveButton);
    expect(destinationName).toBeInTheDocument();
    expect(destinationType).toBeInTheDocument();

    // Cancel button should close the form
    const cancelButton = screen.getByTestId('cancel-button');
    await act(async () => await userEvent.click(cancelButton));
    expect(destinationName).not.toBeInTheDocument();
    expect(destinationType).not.toBeInTheDocument();
  });

  it('renders destination config input & submit', async () => {
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
            port: {
              type: 'integer',
              order: 1,
              title: 'Port',
              description: 'Port of the database.',
            },
            username: {
              type: 'string',
              order: 4,
              title: 'User',
              description: 'Username to use to access the database.',
            },
            password: {
              type: 'string',
              order: 5,
              title: 'Password',
              description: 'Password associated with the username.',
              airbyte_secret: true,
            },
          },
          required: ['host'],
        }),
      });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateDestinationForm
            mutate={() => {}}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      );
    });

    // Select one of the defs in autocomplete
    let destinationDefAutocomplete = screen.getByTestId(
      'dest-type-autocomplete'
    );
    let destinationDefInput: HTMLInputElement = within(
      destinationDefAutocomplete
    ).getByRole('combobox');
    act(() => {
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
    const portSpec = screen.getByLabelText('Port');
    expect(portSpec).toBeInTheDocument();
    const userNameSpec = screen.getByLabelText('User');
    expect(userNameSpec).toBeInTheDocument();
    const passwordSpec = screen.getByLabelText('Password');
    expect(passwordSpec).toBeInTheDocument();

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
    await userEvent.click(saveButton);
    expect(createDestinationOnSubmit).not.toHaveBeenCalled();

    // Add the required field input
    await userEvent.type(hostSpec, 'test-host-sever-name');

    // Now submit
    await userEvent.click(saveButton);
    expect(createDestinationOnSubmit).toHaveBeenCalled();

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
  });
});
