import { render, screen, act, fireEvent} from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import FlowCreate from '../FlowCreate';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// const user = userEvent.setup();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

// afterEach(() => {
//   const fakeResponse = {};
//   const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
//   const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
//   (global as any).fetch = mockedFetch;
// });

describe('Flow Creation', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  // ================================================================================
  it('renders the form', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate updateCrudVal={() => {}} mutate={() => {}} />
        </SessionProvider>
      );
    });

    const cancellink = screen.getByTestId('cancellink');
    expect(cancellink).toBeInTheDocument();
    const savebutton = screen.getByTestId('savebutton');
    expect(savebutton).toBeInTheDocument();
  });

  // ================================================================================
  it('clicks cancel button', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const updateCrudValMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate
            updateCrudVal={(param) => updateCrudValMock(param)}
            mutate={() => {}}
          />
        </SessionProvider>
      );
    });

    const cancellink = screen.getByTestId('cancellink');
    await userEvent.click(cancellink);
    expect(updateCrudValMock).toBeCalledWith('index');
  });

  // ================================================================================
  it('clicks save button without required form fields', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce([]),
    });

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate
            updateCrudVal={(param) => updateCrudValMock(param)}
            mutate={mutateMock}
          />
        </SessionProvider>
      );
    });

    const savebutton = screen.getByTestId('savebutton');
    await userEvent.click(savebutton);
    expect(updateCrudValMock).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
  });

  // ================================================================================
  it('checks connection autocomplete list and adding a connection', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValueOnce([{ name: 'conn-1', blockName: 'conn-1-block' }]),
    });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate
            updateCrudVal={(param) => updateCrudValMock(param)}
            mutate={() => {}}
          />
        </SessionProvider>
      );
    });

    // fetch connections
    expect(fetchMock).toHaveBeenCalled();

    // no connections selected yet
    const selectedConnections = await screen.queryByTestId('connectionchip');
    expect(selectedConnections).toBeNull();

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections*');
    expect(connOption).toBeInTheDocument();
    fireEvent.change(connOption, { target: { value: 'conn-1' } });

    // keyboard magic to trigger the connection selections
    const autocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    // look for the element in the list of selected connections
    const selectedConnectionsAfter = screen.getByTestId('connectionchip');
    expect(selectedConnectionsAfter).toBeInTheDocument();
  });

  // ================================================================================
  it('checks removing a connection', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValueOnce([{ name: 'conn-1', blockName: 'conn-1-block' }]),
    });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();

    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate
            updateCrudVal={(param) => updateCrudValMock(param)}
            mutate={() => {}}
          />
        </SessionProvider>
      );
    });

    // fetch connections
    expect(fetchMock).toHaveBeenCalled();

    // no connections selected yet
    const selectedConnections = await screen.queryByTestId('selectedconn-0');
    expect(selectedConnections).toBeNull();

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections*');
    expect(connOption).toBeInTheDocument();
    fireEvent.change(connOption, { target: { value: 'conn-1' } });

    // keyboard magic to trigger the connection selections
    const autocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });

    // look for the element in the list of selected connections
    const selectedConnectionsAfter = screen.getByTestId('connectionchip');
    expect(selectedConnectionsAfter).toBeInTheDocument();
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
          <FlowCreate updateCrudVal={() => {}} mutate={() => {}} />
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
    await act(() => userEvent.type(cronOption, 'daily'));
    fireEvent.keyDown(autocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(autocomplete, { key: 'Enter' });
    expect(cronOption.value).toBe('daily');

    // test with invalid value
    await act(async () => {
      userEvent.type(cronOption, 'foo');
    });
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
        json: jest
          .fn()
          .mockResolvedValueOnce([
            { name: 'conn-1', blockName: 'conn-1-block' },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
      });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate updateCrudVal={updateCrudValMock} mutate={mutateMock} />
        </SessionProvider>
      );
    });

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const cronautocomplete = screen.getByTestId('cronautocomplete');

    // test with valid value
    // cronautocomplete.focus();
    await act(async () => {
      await userEvent.clear(cronOption);
      await userEvent.type(cronOption, 'daily');
    });
    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    expect(cronOption.value).toBe('daily');

    // test with invalid value
    await act(() => userEvent.type(cronOption, 'foo'));
    // fireEvent.change(cronOption, { target: { value: 'foo' } });
    fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    expect(cronOption.value).not.toBe('foo');

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections*');
    expect(connOption).toBeInTheDocument();
    fireEvent.change(connOption, { target: { value: 'conn-1' } });

    // keyboard magic to trigger the connection selections
    const connectionautocomplete = screen.getByTestId('connectionautocomplete');
    fireEvent.keyDown(connectionautocomplete, { key: 'ArrowDown' });
    fireEvent.keyDown(connectionautocomplete, { key: 'Enter' });

    const savebutton = screen.getByTestId('savebutton');
    await userEvent.click(savebutton);
    expect(updateCrudValMock).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();

    // enter last required field
    const flowname: any = screen.getByTestId('name').querySelector('input');
    fireEvent.change(flowname, { target: { value: 'MyFlow' } });
    expect(flowname.value).toBe('MyFlow');
    const fetchMock2 = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
    });
    (global as any).fetch = fetchMock2;

    // select day of week
    await userEvent.clear(cronOption);
    await act(async () => {
      await userEvent.type(cronOption, 'weekly');
      fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
      fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    });
    expect(cronOption.value).toBe('weekly');
    const dayOfWeekOption = screen.getByRole('combobox', {
      name: 'Day of the week',
    }) as HTMLInputElement;
    const multiTagCronDaysOfWeek = screen.getByTestId('cronDaysOfWeek');
    await act(() =>
      fireEvent.change(dayOfWeekOption, { target: { value: 'Sunday' } })
    );
    fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'ArrowDown' });
    await act(() =>
      fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'Enter' })
    );

    // select the time also
    const timeOfDayContainer = screen.getByTestId('cronTimeOfDay');
    const inputTimeOfDay: any = timeOfDayContainer.querySelector('input');
    fireEvent.change(inputTimeOfDay, { target: { value: '01:00 AM' } });

    await userEvent.click(savebutton);
    expect(updateCrudValMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();

    const requestBody = JSON.parse(fetchMock2.mock.calls[0][1]['body']);
    expect(requestBody.name).toBe('MyFlow');
    expect(requestBody.dbtTransform).toBe('no');
    expect(requestBody.connectionBlocks.length).toBe(1);
    expect(requestBody.connectionBlocks[0].seq).toBe(1);
    expect(requestBody.connectionBlocks[0].blockName).toBe('conn-1-block');
    expect(requestBody.connectionBlocks[0].name).toBe('conn-1');

    // expect(fetchMock2).toHaveBeenCalledWith({
    //   name: 'MyFlow',
    //   dbtTransform: 'no',
    //   connectionBlocks: [{ seq: 1, blockName: 'conn-1-block', name: 'conn-1' }],
    //   cron: { id: 'weekly', label: 'weekly' },
    // });
  });

  // ================================================================================
  it('check another payload sent to api - cron daily', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce([
            { name: 'conn-1', blockName: 'conn-1-block' },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
      });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate updateCrudVal={updateCrudValMock} mutate={mutateMock} />
        </SessionProvider>
      );
    });

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const cronautocomplete = screen.getByTestId('cronautocomplete');

    // test with valid value
    await userEvent.clear(cronOption);
    await act(async () => {
      await userEvent.type(cronOption, 'daily');
      fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
      fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    });
    expect(cronOption.value).toBe('daily');

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections*');
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
    await userEvent.type(flowname, 'MyFlow');
    const fetchMock2 = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
    });
    (global as any).fetch = fetchMock2;

    // select day of week
    // const dayOfWeekOption = screen.getByRole('combobox', {
    //   name: 'Day of the week',
    // }) as HTMLInputElement;
    // const multiTagCronDaysOfWeek = screen.getByTestId('cronDaysOfWeek');
    // await act(() =>
    //   fireEvent.change(dayOfWeekOption, { target: { value: 'Sunday' } })
    // );
    // fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'ArrowDown' });
    // await act(() =>
    //   fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'Enter' })
    // );

    // select the time also
    const timeOfDayContainer = screen.getByTestId('cronTimeOfDay');
    const inputTimeOfDay: any = timeOfDayContainer.querySelector('input');
    fireEvent.change(inputTimeOfDay, { target: { value: '06:30 AM' } });

    await userEvent.click(savebutton);
    expect(updateCrudValMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();

    const requestBody = JSON.parse(fetchMock2.mock.calls[0][1]['body']);

    expect(requestBody.name).toBe('MyFlow');
    expect(requestBody.dbtTransform).toBe('no');
    expect(requestBody.connectionBlocks.length).toBe(1);
    expect(requestBody.connectionBlocks[0].seq).toBe(1);
    expect(requestBody.connectionBlocks[0].blockName).toBe('conn-1-block');
    expect(requestBody.connectionBlocks[0].name).toBe('conn-1');
    // expect(requestBody.cron).toBe('0 1 * * *');
  });

  // // ================================================================================
  it('check another payload sent to api - cron weekly', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValueOnce([
            { name: 'conn-1', blockName: 'conn-1-block' },
          ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ name: 'created flowname' }),
      });
    (global as any).fetch = fetchMock;

    const updateCrudValMock = jest.fn();
    const mutateMock = jest.fn();
    await act(async () => {
      render(
        <SessionProvider session={mockSession}>
          <FlowCreate updateCrudVal={updateCrudValMock} mutate={mutateMock} />
        </SessionProvider>
      );
    });

    const cronOption = screen.getByRole('combobox', {
      name: 'Daily/Weekly',
    }) as HTMLInputElement;
    expect(cronOption).toBeInTheDocument();
    const cronautocomplete = screen.getByTestId('cronautocomplete');

    // test with valid value
    // fireEvent.change(cronOption, { target: { value: 'weekly' } });
    // fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    // fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
    // fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    await userEvent.clear(cronOption);
    await act(async () => {
      await userEvent.type(cronOption, 'weekly');
      fireEvent.keyDown(cronautocomplete, { key: 'ArrowDown' });
      fireEvent.keyDown(cronautocomplete, { key: 'Enter' });
    });
    expect(cronOption.value).toBe('weekly');

    // type name of connection into the autocomplete
    const connOption = screen.getByLabelText('Connections*');
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
    await userEvent.type(flowname, 'MyFlow');
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
    await act(() =>
      fireEvent.change(dayOfWeekOption, { target: { value: 'Sunday' } })
    );
    fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'ArrowDown' });
    await act(() =>
      fireEvent.keyDown(multiTagCronDaysOfWeek, { key: 'Enter' })
    );

    // select the time also
    const timeOfDayContainer = screen.getByTestId('cronTimeOfDay');
    const inputTimeOfDay: any = timeOfDayContainer.querySelector('input');
    fireEvent.change(inputTimeOfDay, { target: { value: '06:30 AM' } });
    fireEvent.keyDown(inputTimeOfDay, { key: 'Enter' });

    await userEvent.click(savebutton);
    expect(updateCrudValMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();

    const requestBody = JSON.parse(fetchMock2.mock.calls[0][1]['body']);

    expect(requestBody.name).toBe('MyFlow');
    expect(requestBody.dbtTransform).toBe('no');
    expect(requestBody.connectionBlocks.length).toBe(1);
    expect(requestBody.connectionBlocks[0].seq).toBe(1);
    expect(requestBody.connectionBlocks[0].blockName).toBe('conn-1-block');
    expect(requestBody.connectionBlocks[0].name).toBe('conn-1');
    // expect(requestBody.cron).toBe('0 1 * * 0');
  });
});
