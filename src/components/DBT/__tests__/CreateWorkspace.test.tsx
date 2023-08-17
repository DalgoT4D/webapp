import { act, render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { DBTSetup } from '../DBTSetup';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
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
          onCreateWorkspace={() => {}}
          setLogs={() => {}}
          setExpandLogs={() => {}}
          showDialog={true}
          setShowDialog={() => {}}
          setWorkspace={() => {}}
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
      json: jest
        .fn()
        .mockResolvedValueOnce({ detail: "couldn't create workspace" }),
    });

    (global as any).fetch = createWorkspaceFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => {}}
          setLogs={() => {}}
          setExpandLogs={() => {}}
          showDialog={true}
          setShowDialog={() => {}}
          setWorkspace={() => {}}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('save-github-url');
    await act(() => savebutton.click());

    expect(createWorkspaceFetch).not.toHaveBeenCalled();

    const urlinputfield = screen.getByLabelText('GitHub repo URL*');
    await userEvent.type(urlinputfield, 'github-repo-url');

    await act(() => savebutton.click());
    expect(createWorkspaceFetch).not.toHaveBeenCalled();

    const patinputfield = screen.getByLabelText('Personal access token');
    await userEvent.type(patinputfield, 'token-123');

    await act(() => savebutton.click());
    expect(createWorkspaceFetch).not.toHaveBeenCalled();

    const dbttargetschema = screen.getByLabelText('dbt target schema*');
    await userEvent.type(dbttargetschema, 'dest-schema');

    await act(() => savebutton.click());
    expect(createWorkspaceFetch).toHaveBeenCalled();
  });

  it('submit form to create workspace - check progress', async () => {
    const createWorkspaceFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest
        .fn()
        .mockResolvedValueOnce({ detail: "couldn't create workspace" }),
    });

    (global as any).fetch = createWorkspaceFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => {}}
          setLogs={() => {}}
          setExpandLogs={() => {}}
          showDialog={true}
          setShowDialog={() => {}}
          setWorkspace={() => {}}
          mode="create"
          gitrepoUrl=""
          schema=""
        />
      </SessionProvider>
    );

    const savebutton = screen.getByTestId('save-github-url');
    await act(() => savebutton.click());

    expect(createWorkspaceFetch).not.toHaveBeenCalled();

    const urlinputfield = screen.getByLabelText('GitHub repo URL*');
    await userEvent.type(urlinputfield, 'github-repo-url');

    await act(() => savebutton.click());
    expect(createWorkspaceFetch).not.toHaveBeenCalled();

    const patinputfield = screen.getByLabelText('Personal access token');
    await userEvent.type(patinputfield, 'token-123');

    await act(() => savebutton.click());
    expect(createWorkspaceFetch).not.toHaveBeenCalled();

    const dbttargetschema = screen.getByLabelText('dbt target schema*');
    await userEvent.type(dbttargetschema, 'dest-schema');

    await act(() => savebutton.click());
    expect(createWorkspaceFetch).toHaveBeenCalled();
  });
});
