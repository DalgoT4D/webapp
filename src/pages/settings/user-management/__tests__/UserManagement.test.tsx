import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import '@testing-library/jest-dom';
import UserManagement from '../index';
import { SWRConfig } from 'swr';
import { GlobalContext } from '@/contexts/ContextProvider';
import * as React from 'react';

// Mock the InviteUserForm component
jest.mock('@/components/Invitations/InviteUserForm', () => {
  return jest.fn(({ mutate, showForm, setShowForm }) => {
    // Simulate the form submission
    const handleSubmit = () => {
      mutate();
      setShowForm(false);
    };

    return showForm ? (
      <div data-testid="mock-invite-form">
        <button data-testid="mock-submit-button" onClick={handleSubmit}>
          Send Invitation
        </button>
      </div>
    ) : null;
  });
});

// Mock the Invitations component
jest.mock('@/components/Invitations/Invitations', () => {
  return jest.fn(({ mutateInvitationsParent, setMutateInvitationsParent }) => {
    React.useEffect(() => {
      if (mutateInvitationsParent) {
        setMutateInvitationsParent(false);
      }
    }, [mutateInvitationsParent, setMutateInvitationsParent]);

    return (
      <div data-testid="mock-invitations">
        {mutateInvitationsParent ? 'Refreshing data...' : 'Invitations list'}
      </div>
    );
  });
});

// Mock the ManageUsers component
jest.mock('@/components/UserManagement/ManageUsers', () => {
  return jest.fn(() => <div data-testid="mock-manage-users">Users list</div>);
});

// Mock the useQueryParams hook
jest.mock('@/customHooks/useQueryParams', () => ({
  useQueryParams: () => ({
    value: 1, // Set to 1 to show the Pending Invitations tab
    handleChange: jest.fn(),
  }),
}));

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
      isReady: true,
      query: { tab: 'pending_invitations' },
    };
  },
}));

describe('UserManagement', () => {
  const mockSession: Session = {
    expires: 'true',
    user: { email: 'test@example.com' },
  };

  const renderUserManagement = () => {
    return render(
      <GlobalContext.Provider
        value={{
          Permissions: { state: ['can_view_invitations', 'can_create_invitation'] },
          Toast: { state: {}, dispatch: jest.fn() },
          CurrentOrg: { state: {}, dispatch: jest.fn() },
          OrgUsers: { state: [], dispatch: jest.fn() },
          UnsavedChanges: { state: false, dispatch: jest.fn() },
        }}
      >
        <SessionProvider session={mockSession}>
          <SWRConfig
            value={{
              dedupingInterval: 0,
              fetcher: jest.fn(),
              provider: () => new Map(),
            }}
          >
            <UserManagement />
          </SWRConfig>
        </SessionProvider>
      </GlobalContext.Provider>
    );
  };

  it('should update mutateInvitations state when a new invitation is sent', async () => {
    renderUserManagement();

    // Click the "Invite user" button
    const inviteButton = screen.getByTestId('invite-user');
    fireEvent.click(inviteButton);

    // The mock invite form should be visible
    const mockInviteForm = screen.getByTestId('mock-invite-form');
    expect(mockInviteForm).toBeInTheDocument();

    // Click the "Send Invitation" button in the mock form
    const submitButton = screen.getByTestId('mock-submit-button');
    fireEvent.click(submitButton);

    // The Invitations component should show "Refreshing data..." initially
    // and then change back to "Invitations list" after the useEffect runs
    await waitFor(() => {
      const mockInvitations = screen.getByTestId('mock-invitations');
      expect(mockInvitations).toHaveTextContent('Invitations list');
    });
  });
});
