import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import CreateSourceForm from '../CreateSourceForm';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

describe('Connections Setup', () => {
  const mockSession: Session = {
    expires: '1',
    user: { email: 'a' },
  };
  const user = userEvent.setup();
  const setShowFormMock = jest.fn();
  const createSourceForm = () => (
    <SessionProvider session={mockSession}>
      <CreateSourceForm
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

  // ===========================================================================
  it('renders the form', async () => {
    render(createSourceForm());

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
      expect(createSourceSubmit).toHaveBeenCalled();
    });

    const request = createSourceSubmit.mock.calls[0][1];
    const requestBody = JSON.parse(request.body);

    expect(requestBody.name).toBe('MYSOURCENAME');
    expect(requestBody.sourceDefId).toBe('MYSOURCEDEFID');
    expect(requestBody.config.host).toBe('localhost');
  });

  // ===========================================================================
  it('selects the source type and submits the form with a missing field', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        properties: {
          host: {
            type: 'string',
            title: 'Host',
            field: 'host',
          },
        },
        required: ['host'],
      }),
    });

    render(createSourceForm());

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
      expect(inputField.value).toBe('');
      expect(inputField.type).toBe('text');
    });

    const createSourceSubmit = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        status: 'failed',
        logs: ['log-message-line-1', 'log-message-line-2'],
      }),
    });
    (global as any).fetch = createSourceSubmit;

    const savebutton = screen.getByTestId('savebutton');

    // put in the name
    const sourceName = screen.getByLabelText('Name*');
    await user.type(sourceName, 'MYSOURCENAME');

    // but the "host" field is missing & required
    await user.click(savebutton);
    expect(createSourceSubmit).not.toHaveBeenCalled();
    const inputField: HTMLInputElement = screen.getByLabelText('Host*');
    // now put in the required field
    await user.type(inputField, 'SOMEHOST');
    await user.click(savebutton);

    expect(createSourceSubmit).toHaveBeenCalled();
    const request = createSourceSubmit.mock.calls[0][1];
    const requestBody = JSON.parse(request.body);

    expect(requestBody.name).toBe('MYSOURCENAME');
    expect(requestBody.sourceDefId).toBe('MYSOURCEDEFID');
    expect(requestBody.config.host).toBe('SOMEHOST');

    // Logs message lines should appear
    const logLine1 = screen.getByText('log-message-line-1');
    expect(logLine1).toBeInTheDocument();
    const logLine2 = screen.getByText('log-message-line-1');
    expect(logLine2).toBeInTheDocument();
  });
});
