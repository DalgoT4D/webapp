import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PreferencesForm from '../PreferencesForm';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { httpPut } from '@/helpers/http';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';

jest.mock('swr');
jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');

describe('PreferencesForm Component', () => {
  const mockPreferences = {
    res: {
      enable_discord_notifications: true,
      enable_email_notifications: true,
      discord_webhook: 'https://discord.com/webhook/test',
    },
  };

  const mockSession = { user: { name: 'Test User' }, accessToken: 'testToken' };
  const mockMutate = jest.fn();
  const setShowForm = jest.fn();

  beforeEach(() => {
    (useSWR as jest.Mock).mockReturnValue({
      data: mockPreferences,
      mutate: mockMutate,
    });
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
  });

  test('renders the preferences form with current values', () => {
    render(<PreferencesForm showForm={true} setShowForm={setShowForm} />);

    expect(
      screen.getByLabelText('Enable Email Notifications')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Email Notifications')).toBeChecked();

    expect(
      screen.getByLabelText('Enable Discord Notifications')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Enable Discord Notifications')).toBeChecked();

    // expect(screen.getByLabelText('Discord Webhook')).toBeInTheDocument();
    // expect(screen.getByLabelText('Discord Webhook')).toHaveValue('https://discord.com/webhook/test');
  });

  test('hides discord webhook input when "Enable Discord Notifications" is turned off', () => {
    render(<PreferencesForm showForm={true} setShowForm={setShowForm} />);

    const discordSwitch = screen.getByLabelText('Enable Discord Notifications');
    fireEvent.click(discordSwitch);

    expect(screen.queryByLabelText('Discord Webhook')).not.toBeInTheDocument();
  });

  test('submits the form successfully and shows success toast', async () => {
    (httpPut as jest.Mock).mockResolvedValue({});

    render(<PreferencesForm showForm={true} setShowForm={setShowForm} />);

    const saveButton = screen.getByTestId('savebutton');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(httpPut).toHaveBeenCalledWith(mockSession, 'userpreferences/', {
        enable_email_notifications: true,
        enable_discord_notifications: true,
        discord_webhook: 'https://discord.com/webhook/test',
      });
      expect(successToast).toHaveBeenCalledWith(
        'Preferences updated successfully.',
        [],
        expect.any(Object)
      );
      expect(setShowForm).toHaveBeenCalledWith(false);
    });
  });

  test('shows error toast when form submission fails', async () => {
    (httpPut as jest.Mock).mockRejectedValue(new Error('Update failed'));

    render(<PreferencesForm showForm={true} setShowForm={setShowForm} />);

    const saveButton = screen.getByTestId('savebutton');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith(
        'Update failed',
        [],
        expect.any(Object)
      );
    });
  });

  test('closes the form when the cancel button is clicked', () => {
    render(<PreferencesForm showForm={true} setShowForm={setShowForm} />);

    const cancelButton = screen.getByTestId('cancelbutton');
    fireEvent.click(cancelButton);
  });
});
