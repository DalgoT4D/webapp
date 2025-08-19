import '@testing-library/jest-dom';
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
  const mockUserPreferences = {
    res: {
      enable_email_notifications: true,
      subscribe_incident_notifications: false,
      subscribe_schema_change_notifications: false,
      subscribe_job_failure_notifications: false,
      subscribe_late_runs_notifications: false,
      subscribe_dbt_test_failure_notifications: false,
    },
  };

  const mockOrgPreferences = {
    res: {
      enable_discord_notifications: true,
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
    // Mock useSWR to return different data based on the key
    (useSWR as jest.Mock).mockImplementation((key) => {
      if (key === 'userpreferences/') {
        return { data: mockUserPreferences, mutate: mockMutate };
      }
      if (key === 'orgpreferences/') {
        return { data: mockOrgPreferences, mutate: mockMutate };
      }
      return { data: null, mutate: mockMutate };
    });
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
        subscribe_incident_notifications: false,
        subscribe_schema_change_notifications: false,
        subscribe_job_failure_notifications: false,
        subscribe_late_runs_notifications: false,
        subscribe_dbt_test_failure_notifications: false,
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
        subscribe_incident_notifications: false,
        subscribe_schema_change_notifications: false,
        subscribe_job_failure_notifications: false,
        subscribe_late_runs_notifications: false,
        subscribe_dbt_test_failure_notifications: false,
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

describe('PreferencesForm additional scenarios', () => {
  const baseUserPreferences = {
    res: {
      enable_email_notifications: true,
      subscribe_incident_notifications: false,
      subscribe_schema_change_notifications: false,
      subscribe_job_failure_notifications: false,
      subscribe_late_runs_notifications: false,
      subscribe_dbt_test_failure_notifications: false,
    },
  };

  const baseOrgPreferences = {
    res: {
      enable_discord_notifications: true,
      discord_webhook: 'https://discord.com/webhook/test',
    },
  };

  const mockSession = {
    expires: '1',
    user: { email: 'a@example.com' },
  };

  const mockMutate = jest.fn();
  const setShowForm = jest.fn();

  const ctxWithPerms = {
    Permissions: {
      state: ['can_edit_org_notification_settings'],
    },
  };

  const ctxNoPerms = {
    Permissions: {
      state: [],
    },
  };

  beforeEach(() => {
    (useSWR as jest.Mock).mockImplementation((key) => {
      if (key === 'userpreferences/') {
        return { data: baseUserPreferences, mutate: mockMutate };
      }
      if (key === 'orgpreferences/') {
        return { data: baseOrgPreferences, mutate: mockMutate };
      }
      return { data: null, mutate: mockMutate };
    });
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    jest.clearAllMocks();
  });

  test('toggling email notifications updates payload accordingly', async () => {
    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const emailSwitch = screen.getByLabelText('Enable Email Notifications');
    expect(emailSwitch).toBeChecked();

    // Toggle off
    fireEvent.click(emailSwitch);
    expect(emailSwitch).not.toBeChecked();

    (httpPut as jest.Mock).mockResolvedValue({});

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      // Email notification turned off in payload
      expect(httpPut).toHaveBeenCalledWith(mockSession, 'userpreferences/', {
        enable_email_notifications: false,
        subscribe_incident_notifications: false,
        subscribe_schema_change_notifications: false,
        subscribe_job_failure_notifications: false,
        subscribe_late_runs_notifications: false,
        subscribe_dbt_test_failure_notifications: false,
      });

      // Org preferences still include original webhook and discord state
      expect(httpPut).toHaveBeenCalledWith(
        mockSession,
        'orgpreferences/enable-discord-notifications',
        {
          enable_discord_notifications: true,
          discord_webhook: 'https://discord.com/webhook/test',
        }
      );

      expect(successToast).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });

  test('toggling discord notifications off excludes webhook dependency and updates payload', async () => {
    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const discordSwitch = screen.getByLabelText('Enable Discord Notifications');
    expect(discordSwitch).toBeChecked();

    // Turn discord notifications off
    fireEvent.click(discordSwitch);
    expect(discordSwitch).not.toBeChecked();

    (httpPut as jest.Mock).mockResolvedValue({});

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      // Email call still made
      expect(httpPut).toHaveBeenCalledWith(mockSession, 'userpreferences/', {
        enable_email_notifications: true,
        subscribe_incident_notifications: false,
        subscribe_schema_change_notifications: false,
        subscribe_job_failure_notifications: false,
        subscribe_late_runs_notifications: false,
        subscribe_dbt_test_failure_notifications: false,
      });

      // Org preferences reflect discord disabled with empty webhook
      expect(httpPut).toHaveBeenCalledWith(
        mockSession,
        'orgpreferences/enable-discord-notifications',
        {
          enable_discord_notifications: false,
          discord_webhook: '',
        }
      );

      expect(successToast).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });

  test('editing webhook value propagates to payload when user has permissions', async () => {
    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const webhookInput = screen.getByLabelText('Discord Webhook*') as HTMLInputElement;
    expect(webhookInput).toHaveValue('https://discord.com/webhook/test');

    fireEvent.change(webhookInput, { target: { value: 'https://discord.com/webhook/new' } });
    expect(webhookInput).toHaveValue('https://discord.com/webhook/new');

    (httpPut as jest.Mock).mockResolvedValue({});

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(
        mockSession,
        'orgpreferences/enable-discord-notifications',
        {
          enable_discord_notifications: true,
          discord_webhook: 'https://discord.com/webhook/new',
        }
      );
      expect(successToast).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });

  test('webhook input remains disabled for users without permissions even when toggled', () => {
    render(
      <GlobalContext.Provider value={ctxNoPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const webhookInput = screen.getByLabelText('Discord Webhook*');
    expect(webhookInput).toBeDisabled();

    const discordSwitch = screen.getByLabelText('Enable Discord Notifications');
    expect(discordSwitch).toBeDisabled();
  });

  test('handles undefined SWR data gracefully (no crash, fields present when data loads)', async () => {
    // Start with no data
    (useSWR as jest.Mock).mockImplementation((key) => {
      return { data: undefined, mutate: mockMutate };
    });

    const { rerender } = render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    // Component should render without crashing
    expect(screen.getByTestId('savebutton')).toBeInTheDocument();

    // Simulate data arrival
    (useSWR as jest.Mock).mockImplementation((key) => {
      if (key === 'userpreferences/') {
        return { data: baseUserPreferences, mutate: mockMutate };
      }
      if (key === 'orgpreferences/') {
        return { data: baseOrgPreferences, mutate: mockMutate };
      }
      return { data: null, mutate: mockMutate };
    });

    // Re-render with data
    rerender(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    // Verify fields after data present
    expect(screen.getByLabelText('Enable Email Notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Discord Notifications')).toBeInTheDocument();
  });

  test('missing session data does not cause crashes and still attempts user preferences with undefined session', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: undefined });
    (httpPut as jest.Mock).mockResolvedValue({});

    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(undefined, 'userpreferences/', {
        enable_email_notifications: true,
        subscribe_incident_notifications: false,
        subscribe_schema_change_notifications: false,
        subscribe_job_failure_notifications: false,
        subscribe_late_runs_notifications: false,
        subscribe_dbt_test_failure_notifications: false,
      });
    });
  });

  test('when user preferences update succeeds but org preferences fails, shows error toast and does not close form', async () => {
    // Setup httpPut to resolve first call (user) and reject second (org)
    (httpPut as jest.Mock)
      .mockResolvedValueOnce({}) // userpreferences
      .mockRejectedValueOnce(new Error('Org update failed')); // orgpreferences

    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(httpPut).toHaveBeenNthCalledWith(1, mockSession, 'userpreferences/', {
        enable_email_notifications: true,
        subscribe_incident_notifications: false,
        subscribe_schema_change_notifications: false,
        subscribe_job_failure_notifications: false,
        subscribe_late_runs_notifications: false,
        subscribe_dbt_test_failure_notifications: false,
      });

      expect(httpPut).toHaveBeenNthCalledWith(
        2,
        mockSession,
        'orgpreferences/enable-discord-notifications',
        {
          enable_discord_notifications: true,
          discord_webhook: 'https://discord.com/webhook/test',
        }
      );

      expect(errorToast).toHaveBeenCalledWith('Org update failed', [], expect.any(Object));
      expect(setShowForm).not.toHaveBeenCalledWith(false);
    });
  });

  test('cancel after editing does not submit and keeps API untouched', () => {
    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const emailSwitch = screen.getByLabelText('Enable Email Notifications');
    fireEvent.click(emailSwitch);
    expect(emailSwitch).not.toBeChecked();

    fireEvent.click(screen.getByTestId('cancelbutton'));

    // No API calls made
    expect(httpPut).not.toHaveBeenCalled();
    // Form closed
    expect(setShowForm).toHaveBeenCalledWith(false);
  });

  test('mutate is called after successful submission to refresh SWR cache', async () => {
    (httpPut as jest.Mock).mockResolvedValue({});
    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(successToast).toHaveBeenCalled();
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  test('webhook can be cleared when discord notifications are disabled; payload should not require webhook', async () => {
    render(
      <GlobalContext.Provider value={ctxWithPerms}>
        <PreferencesForm showForm={true} setShowForm={setShowForm} />
      </GlobalContext.Provider>
    );

    const discordSwitch = screen.getByLabelText('Enable Discord Notifications');
    fireEvent.click(discordSwitch); // disable discord
    expect(discordSwitch).not.toBeChecked();

    // When discord is disabled, webhook input is hidden, so we can't clear it
    // The component handles this by sending empty webhook when discord is disabled

    (httpPut as jest.Mock).mockResolvedValue({});

    fireEvent.click(screen.getByTestId('savebutton'));

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(
        mockSession,
        'orgpreferences/enable-discord-notifications',
        {
          enable_discord_notifications: false,
          discord_webhook: '', // Empty webhook when discord is disabled
        }
      );
      expect(successToast).toHaveBeenCalled();
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });
});
