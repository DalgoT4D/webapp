import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import FlowCreate from '../FlowCreate';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe('Flow Creation', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  const user = userEvent.setup();

  const tasks = [
    {
      label: 'GIT pull',
      slug: 'git-pull',
      id: 47,
      uuid: 'd3681350-ea4f-4afe-b664-4bb82070c703',
      deploymentId: null,
      lock: null,
      command: 'git pull',
      generated_by: 'system',
      seq: 1,
      order: 1,
    },
  ];
  // ================================================================================
  it('renders the form', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          flowId={undefined}
          updateCrudVal={jest.fn}
          mutate={jest.fn}
          setSelectedFlowId={jest.fn}
          tasks={[]}
        />
      </SessionProvider>
    );

    const cancellink = screen.getByTestId('cancellink');

    const savebutton = screen.getByTestId('savebutton');
    await waitFor(() => {
      expect(cancellink).toBeInTheDocument();
      expect(savebutton).toBeInTheDocument();
    });
  });

  // ================================================================================
  it('clicks cancel button', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const updateCrudValMock = jest.fn();
    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          flowId={undefined}
          mutate={jest.fn}
          setSelectedFlowId={jest.fn}
          tasks={[]}
          updateCrudVal={(param) => updateCrudValMock(param)}
        />
      </SessionProvider>
    );

    const cancellink = screen.getByTestId('cancellink');
    await user.click(cancellink);

    await waitFor(() => {
      expect(updateCrudValMock).toHaveBeenCalledWith('index');
    });
  });

  // ================================================================================
  it('clicks save button without required form fields', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          flowId={undefined}
          setSelectedFlowId={jest.fn}
          tasks={[]}
          updateCrudVal={(param) => updateCrudValMock(param)}
          mutate={mutateMock}
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('savebutton');
    await user.click(savebutton);

    await waitFor(() => {
      expect(updateCrudValMock).not.toHaveBeenCalled();
      expect(mutateMock).not.toHaveBeenCalled();
    });
  });

  // ================================================================================
  it('checks connection autocomplete list and adding a connection', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([{ name: 'conn-1', blockName: 'conn-1-block' }]),
    });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          updateCrudVal={(param) => updateCrudValMock(param)}
          flowId={undefined}
          mutate={jest.fn}
          setSelectedFlowId={jest.fn}
          tasks={[]}
        />
      </SessionProvider>
    );

    // fetch connections
    expect(fetchMock).toHaveBeenCalled();

    // no connections selected yet
    const selectedConnections = await screen.queryByTestId('connectionchip');
    expect(selectedConnections).toBeNull();

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections');
    await user.type(connOption, 'conn-1');

    // keyboard magic to trigger the connection selections
    const autocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    await waitFor(() => {
      // look for the element in the list of selected connections
      const selectedConnectionsAfter = screen.getByTestId('connectionchip');
      expect(selectedConnectionsAfter).toBeInTheDocument();
    });
  });

  // ================================================================================
  it('checks removing a connection', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([{ name: 'conn-1', blockName: 'conn-1-block' }]),
    });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          updateCrudVal={(param) => updateCrudValMock(param)}
          flowId={undefined}
          mutate={jest.fn}
          setSelectedFlowId={jest.fn}
          tasks={[]}
        />
      </SessionProvider>
    );

    // fetch connections
    expect(fetchMock).toHaveBeenCalled();

    // no connections selected yet
    const selectedConnections = await screen.queryByTestId('selectedconn-0');
    expect(selectedConnections).toBeNull();

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections');
    expect(connOption).toBeInTheDocument();
    await user.type(connOption, 'conn-1');

    // keyboard magic to trigger the connection selections
    const autocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    await waitFor(() => {
      // look for the element in the list of selected connections
      const selectedConnectionsAfter = screen.getByTestId('connectionchip');
      expect(selectedConnectionsAfter).toBeInTheDocument();
    });
  });

  // ================================================================================
  it('checks schedule autocomplete list', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });
    (global as any).fetch = fetchMock;

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate
            updateCrudVal={jest.fn}
            flowId={undefined}
            mutate={jest.fn}
            setSelectedFlowId={jest.fn}
            tasks={[]}
          />
        </SessionProvider>
      );
    });

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const autocomplete = screen.getByTestId('cronautocomplete');

    // test with valid value
    autocomplete.focus();
    await user.type(cronOption, 'daily');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });
    expect(cronOption.value).toBe('daily');

    // test with invalid value
    await user.type(cronOption, 'foo');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });
    expect(cronOption.value).not.toBe('foo');
  });

  // ================================================================================
  it('check payload sent to api', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([{ name: 'conn-1', connectionId: 'conn-1-id' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
      });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          updateCrudVal={updateCrudValMock}
          mutate={mutateMock}
          flowId={undefined}
          setSelectedFlowId={jest.fn}
          tasks={tasks}
        />
      </SessionProvider>
    );

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const cronautocomplete = screen.getByTestId('cronautocomplete');

    await user.clear(cronOption);
    await user.type(cronOption, 'daily');

    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    await waitFor(() => {
      expect(cronOption.value).toBe('daily');
    });

    // test with invalid value
    await user.type(cronOption, 'foo');
    // fireEvent.change(cronOption, { target: { value: 'foo' } });
    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    expect(cronOption.value).not.toBe('foo');

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections');
    expect(connOption).toBeInTheDocument();
    fireEvent.change(connOption, { target: { value: 'conn-1' } });

    // keyboard magic to trigger the connection selections
    const connectionautocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(connectionautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(connectionautocomplete, { key: 'Enter' });

    const savebutton = screen.getByTestId('savebutton');
    await user.click(savebutton);
    expect(updateCrudValMock).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();

    // enter last required field
    const flowname: any = screen.getByTestId('name').querySelector('input');
    fireEvent.change(flowname, { target: { value: 'MyFlow' } });
    await waitFor(() => {
      expect(flowname.value).toBe('MyFlow');
    });

    const fetchMock2 = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
    });
    (global as any).fetch = fetchMock2;

    // select day of week
    await user.clear(cronOption);

    await user.type(cronOption, 'weekly');
    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });

    await waitFor(() => {
      expect(cronOption.value).toBe('weekly');
    });

    const dayOfWeekOption = screen.getByRole('combobox', {
      name: 'Day of the week',
    }) as HTMLInputElement;
    const multiTagCronDaysOfWeek = screen.getByTestId('cronDaysOfWeek');
    fireEvent.change(dayOfWeekOption, { target: { value: 'Sunday' } });

    fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'ArrowDown' });
    fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'Enter' });

    // select the time also
    const timeOfDayContainer = screen.getByTestId('cronTimeOfDay');
    const inputTimeOfDay: any = timeOfDayContainer.querySelector('input');
    fireEvent.change(inputTimeOfDay, { target: { value: '01:00 AM' } });

    await user.click(savebutton);
    await waitFor(() => {
      expect(updateCrudValMock).toHaveBeenCalled();
      expect(mutateMock).toHaveBeenCalled();
    });

    const requestBody = JSON.parse(fetchMock2.mock.calls[0][1]['body']);
    expect(requestBody.name).toBe('MyFlow');
    expect(requestBody.transformTasks).toStrictEqual([]);
    expect(requestBody.connections.length).toBe(1);
    expect(requestBody.connections[0].seq).toBe(1);
    expect(requestBody.connections[0].id).toBe('conn-1-id');
  }, 10000);

  // ================================================================================
  it('check another payload sent to api - cron daily', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([{ name: 'conn-1', connectionId: 'conn-1-id' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
      });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          updateCrudVal={updateCrudValMock}
          mutate={mutateMock}
          flowId={undefined}
          setSelectedFlowId={jest.fn}
          tasks={tasks}
        />
      </SessionProvider>
    );

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const cronautocomplete = screen.getByTestId('cronautocomplete');

    // test with valid value
    await user.clear(cronOption);

    await user.type(cronOption, 'daily');
    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });

    await waitFor(() => {
      expect(cronOption.value).toBe('daily');
    });

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections');
    expect(connOption).toBeInTheDocument();
    fireEvent.change(connOption, { target: { value: 'conn-1' } });

    // keyboard magic to trigger the connection selections
    const connectionautocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(connectionautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(connectionautocomplete, { key: 'Enter' });

    const savebutton = screen.getByTestId('savebutton');

    // enter last required field
    let flowname = null;
    screen.getAllByRole('textbox').forEach((element) => {
      if ((element as HTMLInputElement).name === 'name') {
        flowname = element;
      }
    });
    expect(flowname).not.toBeNull();
    await user.type(flowname, 'MyFlow');
    const fetchMock2 = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
    });
    (global as any).fetch = fetchMock2;

    // select the time also
    const timeOfDayContainer = screen.getByTestId('cronTimeOfDay');
    const inputTimeOfDay: any = timeOfDayContainer.querySelector('input');

    fireEvent.change(inputTimeOfDay, { target: { value: '06:30 AM' } });

    await user.click(savebutton);
    expect(updateCrudValMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();

    const requestBody = JSON.parse(fetchMock2.mock.calls[0][1]['body']);

    expect(requestBody.name).toBe('MyFlow');
    expect(requestBody.transformTasks).toStrictEqual([]);
    expect(requestBody.connections.length).toBe(1);
    expect(requestBody.connections[0].seq).toBe(1);
    expect(requestBody.connections[0].id).toBe('conn-1-id');
    // this needs to be fixed based on the CI timezone
    // expect(requestBody.cron).toBe('0 1 * * *');
  }, 10000);

  // // ================================================================================
  it('check another payload sent to api - cron weekly', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([{ name: 'conn-1', connectionId: 'conn-1-id' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
      });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();

    render(
      <SessionProvider session={mockSession}>
        <FlowCreate
          updateCrudVal={updateCrudValMock}
          mutate={mutateMock}
          flowId={undefined}
          setSelectedFlowId={jest.fn}
          tasks={tasks}
        />
      </SessionProvider>
    );

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const cronautocomplete = screen.getByTestId('cronautocomplete');

    await user.clear(cronOption);

    await user.type(cronOption, 'weekly');
    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    await waitFor(() => {
      expect(cronOption.value).toBe('weekly');
    });

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections');
    expect(connOption).toBeInTheDocument();
    fireEvent.change(connOption, { target: { value: 'conn-1' } });

    // keyboard magic to trigger the connection selections
    const connectionautocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(connectionautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(connectionautocomplete, { key: 'Enter' });

    const savebutton = screen.getByTestId('savebutton');

    // enter last required field
    let flowname = null;
    screen.getAllByRole('textbox').forEach((element) => {
      if ((element as HTMLInputElement).name === 'name') {
        flowname = element;
      }
    });
    expect(flowname).not.toBeNull();
    await user.type(flowname, 'MyFlow');
    const fetchMock2 = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
    });
    (global as any).fetch = fetchMock2;

    // select day of week
    const dayOfWeekOption = screen.getByRole('combobox', {
      name: 'Day of the week',
    }) as HTMLInputElement;
    const multiTagCronDaysOfWeek = screen.getByTestId('cronDaysOfWeek');

    fireEvent.change(dayOfWeekOption, { target: { value: 'Sunday' } });

    fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'ArrowDown' });

    fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'Enter' });

    // select the time also
    const timeOfDayContainer = screen.getByTestId('cronTimeOfDay');
    const inputTimeOfDay: any = timeOfDayContainer.querySelector('input');
    fireEvent.change(inputTimeOfDay, { target: { value: '06:30 AM' } });
    fireEvent.keyDown(inputTimeOfDay, { key: 'Enter' });

    await user.click(savebutton);
    expect(updateCrudValMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();

    const requestBody = JSON.parse(fetchMock2.mock.calls[0][1]['body']);

    expect(requestBody.name).toBe('MyFlow');
    expect(requestBody.transformTasks).toStrictEqual([]);
    expect(requestBody.connections.length).toBe(1);
    expect(requestBody.connections[0].seq).toBe(1);
    expect(requestBody.connections[0].id).toBe('conn-1-id');
    // expect(requestBody.cron).toBe('0 1 * * 0');
  }, 10000);
});
