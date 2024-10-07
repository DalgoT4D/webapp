import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

import { DBTSetup } from '../DBTSetup';

jest.mock('./../../../utils/common');

const fnMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: fnMock,
    };
  },
}));

describe('Create workspace', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  it('initial render of the form', () => {
    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={fnMock}
          setLogs={fnMock}
          setExpandLogs={fnMock}
          showDialog={true}
          setShowDialog={fnMock}
          setWorkspace={fnMock}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );
    const urlinputfield = screen.getByTestId('github-url');
    expect(urlinputfield).toBeInTheDocument();

    const patinputfield = screen.getByTestId('github-pat');
    expect(patinputfield).toBeInTheDocument();

    const dbttargetschema = screen.getByTestId('dbt-target-schema');
    expect(dbttargetschema).toBeInTheDocument();

    const savebutton = screen.getByTestId('save-github-url');
    expect(savebutton).toHaveTextContent('Save');

    const cancelbutton = screen.getByTestId('cancel');
    expect(cancelbutton).toHaveTextContent('Cancel');
  });

  it('submit form to create workspace - failure', async () => {
    const createWorkspaceFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: "couldn't create workspace" }),
    });

    global.fetch = createWorkspaceFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={fnMock}
          setLogs={fnMock}
          setExpandLogs={fnMock}
          showDialog={true}
          setShowDialog={fnMock}
          setWorkspace={fnMock}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('save-github-url');
    await userEvent.click(savebutton);
    waitFor(() => {
      expect(createWorkspaceFetch).not.toHaveBeenCalled();
    });

    const urlinputfield = screen.getByLabelText('GitHub repo URL*');
    await userEvent.type(urlinputfield, 'github-repo-url');

    await userEvent.click(savebutton);
    waitFor(() => {
      expect(createWorkspaceFetch).not.toHaveBeenCalled();
    });

    const patinputfield = screen.getByLabelText('Personal access token');
    await userEvent.type(patinputfield, 'token-123');

    await userEvent.click(savebutton);
    await waitFor(() => {
      expect(createWorkspaceFetch).not.toHaveBeenCalled();
    });

    const dbttargetschema = screen.getByLabelText('dbt target schema*');
    await userEvent.type(dbttargetschema, 'dest-schema');

    await userEvent.click(savebutton);
    await waitFor(() => {
      expect(createWorkspaceFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('submit form to create workspace - check progress failed', async () => {
    const createWorkspaceFetchAndProgress = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ task_id: 'test-task-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          progress: [{ message: 'msg-1', status: 'running' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          progress: [
            { message: 'msg-1', status: 'running' },
            { message: 'msg-2', status: 'failed' },
          ],
        }),
      });

    global.fetch = createWorkspaceFetchAndProgress;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={fnMock}
          setLogs={fnMock}
          setExpandLogs={fnMock}
          showDialog={true}
          setShowDialog={fnMock}
          setWorkspace={fnMock}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('save-github-url');

    const urlinputfield = screen.getByLabelText('GitHub repo URL*');
    await userEvent.type(urlinputfield, 'github-repo-url');

    const patinputfield = screen.getByLabelText('Personal access token');
    await userEvent.type(patinputfield, 'token-123');

    const dbttargetschema = screen.getByLabelText('dbt target schema*');
    await userEvent.type(dbttargetschema, 'dest-schema');

    await userEvent.click(savebutton);
    await waitFor(() => {
      expect(createWorkspaceFetchAndProgress).toHaveBeenCalledTimes(3);
    });
  });

  it('submit form to create workspace - check progress api failed', async () => {
    const createWorkspaceFetchAndProgress = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ task_id: 'test-task-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          progress: [{ message: 'msg-1', status: 'running' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({
          progress: [
            { message: 'msg-1', status: 'running' },
            { message: 'msg-2', status: 'running' },
          ],
        }),
      });

    global.fetch = createWorkspaceFetchAndProgress;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={fnMock}
          setLogs={fnMock}
          setExpandLogs={fnMock}
          showDialog={true}
          setShowDialog={fnMock}
          setWorkspace={fnMock}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('save-github-url');

    const urlinputfield = screen.getByLabelText('GitHub repo URL*');
    await userEvent.type(urlinputfield, 'github-repo-url');

    const patinputfield = screen.getByLabelText('Personal access token');
    await userEvent.type(patinputfield, 'token-123');

    const dbttargetschema = screen.getByLabelText('dbt target schema*');
    await userEvent.type(dbttargetschema, 'dest-schema');

    await userEvent.click(savebutton);
    await waitFor(() => {
      expect(createWorkspaceFetchAndProgress).toHaveBeenCalledTimes(3);
    });
  });

  it('submit form to create workspace - check progress success', async () => {
    const createWorkspaceFetchAndProgress = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ task_id: 'test-task-id' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          progress: [{ message: 'msg-1', status: 'running' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          progress: [
            { message: 'msg-1', status: 'running' },
            { message: 'msg-2', status: 'running' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          progress: [
            { message: 'msg-1', status: 'running' },
            { message: 'msg-2', status: 'running' },
            { message: 'msg-3', status: 'completed' },
          ],
        }),
      });

    global.fetch = createWorkspaceFetchAndProgress;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={fnMock}
          setLogs={fnMock}
          setExpandLogs={fnMock}
          showDialog={true}
          setShowDialog={fnMock}
          setWorkspace={fnMock}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('save-github-url');

    const urlinputfield = screen.getByLabelText('GitHub repo URL*');
    await userEvent.type(urlinputfield, 'github-repo-url');

    const patinputfield = screen.getByLabelText('Personal access token');
    await userEvent.type(patinputfield, 'token-123');

    const dbttargetschema = screen.getByLabelText('dbt target schema*');
    await userEvent.type(dbttargetschema, 'dest-schema');

    await userEvent.click(savebutton);
    await waitFor(() => {
      expect(createWorkspaceFetchAndProgress).toHaveBeenCalledTimes(4);
    });
  });
});
