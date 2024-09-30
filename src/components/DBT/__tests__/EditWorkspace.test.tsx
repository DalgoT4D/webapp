import { act, render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { DBTSetup } from '../DBTSetup';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('./../../../utils/common');

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

const dbt = { gitrepoUrl: 'gitrepo-url-1', schema: 'prod' };

describe('Edit workspace', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  it('initial render of the prefilled form', () => {
    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => {}}
          setLogs={() => {}}
          setExpandLogs={() => {}}
          showDialog={true}
          setShowDialog={() => {}}
          setWorkspace={() => {}}
          mode="edit"
          gitrepoUrl={dbt.gitrepoUrl}
          schema={dbt.schema}
        />
      </SessionProvider>
    );
    const urlinputfield: HTMLInputElement = screen.getByLabelText('GitHub repo URL*');
    expect(urlinputfield.value).toBe(dbt.gitrepoUrl);

    const patinputfield: HTMLInputElement = screen.getByLabelText('Personal access token');
    expect(patinputfield.value).toBe('');

    const dbttargetschema: HTMLInputElement = screen.getByLabelText('dbt target schema*');
    expect(dbttargetschema.value).toBe(dbt.schema);

    const savebutton = screen.getByTestId('save-github-url');
    expect(savebutton).toHaveTextContent('Save');

    const cancelbutton = screen.getByTestId('cancel');
    expect(cancelbutton).toHaveTextContent('Cancel');
  });

  it('edit the git repo url', async () => {
    const editWorkspaceFetchAndProgress = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ task_id: 'edit-task-id' }),
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
            { message: 'msg-2', status: 'completed' },
          ],
        }),
      });

    (global as any).fetch = editWorkspaceFetchAndProgress;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => {}}
          setLogs={() => {}}
          setExpandLogs={() => {}}
          showDialog={true}
          setShowDialog={() => {}}
          setWorkspace={() => {}}
          mode="edit"
          gitrepoUrl={dbt.gitrepoUrl}
          schema={dbt.schema}
        />
      </SessionProvider>
    );
    const urlinputfield: HTMLInputElement = screen.getByLabelText('GitHub repo URL*');
    expect(urlinputfield.value).toBe(dbt.gitrepoUrl);

    const patinputfield: HTMLInputElement = screen.getByLabelText('Personal access token');
    expect(patinputfield.value).toBe('');

    const dbttargetschema: HTMLInputElement = screen.getByLabelText('dbt target schema*');
    expect(dbttargetschema.value).toBe(dbt.schema);

    // update git repo url
    await userEvent.clear(urlinputfield);
    await userEvent.type(urlinputfield, 'gitrepo-url-2');
    expect(urlinputfield.value).toBe('gitrepo-url-2');

    const savebutton = screen.getByTestId('save-github-url');
    await act(() => savebutton.click());

    expect(editWorkspaceFetchAndProgress).toHaveBeenCalledTimes(3);
  });

  it('edit the schema', async () => {
    const editWorkspaceFetchAndProgress = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ task_id: 'edit-task-id' }),
    });

    (global as any).fetch = editWorkspaceFetchAndProgress;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => {}}
          setLogs={() => {}}
          setExpandLogs={() => {}}
          showDialog={true}
          setShowDialog={() => {}}
          setWorkspace={() => {}}
          mode="edit"
          gitrepoUrl={dbt.gitrepoUrl}
          schema={dbt.schema}
        />
      </SessionProvider>
    );
    const urlinputfield: HTMLInputElement = screen.getByLabelText('GitHub repo URL*');
    expect(urlinputfield.value).toBe(dbt.gitrepoUrl);

    const patinputfield: HTMLInputElement = screen.getByLabelText('Personal access token');
    expect(patinputfield.value).toBe('');

    const dbttargetschema: HTMLInputElement = screen.getByLabelText('dbt target schema*');
    expect(dbttargetschema.value).toBe(dbt.schema);

    // update the schema
    await userEvent.clear(dbttargetschema);
    await userEvent.type(dbttargetschema, 'prod-2');
    expect(dbttargetschema.value).toBe('prod-2');

    const savebutton = screen.getByTestId('save-github-url');
    await act(() => savebutton.click());

    expect(editWorkspaceFetchAndProgress).toHaveBeenCalledTimes(1);
  });
});
