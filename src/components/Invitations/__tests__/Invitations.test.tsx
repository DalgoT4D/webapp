import { act, render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import Invitations from '../Invitations';
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

describe('Invitations', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  const invitations = [
    {
      id: 59,
      invited_email: 'test@gmail.com',
      invited_role: {
        uuid: 'fake-uuid-1',
        name: 'test-role',
      },
      invited_on: '2023-08-18T13:00:00.000Z',
    },
  ];

  it('initial render of the component', async () => {
    const invitationsMockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(invitations),
    });

    (global as any).fetch = invitationsMockFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <Invitations mutateInvitationsParent={false} setMutateInvitationsParent={() => {}} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    expect(invitationsMockFetch).toHaveBeenCalledTimes(1);

    const invitationsTable = screen.getByRole('table');
    const invitationHeaderCells = within(invitationsTable).getAllByRole('columnheader');
    expect(invitationHeaderCells.length).toBe(4);
    expect(invitationHeaderCells[0].textContent).toBe('Email');
    expect(invitationHeaderCells[1].textContent).toBe('Role');
    expect(invitationHeaderCells[2].textContent).toBe('Sent On');
    expect(invitationHeaderCells[3].textContent).toBe('Actions');

    const invitationsTableRows = within(invitationsTable).getAllByRole('row');
    // one row + one header row
    expect(invitationsTableRows.length).toBe(2);

    const firstRow = invitationsTableRows[1];
    const firstRowCells = firstRow.childNodes;
    expect(firstRowCells[0].textContent).toBe(invitations[0].invited_email);
    expect(firstRowCells[1].textContent).toBe(invitations[0].invited_role.name);
    // git CI/CD screws up time somehow
    // expect(firstRowCells[2].textContent).toBe('18th Aug 06:30 PM');
  });

  it('resend invitation - failure', async () => {
    const initialFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(invitations),
    });

    (global as any).fetch = initialFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <Invitations mutateInvitationsParent={false} setMutateInvitationsParent={() => {}} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const invitationsTable = screen.getByRole('table');
    const invitationsTableRows = within(invitationsTable).getAllByRole('row');
    // // one row + one header row
    expect(invitationsTableRows.length).toBe(2);
    const firstRow = invitationsTableRows[1];
    const firstRowCells = firstRow.childNodes;
    const invitationActionCell: any | HTMLElement | undefined = firstRowCells[3];

    const actionThreeDotsButton: HTMLElement | null =
      within(invitationActionCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const resendAction = actionMenuItems[0];
    await act(() => resendAction.click());

    const resendInvitationApiMockFail = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: "couldn't resend the invitation" }),
    });

    (global as any).fetch = resendInvitationApiMockFail;

    const confirmButton = screen.getByTestId('confirmbutton');

    await act(() => confirmButton.click());

    expect(resendInvitationApiMockFail).toHaveBeenCalledTimes(1);
  });

  it('resend invitation - success', async () => {
    const initialFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(invitations),
    });

    (global as any).fetch = initialFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <Invitations mutateInvitationsParent={false} setMutateInvitationsParent={() => {}} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const invitationsTable = screen.getByRole('table');
    const invitationsTableRows = within(invitationsTable).getAllByRole('row');
    // // one row + one header row
    expect(invitationsTableRows.length).toBe(2);
    const firstRow = invitationsTableRows[1];
    const firstRowCells = firstRow.childNodes;
    const invitationActionCell: any | HTMLElement | undefined = firstRowCells[3];

    const actionThreeDotsButton: HTMLElement | null =
      within(invitationActionCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const resendAction = actionMenuItems[0];
    await act(() => resendAction.click());

    const resendInvitationApiMockSuccess = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ success: 1 }),
    });

    (global as any).fetch = resendInvitationApiMockSuccess;

    const confirmButton = screen.getByTestId('confirmbutton');

    await act(() => confirmButton.click());

    expect(resendInvitationApiMockSuccess).toHaveBeenCalledTimes(1);
  });

  it('delete invitation - failure', async () => {
    const initialFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(invitations),
    });

    (global as any).fetch = initialFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <Invitations mutateInvitationsParent={false} setMutateInvitationsParent={() => {}} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const invitationsTable = screen.getByRole('table');
    const invitationsTableRows = within(invitationsTable).getAllByRole('row');
    // // one row + one header row
    expect(invitationsTableRows.length).toBe(2);
    const firstRow = invitationsTableRows[1];
    const firstRowCells = firstRow.childNodes;
    const invitationActionCell: any | HTMLElement | undefined = firstRowCells[3];

    const actionThreeDotsButton: HTMLElement | null =
      within(invitationActionCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const deleteAction = actionMenuItems[1];
    await act(() => deleteAction.click());

    const deleteInvitationApiMockFail = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: 'something went wrong' }),
    });

    (global as any).fetch = deleteInvitationApiMockFail;

    const confirmButton = screen.getByTestId('confirmbutton');

    await act(() => confirmButton.click());

    expect(deleteInvitationApiMockFail).toHaveBeenCalledTimes(1);
  });

  it('delete invitation - success', async () => {
    const initialFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(invitations),
    });

    (global as any).fetch = initialFetch;

    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
            }}
          >
            <Invitations mutateInvitationsParent={false} setMutateInvitationsParent={() => {}} />
          </SWRConfig>
        </SessionProvider>
      )
    );

    const invitationsTable = screen.getByRole('table');
    const invitationsTableRows = within(invitationsTable).getAllByRole('row');
    // // one row + one header row
    expect(invitationsTableRows.length).toBe(2);
    const firstRow = invitationsTableRows[1];
    const firstRowCells = firstRow.childNodes;
    const invitationActionCell: any | HTMLElement | undefined = firstRowCells[3];

    const actionThreeDotsButton: HTMLElement | null =
      within(invitationActionCell).getByTestId('MoreHorizIcon').parentElement;
    await act(() => actionThreeDotsButton?.click());

    // will open the confirmation dialogue
    const actionMenuItems = screen.getAllByRole('menuitem');
    const deleteAction = actionMenuItems[1];
    await act(() => deleteAction.click());

    const deleteInvitationApiMockSuccess = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: 1 }),
    });

    (global as any).fetch = deleteInvitationApiMockSuccess;

    const confirmButton = screen.getByTestId('confirmbutton');

    await act(() => confirmButton.click());

    // mutate is also called after the succesful delete
    expect(deleteInvitationApiMockSuccess).toHaveBeenCalledTimes(2);
  });

  it('new invitation appears in the list after some time', async () => {
    const initialInvitations = [
      {
        id: 59,
        invited_email: 'test@gmail.com',
        invited_role: {
          uuid: 'fake-uuid-1',
          name: 'test-role',
        },
        invited_on: '2023-08-18T13:00:00.000Z',
      },
    ];

    // Mock initial fetch
    const initialFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(initialInvitations),
    });

    (global as any).fetch = initialFetch;

    const { rerender } = render(
      <SessionProvider session={mockSession}>
        <SWRConfig
          value={{
            dedupingInterval: 0,
            fetcher: (resource) => fetch(resource, {}).then((res) => res.json()),
          }}
        >
          <Invitations mutateInvitationsParent={false} setMutateInvitationsParent={() => {}} />
        </SWRConfig>
      </SessionProvider>
    );

    // Verify initial state
    const initialTable = screen.getByRole('table');
    const initialRows = within(initialTable).getAllByRole('row');
    console.log('initialRows', initialRows);
    expect(initialRows.length).toBe(2); // header + 1 row

    // Mock updated fetch with new invitation

    const updatedInvitations = [
      ...initialInvitations,
      {
        id: 60,
        invited_email: 'newuser@gmail.com',
        invited_role: {
          uuid: 'fake-uuid-2',
          name: 'new-role',
        },
        invited_on: '2023-08-19T13:00:00.000Z',
      },
    ];
    const updatedFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(updatedInvitations),
    });

    (global as any).fetch = updatedFetch;

    await act(async () => {
      // Wait for the polling interval
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    // This should fail in main branch since the component won't update automatically
    const updatedTable = screen.getByRole('table');
    const updatedRows = within(updatedTable).getAllByRole('row');
    expect(updatedRows.length).toBe(3); // header + 2 rows

    // These assertions will also fail in main branch
    const newRow = updatedRows[2];
    const newRowCells = newRow.childNodes;
    expect(newRowCells[0].textContent).toBe('newuser@gmail.com');
    expect(newRowCells[1].textContent).toBe('new-role');
  });
});
