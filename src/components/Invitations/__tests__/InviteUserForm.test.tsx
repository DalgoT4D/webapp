import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import InviteUserForm from '../InviteUserForm';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';

const roles = [
  {
    uuid: 'fake-uuid-1',
    slug: 'account-manager',
    name: 'Account manager',
  },
  {
    uuid: 'fake-uuid-2',
    slug: 'pipeline-manager',
    name: 'Pipeline manager',
  },
];

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

  const mockRoles = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(roles),
  });

  const inviteForm = (
    <SWRConfig
      value={{
        dedupingInterval: 0,
        fetcher: (resource) => mockRoles(resource, {}).then((res: any) => res.json()),
        provider: () => new Map(),
      }}
    >
      <SessionProvider session={mockSession}>
        <InviteUserForm mutate={mutate} showForm={true} setShowForm={setShowForm} />
      </SessionProvider>
    </SWRConfig>
  );

  const user = userEvent.setup();
  it('initial render of the invite user form - success', async () => {
    const inviteUserApiMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: 1 }),
    });

    global.fetch = inviteUserApiMock;

    render(inviteForm);

    const emailInput = screen.getByLabelText('Email*');
    await user.type(emailInput, 'inviteuser@gmail.com');

    const dropdown = screen.getByRole('combobox');
    await user.click(dropdown);

    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toBeVisible();

    // Select an option
    await user.click(firstOption);

    const savebutton = screen.getByTestId('savebutton');
    await userEvent.click(savebutton);

    expect(inviteUserApiMock).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalled();
  });

  it('initial render of the invite user form - failure', async () => {
    const inviteUserApiMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ detail: 'something went wrong' }),
    });

    global.fetch = inviteUserApiMock;

    render(inviteForm);

    const emailInput = screen.getByLabelText('Email*');
    await userEvent.type(emailInput, 'inviteuser@gmail.com');

    const dropdown = screen.getByRole('combobox');
    await user.click(dropdown);

    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toBeVisible();

    // Select an option
    await user.click(firstOption);

    const savebutton = screen.getByTestId('savebutton');
    await userEvent.click(savebutton);

    expect(inviteUserApiMock).toHaveBeenCalledTimes(1);
  });
});
