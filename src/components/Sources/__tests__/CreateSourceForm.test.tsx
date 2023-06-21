import { render, screen, fireEvent, act } from '@testing-library/react';
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

  // ===========================================================================
  it('renders the form', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'sourceDefElementName',
            sourceDefinitionId: 'sourceDefId',
          },
        ]),
      })
      .mockResolvedValueOnce({
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

    const setShowFormMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateSourceForm
            mutate={() => {}}
            showForm={true}
            setShowForm={(x) => setShowFormMock(x)}
          />
        </SessionProvider>
      );
    });
    const savebutton = screen.getByTestId('savebutton');
    expect(savebutton).toBeInTheDocument();

    const cancelbutton = screen.getByTestId('cancelbutton');
    expect(cancelbutton).toBeInTheDocument();

    const sourceName = screen.getByLabelText('Name*');
    expect(sourceName).toBeInTheDocument();

    await userEvent.click(cancelbutton);
    expect(setShowFormMock).toHaveBeenCalledWith(false);

    const sourceType = screen.getByLabelText('Select source type');
    expect(sourceType).toBeInTheDocument();
  });

  // ===========================================================================
  it('selects the source type and submits the form', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'sourceDefElementName',
            sourceDefinitionId: 'MYSOURCEDEFID',
          },
        ]),
      })
      .mockResolvedValueOnce({
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

    const setShowFormMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateSourceForm
            mutate={() => {}}
            showForm={true}
            setShowForm={(x) => setShowFormMock(x)}
          />
        </SessionProvider>
      );
    });

    const sourceTypeInput = screen.getByRole('combobox');
    act(() => {
      fireEvent.change(sourceTypeInput, { value: 'sourceDefElementName' });
    });
    const autocomplete = screen.getByTestId('autocomplete');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    await act(async () => {
      await fireEvent.keyDown(autocomplete, { key: 'Enter' });
    });

    const inputField: HTMLInputElement = screen.getByLabelText('Host');
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('localhost');
    expect(inputField.type).toBe('text');

    const createSourceSubmit = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({}),
    });
    (global as any).fetch = createSourceSubmit;

    const savebutton = screen.getByTestId('savebutton');

    // first try with missing required field
    await userEvent.click(savebutton);
    expect(createSourceSubmit).not.toHaveBeenCalled();

    // now put in the required field
    const sourceName = screen.getByLabelText('Name*');
    await userEvent.type(sourceName, 'MYSOURCENAME');
    await userEvent.click(savebutton);

    expect(createSourceSubmit).toHaveBeenCalled();
    const request = createSourceSubmit.mock.calls[0][1];
    const requestBody = JSON.parse(request.body);

    expect(requestBody.name).toBe('MYSOURCENAME');
    expect(requestBody.sourceDefId).toBe('MYSOURCEDEFID');
    expect(requestBody.config.host).toBe('localhost');
  });

  // ===========================================================================
  it('selects the source type and submits the form with a missing field', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([
          {
            name: 'sourceDefElementName',
            sourceDefinitionId: 'MYSOURCEDEFID',
          },
        ]),
      })
      .mockResolvedValueOnce({
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

    const setShowFormMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <CreateSourceForm
            mutate={() => {}}
            showForm={true}
            setShowForm={(x) => setShowFormMock(x)}
          />
        </SessionProvider>
      );
    });

    const sourceTypeInput = screen.getByRole('combobox');
    act(() => {
      fireEvent.change(sourceTypeInput, { value: 'sourceDefElementName' });
    });
    const autocomplete = screen.getByTestId('autocomplete');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    await act(async () => {
      await fireEvent.keyDown(autocomplete, { key: 'Enter' });
    });

    const inputField: HTMLInputElement = screen.getByLabelText('Host*');
    expect(inputField).toBeInTheDocument();
    expect(inputField.value).toBe('');
    expect(inputField.type).toBe('text');

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
    await userEvent.type(sourceName, 'MYSOURCENAME');

    // but the "host" field is missing & required
    await userEvent.click(savebutton);
    expect(createSourceSubmit).not.toHaveBeenCalled();

    // now put in the required field
    await userEvent.type(inputField, 'SOMEHOST');
    await userEvent.click(savebutton);

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
