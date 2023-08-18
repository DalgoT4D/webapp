import { act, render, screen, within } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import InviteUserForm from '../InviteUserForm';
import userEvent from '@testing-library/user-event';

// const user = userEvent.setup();

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

const mutate = jest.fn();
const setShowForm = jest.fn();

describe('Invite user', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'a' },
  };

  it('initial render of the invite user form - success', async () => {
    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <InviteUserForm
            mutate={mutate}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      )
    );

    const inviteUserApiMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: 1 }),
    });

    (global as any).fetch = inviteUserApiMock;

    const emailInput = screen.getByLabelText('Email*');
    await userEvent.type(emailInput, 'inviteuser@gmail.com');

    const savebutton = screen.getByTestId('savebutton');
    await userEvent.click(savebutton);

    expect(inviteUserApiMock).toHaveBeenCalledTimes(1);
  });

  it('initial render of the invite user form - failure', async () => {
    await act(() =>
      render(
        <SessionProvider session={mockSession}>
          <InviteUserForm
            mutate={mutate}
            showForm={true}
            setShowForm={setShowForm}
          />
        </SessionProvider>
      )
    );

    const inviteUserApiMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: 'something went wrong' }),
    });

    (global as any).fetch = inviteUserApiMock;

    const emailInput = screen.getByLabelText('Email*');
    await userEvent.type(emailInput, 'inviteuser@gmail.com');

    const savebutton = screen.getByTestId('savebutton');
    await userEvent.click(savebutton);

    expect(inviteUserApiMock).toHaveBeenCalledTimes(1);
  });
});
