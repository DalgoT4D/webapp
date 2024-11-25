import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PreferencesForm from '../PreferencesForm';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { httpPut } from '@/helpers/http';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

jest.mock('swr');
jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');

describe('PreferencesForm Component with Permissions', () => {
  const mockPreferences = {
    res: {
      enable_discord_notifications: true,
      enable_email_notifications: true,
      discord_webhook: 'https://discord.com/webhook/test',
    },
  };

  const mockSession = {
    expires: '1',
    user: { email: 'a' },
  };
  const mockMutate = jest.fn();
  const setShowForm = jest.fn();

  const mockContextWithPermissions = {
    Permissions: {
      state: ['can_edit_org_notification_settings'],
    },
  };

  const mockContextWithoutPermissions = {
    Permissions: {
      state: [], // No permissions
    },
  };

  beforeEach(() => {
    (useSWR as jest.Mock).mockReturnValue({ data: mockPreferences, mutate: mockMutate });
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    jest.clearAllMocks();
  });

  test('renders the form and shows enabled fields for users with permissions', () => {
    render(
      <GlobalContext.Provider value={mockContextWithPermissions}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    // Email Notifications
    expect(screen.getByLabelText('Enable Email Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Email Notifications')).toBeChecked();

    // Discord Notifications
    const discordSwitch = screen.getByLabelText('Enable Discord Notifications');
    expect(discordSwitch).toBeInTheDocument();
    expect(discordSwitch).toBeChecked();
    expect(discordSwitch).not.toBeDisabled();

    // Discord Webhook
    const webhookInput = screen.getByLabelText('Discord Webhook*');
    expect(webhookInput).toBeInTheDocument();
    expect(webhookInput).toHaveValue('https://discord.com/webhook/test');
    expect(webhookInput).not.toBeDisabled();
  });

  test('disables fields for users without permissions', () => {
    render(
      <GlobalContext.Provider value={mockContextWithoutPermissions}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    // Discord Notifications
    const discordSwitch = screen.getByLabelText('Enable Discord Notifications');
    expect(discordSwitch).toBeInTheDocument();
    expect(discordSwitch).toBeDisabled();

    // Discord Webhook
    const webhookInput = screen.getByLabelText('Discord Webhook*');
    expect(webhookInput).toBeInTheDocument();
    expect(webhookInput).toBeDisabled();
  });

  test('submits the form successfully for users with permissions', async () => {
    (httpPut as jest.Mock).mockResolvedValue({});

    render(
      <GlobalContext.Provider value={mockContextWithPermissions}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const saveButton = screen.getByTestId('savebutton');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(mockSession, 'userpreferences/', {
        enable_email_notifications: true,
      });

      expect(httpPut).toHaveBeenCalledWith(
        mockSession,
        'orgpreferences/enable-discord-notifications',
        {
          enable_discord_notifications: true,
          discord_webhook: 'https://discord.com/webhook/test',
        }
      );

      expect(successToast).toHaveBeenCalledWith(
        'Preferences updated successfully.',
        [],
        expect.any(Object)
      );
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });

  test('does not submit org preferences for users without permissions', async () => {
    (httpPut as jest.Mock).mockResolvedValue({});

    render(
      <GlobalContext.Provider value={mockContextWithoutPermissions}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const saveButton = screen.getByTestId('savebutton');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(mockSession, 'userpreferences/', {
        enable_email_notifications: true,
      });

      // Ensure org preferences API call is not made
      expect(httpPut).not.toHaveBeenCalledWith(
        mockSession,
        'orgpreferences/enable-discord-notifications',
        expect.any(Object)
      );

      expect(successToast).toHaveBeenCalledWith(
        'Preferences updated successfully.',
        [],
        expect.any(Object)
      );
    });
  });

  test('shows error toast when form submission fails', async () => {
    (httpPut as jest.Mock).mockRejectedValue(new Error('Update failed'));

    render(
      <GlobalContext.Provider value={mockContextWithPermissions}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const saveButton = screen.getByTestId('savebutton');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Update failed', [], expect.any(Object));
    });
  });

  test('closes the form when the cancel button is clicked', () => {
    render(
      <GlobalContext.Provider value={mockContextWithPermissions}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const cancelButton = screen.getByTestId('cancelbutton');
    fireEvent.click(cancelButton);

    expect(setShowForm).toHaveBeenCalledWith(false);
  });
});
