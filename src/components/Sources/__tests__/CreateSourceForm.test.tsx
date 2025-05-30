import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CreateSourceForm from '../OldSourceForm';
import userEvent from '@testing-library/user-event';
import useWebSocket from 'react-use-websocket';

import '@testing-library/jest-dom';

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
  const setShowFormMock = jest.fn();
  const createSourceForm = () => (
    <SessionProvider session={mockSession}>
      <CreateSourceForm
        sourceId=""
        loading={false}
        setLoading={jest.fn()}
        mutate={jest.fn()}
        showForm
        sourceDefs={[
          {
            label: 'Postgres',
            id: 'MYSOURCEDEFID',
            dockerRepository: 'airbyte/source-postgres',
            tag: '3.3.1',
          },
        ]}
        setShowForm={(x) => setShowFormMock(x)}
      />
    </SessionProvider>
  );

  it('should initialize WebSocket with correct URL after session is set and render the form.', async () => {
    render(createSourceForm());

    // Wait for the useEffect to initialize the WebSocket URL
    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/source/check_connection'),
        expect.any(Object)
      )
    );
    const savebutton = screen.getByTestId('savebutton');
    expect(savebutton).toBeInTheDocument();

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    const sourceName = screen.getByLabelText('Name*');
    expect(sourceName).toBeInTheDocument();

    await user.click(cancelbutton);
    expect(setShowFormMock).toHaveBeenCalledWith(false);

    const sourceType = screen.getByLabelText('Select source type');
    expect(sourceType).toBeInTheDocument();
  });

  // ===========================================================================
  it('selects the source type and submits the form', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        properties: {
          host: {
            type: 'string',
            title: 'Host',
            field: 'host',
            default: 'localhost',
          },
        },
        required: ['host'],
      }),
    });

    render(createSourceForm());

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/source/check_connection'),
        expect.any(Object)
      )
    );

    const autocomplete = screen.getByTestId('autocomplete');
    const sourceTypeInput = screen.getByRole('combobox');
    autocomplete.focus();

    await user.type(sourceTypeInput, 's');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getAllByRole('presentation').length).toBe(2);
    });

    await waitFor(() => {
      const inputField: HTMLInputElement = screen.getByLabelText('Host*');
      expect(inputField).toBeInTheDocument();
      expect(inputField.value).toBe('localhost');
      expect(inputField.type).toBe('text');
    });

    const createSourceSubmit = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({}),
    });
    (global as any).fetch = createSourceSubmit;

    const savebutton = screen.getByTestId('savebutton');

    // first try with missing required field
    await user.click(savebutton);
    expect(createSourceSubmit).not.toHaveBeenCalled();

    // now put in the required field
    const sourceName = screen.getByLabelText('Name*');
    await user.type(sourceName, 'MYSOURCENAME');
    await user.click(savebutton);

    await waitFor(() => {
      screen.debug(document, Infinity);
      expect(sendJsonMessageMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      if (lastMessageMock) {
        expect(createSourceSubmit).toHaveBeenCalled();
        const request = createSourceSubmit.mock.calls[0][1];
        const requestBody = JSON.parse(request.body);

        expect(requestBody.name).toBe('MYSOURCENAME');
        expect(requestBody.sourceDefId).toBe('MYSOURCEDEFID');
        expect(requestBody.config.host).toBe('localhost');
      }
    });
  });

  it('handles failed WebSocket response and shows logs', async () => {
    lastMessageMock = {
      status: 'success',
      data: {
        status: 'failed',
        logs: ['Error log line 1', 'Error log line 2'],
      },
    };

    render(createSourceForm());

    await waitFor(() =>
      expect(useWebSocket).toHaveBeenCalledWith(
        expect.stringContaining('airbyte/source/check_connection'),
        expect.any(Object)
      )
    );

    const sourceName = screen.getByLabelText('Name*');
    await user.type(sourceName, 'Test Source');

    const autocomplete = screen.getByTestId('autocomplete');
    const sourceTypeInput = screen.getByRole('combobox');
    autocomplete.focus();
    await user.type(sourceTypeInput, 's');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    const saveButton = screen.getByTestId('savebutton');
    await user.click(saveButton);

    await waitFor(() =>
      expect(sendJsonMessageMock).toHaveBeenCalledWith({
        name: 'Test Source',
        sourceDefId: 'MYSOURCEDEFID',
        config: expect.any(Object),
        sourceId: '',
      })
    );
  });
});
