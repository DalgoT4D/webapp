import { act, render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import ManageUsers from '../ManageUsers';
import { SWRConfig } from 'swr';

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

const currentUser = { email: 'current-user@gmail.com' };
const users = [
  {
    email: 'current-user@gmail.com',
    org: {},
    active: true,
    role: 3,
    role_slug: 'account_manager',
  },
  {
    email: 'another-user@gmail.com',
    org: {},
    active: true,
    role: 3,
    role_slug: 'account_manager',
  },
];

const setMutateInvitations = jest.fn();

describe('Invite user', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: currentUser.email },
  };

  it('intial render of the component', async () => {
    const initalUsersFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce(users),
    });

    (global as any).fetch = initalUsersFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) =>
                fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <ManageUsers setMutateInvitations={setMutateInvitations} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    expect(initalUsersFetch).toHaveBeenCalledTimes(1);

    const usersTable = screen.getByRole('table');
    const userHeaderCells = within(usersTable).getAllByRole('columnheader');
    expect(userHeaderCells.length).toBe(3);
    expect(userHeaderCells[0].textContent).toBe('Email');
    expect(userHeaderCells[1].textContent).toBe('Role');
    expect(userHeaderCells[2].textContent).toBe('Actions');

    const usersTableRows = within(usersTable).getAllByRole('row');
    // one row + one header row
    expect(usersTableRows.length).toBe(3);

    // this is the current user so the three-dot action menu should not be shown
    const firstRow = usersTableRows[1];
    const firstRowCells = firstRow.childNodes;
    expect(firstRowCells[0].textContent).toBe(users[0].email);
    expect(firstRowCells[1].textContent).toBe(
      users[0].role_slug.replace('_', ' ')
    );
    expect(
      await within(firstRowCells[2]).queryByTestId('MoreHorizIcon')
    ).toBeNull();

    const secondRow = usersTableRows[2];
    const secondRowCells = secondRow.childNodes;
    expect(secondRowCells[0].textContent).toBe(users[1].email);
    expect(secondRowCells[1].textContent).toBe(
      users[1].role_slug.replace('_', ' ')
    );
    expect(
      await within(secondRowCells[2]).queryByTestId('MoreHorizIcon')
    ).toBeInTheDocument();
  });
});

describe('Delete org user', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: currentUser.email },
  };

  it('Delete org user - success', async () => {
    const initalUsersFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce(users),
    });

    (global as any).fetch = initalUsersFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) =>
                fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <ManageUsers setMutateInvitations={setMutateInvitations} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const usersTable = screen.getByRole('table');
    const userHeaderCells = within(usersTable).getAllByRole('columnheader');
    expect(userHeaderCells.length).toBe(3);
    expect(userHeaderCells[0].textContent).toBe('Email');
    expect(userHeaderCells[1].textContent).toBe('Role');
    expect(userHeaderCells[2].textContent).toBe('Actions');

    const usersTableRows = within(usersTable).getAllByRole('row');
    // one row + one header row
    expect(usersTableRows.length).toBe(3);

    const secondRow = usersTableRows[2];
    const secondRowCells = secondRow.childNodes;
    expect(secondRowCells[0].textContent).toBe(users[1].email);
    expect(secondRowCells[1].textContent).toBe(
      users[1].role_slug.replace('_', ' ')
    );

    const actionDeleteCell: any | HTMLElement | undefined =
      secondRowCells[2]?.firstChild;

    const actionThreeDotsButton: HTMLElement | null =
      within(actionDeleteCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const deleteAction = actionMenuItems[1];
    await act(() => deleteAction.click());

    const confirmButton = screen.getByTestId('confirmbutton');

    // Mock the delete api call success
    const deleteOrgUserApiMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: 1,
      }),
    });
    (global as any).fetch = deleteOrgUserApiMock;

    await act(() => confirmButton.click());

    // mutate will also be called on this
    expect(deleteOrgUserApiMock).toHaveBeenCalledTimes(2);
  });

  it('Delete org user - failure', async () => {
    const initalUsersFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce(users),
    });

    (global as any).fetch = initalUsersFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) =>
                fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <ManageUsers setMutateInvitations={setMutateInvitations} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const usersTable = screen.getByRole('table');
    const userHeaderCells = within(usersTable).getAllByRole('columnheader');
    expect(userHeaderCells.length).toBe(3);
    expect(userHeaderCells[0].textContent).toBe('Email');
    expect(userHeaderCells[1].textContent).toBe('Role');
    expect(userHeaderCells[2].textContent).toBe('Actions');

    const usersTableRows = within(usersTable).getAllByRole('row');
    // one row + one header row
    expect(usersTableRows.length).toBe(3);

    const secondRow = usersTableRows[2];
    const secondRowCells = secondRow.childNodes;
    expect(secondRowCells[0].textContent).toBe(users[1].email);
    expect(secondRowCells[1].textContent).toBe(
      users[1].role_slug.replace('_', ' ')
    );

    const actionDeleteCell: any | HTMLElement | undefined =
      secondRowCells[2]?.firstChild;

    const actionThreeDotsButton: HTMLElement | null =
      within(actionDeleteCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const deleteAction = actionMenuItems[1];
    await act(() => deleteAction.click());

    const confirmButton = screen.getByTestId('confirmbutton');

    // Mock the delete api call success
    const deleteOrgUserApiMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        detail: 'something went wrong',
      }),
    });
    (global as any).fetch = deleteOrgUserApiMock;

    await act(() => confirmButton.click());

    // mutate will also be called on this
    expect(deleteOrgUserApiMock).toHaveBeenCalledTimes(1);
  });
});

describe('Make account manager', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: currentUser.email },
  };

  it('Make account manager - success', async () => {
    const initalUsersFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce(users),
    });

    (global as any).fetch = initalUsersFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) =>
                fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <ManageUsers setMutateInvitations={setMutateInvitations} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const usersTable = screen.getByRole('table');
    const userHeaderCells = within(usersTable).getAllByRole('columnheader');
    expect(userHeaderCells.length).toBe(3);
    expect(userHeaderCells[0].textContent).toBe('Email');
    expect(userHeaderCells[1].textContent).toBe('Role');
    expect(userHeaderCells[2].textContent).toBe('Actions');

    const usersTableRows = within(usersTable).getAllByRole('row');
    // one row + one header row
    expect(usersTableRows.length).toBe(3);

    const secondRow = usersTableRows[2];
    const secondRowCells = secondRow.childNodes;
    expect(secondRowCells[0].textContent).toBe(users[1].email);
    expect(secondRowCells[1].textContent).toBe(
      users[1].role_slug.replace('_', ' ')
    );

    const actionDeleteCell: any | HTMLElement | undefined =
      secondRowCells[2]?.firstChild;

    const actionThreeDotsButton: HTMLElement | null =
      within(actionDeleteCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const deleteAction = actionMenuItems[0];
    await act(() => deleteAction.click());

    const confirmButton = screen.getByTestId('confirmbutton');

    // Mock the delete api call success
    const makeAccManagerApiMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: 1,
      }),
    });
    (global as any).fetch = makeAccManagerApiMock;

    await act(() => confirmButton.click());

    // mutate will also be called on this
    expect(makeAccManagerApiMock).toHaveBeenCalledTimes(2);
  });

  it('Make account manager - failure', async () => {
    const initalUsersFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce(users),
    });

    (global as any).fetch = initalUsersFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) =>
                fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <ManageUsers setMutateInvitations={setMutateInvitations} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const usersTable = screen.getByRole('table');
    const userHeaderCells = within(usersTable).getAllByRole('columnheader');
    expect(userHeaderCells.length).toBe(3);
    expect(userHeaderCells[0].textContent).toBe('Email');
    expect(userHeaderCells[1].textContent).toBe('Role');
    expect(userHeaderCells[2].textContent).toBe('Actions');

    const usersTableRows = within(usersTable).getAllByRole('row');
    // one row + one header row
    expect(usersTableRows.length).toBe(3);

    const secondRow = usersTableRows[2];
    const secondRowCells = secondRow.childNodes;
    expect(secondRowCells[0].textContent).toBe(users[1].email);
    expect(secondRowCells[1].textContent).toBe(
      users[1].role_slug.replace('_', ' ')
    );

    const actionDeleteCell: any | HTMLElement | undefined =
      secondRowCells[2]?.firstChild;

    const actionThreeDotsButton: HTMLElement | null =
      within(actionDeleteCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const deleteAction = actionMenuItems[0];
    await act(() => deleteAction.click());

    const confirmButton = screen.getByTestId('confirmbutton');

    // Mock the delete api call success
    const makeAccountManagerApiMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        detail: 'something went wrong',
      }),
    });
    (global as any).fetch = makeAccountManagerApiMock;

    await act(() => confirmButton.click());

    // mutate will also be called on this
    expect(makeAccountManagerApiMock).toHaveBeenCalledTimes(1);
  });
});
