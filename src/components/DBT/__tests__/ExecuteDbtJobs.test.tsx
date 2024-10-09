import { act, fireEvent, render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DBTTarget } from '../DBTTarget';

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

jest.mock('./../../../utils/common');

const tasks: any = [
  {
    label: 'DBT clean',
    slug: 'dbt-clean',
    deploymentId: null,
    lock: null,
    id: 'task-id-1',
  },
  {
    label: 'DBT deps',
    slug: 'dbt-deps',
    deploymentId: null,
    lock: null,
    id: 'task-id-2',
  },
  {
    label: 'DBT run',
    slug: 'dbt-run',
    deploymentId: null,
    lock: null,
    id: 'task-id-3',
  },
  {
    label: 'DBT test',
    slug: 'dbt-test',
    deploymentId: null,
    lock: null,
    id: 'task-id-4',
  },
];

const setDbtRunLogs = jest.fn();
const setRunning = jest.fn();
const setExpandLogs = jest.fn();

describe('Execute dbt jobs', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  it('render the execute button and commands drop down', async () => {
    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(tasks.length + 1);
    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('DBT clean')).toBeInTheDocument();
    expect(screen.getByText('DBT deps')).toBeInTheDocument();
    expect(screen.getByText('DBT run')).toBeInTheDocument();
    expect(screen.getByText('DBT test')).toBeInTheDocument();

    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
  });

  it('execute the dbt run job - failed deployment Id missing', async () => {
    const excuteRunJobApiMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ flow_run_id: 'flow-run-id' }),
    });

    (global as any).fetch = excuteRunJobApiMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-run' } }));

    // execute dbt run
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    fireEvent.click(executeButton);

    expect(excuteRunJobApiMock).not.toHaveBeenCalled();
  });

  it('execute the dbt run job - response failure', async () => {
    const tasksUpdated = tasks.slice();
    tasksUpdated[2].deploymentId = 'deployment-id-1';

    const excuteRunJobApiMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ flow_run_id: 'flow-run-id' }),
    });

    (global as any).fetch = excuteRunJobApiMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-run' } }));

    //execute
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    await fireEvent.click(executeButton);

    expect(excuteRunJobApiMock).toHaveBeenCalledTimes(1);
  });

  it('execute the dbt run job - empty flow id', async () => {
    const tasksUpdated = tasks.slice();
    tasksUpdated[2].deploymentId = 'deployment-id-1';

    const excuteRunJobApiMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ flow_run_id: null }),
    });

    (global as any).fetch = excuteRunJobApiMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-run' } }));

    //execute
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    await fireEvent.click(executeButton);

    expect(excuteRunJobApiMock).toHaveBeenCalledTimes(1);
  });

  it('execute the dbt run job - success', async () => {
    const tasksUpdated = tasks.slice();
    tasksUpdated[2].deploymentId = 'deployment-id-1';

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ flow_run_id: 'flow-run-id-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          state_type: 'RUNNING',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          logs: {
            offset: 0,
            logs: [{ message: 'message-1' }, { message: 'message-2' }, { message: 'message-3' }],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          state_type: 'COMPLETED',
        }),
      });

    (global as any).fetch = fetchMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-run' } }));

    //execute
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    await act(() => fireEvent.click(executeButton));

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('execute the deps | clean | test command - success', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ status: 'success' }),
    });

    (global as any).fetch = fetchMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-clean' } }));

    //execute
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    await act(() => fireEvent.click(executeButton));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('execute the deps | clean | test command - failure', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ status: 'failed' }),
    });

    (global as any).fetch = fetchMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-clean' } }));

    //execute
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    await act(() => fireEvent.click(executeButton));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('execute the deps | clean | test command - api failed', async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: 'something went wrong' }),
    });

    (global as any).fetch = fetchMock;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <DBTTarget
            setDbtRunLogs={setDbtRunLogs}
            setRunning={setRunning}
            running={false}
            setExpandLogs={setExpandLogs}
            tasks={tasks}
          />
        </SessionProvider>
      )
    );

    const selectDropDown = screen.getByText('Select function');
    await userEvent.click(selectDropDown);

    const selectDiv = screen.getByTestId('dbt-functions');
    const selectInput = selectDiv.childNodes[1];
    await act(() => fireEvent.change(selectInput, { target: { value: 'dbt-clean' } }));

    //execute
    const executeButton = screen.getByTestId('runJob');
    expect(executeButton).toBeInTheDocument();
    await act(() => fireEvent.click(executeButton));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
