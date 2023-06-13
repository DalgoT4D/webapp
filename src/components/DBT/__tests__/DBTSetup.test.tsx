import { render, screen } from '@testing-library/react';
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

beforeEach(() => {
  const fakeResponse = {};
  const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
  const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
  (global as any).fetch = mockedFetch;
});

afterEach(() => {
  const fakeResponse = {};
  const mRes = { json: jest.fn().mockResolvedValueOnce(fakeResponse) };
  const mockedFetch = jest.fn().mockResolvedValueOnce(mRes as any);
  (global as any).fetch = mockedFetch;
});

describe('dbt Setup', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  it('renders the form', () => {
    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => { }}
          setLogs={() => { }}
          setExpandLogs={() => { }}
          showDialog={true}
          setShowDialog={() => { }}
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

  it('submits the form', async () => {

    const mockedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(
        {
          task_id: 'fake-task-id',
        }
      )
    });
    (global as any).fetch = mockedFetch;

    render(
      <SessionProvider session={mockSession}>
        <DBTSetup
          onCreateWorkspace={() => { }}
          setLogs={() => { }}
          setExpandLogs={() => { }}
          showDialog={true}
          setShowDialog={() => { }}
        />
      </SessionProvider>
    );
    const urlinputfield = screen.getByLabelText('GitHub repo URL');
    await userEvent.type(urlinputfield, "some url");

    const dbttaregtschema = screen.getByLabelText('dbt target schema');
    await userEvent.type(dbttaregtschema, "some schema");

    const savebutton = screen.getByTestId('save-github-url');
    await userEvent.click(savebutton);

    expect(mockedFetch).toHaveBeenCalled();

  });
});
