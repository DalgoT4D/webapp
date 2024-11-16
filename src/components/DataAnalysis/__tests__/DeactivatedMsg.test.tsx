import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeactivatedMsg } from '../DeactivatedMsg';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpPost } from '@/helpers/http';

import { useTracking } from '@/contexts/TrackingContext';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react');
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');
jest.mock('@/contexts/TrackingContext');

describe('DeactivatedMsg Component', () => {
  const mockUseSession = useSession as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;
  const mockHttpPost = httpPost as jest.Mock;
  const mockErrorToast = errorToast as jest.Mock;
  const mockSuccessToast = successToast as jest.Mock;
  const mockUseTracking = useTracking as jest.Mock;

  const mockRouterPush = jest.fn();
  const trackAmplitudeEvent = jest.fn();

  const mockGlobalContext = {
    Permissions: {
      state: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });
    mockUseRouter.mockReturnValue({ push: mockRouterPush });
    mockUseTracking.mockReturnValue(trackAmplitudeEvent);
  });

  const renderComponent = (permissions = []) => {
    const contextValue = {
      ...mockGlobalContext,
      Permissions: {
        state: permissions,
      },
    };

    return render(
      <GlobalContext.Provider value={contextValue}>
        <DeactivatedMsg open={true} setIsOpen={jest.fn()} />
      </GlobalContext.Provider>
    );
  };

  test('renders dialog title and content for account manager', () => {
    renderComponent(['can_edit_llm_settings']);

    expect(screen.getByText('AI Data Analysis Deactivated')).toBeInTheDocument();
    expect(screen.getByText(/As the account manager, you can enable AI/)).toBeInTheDocument();
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  test('renders dialog title and content for non-account manager', () => {
    renderComponent([]);

    expect(screen.getByText('AI Data Analysis Deactivated')).toBeInTheDocument();
    expect(
      screen.getByText(/Your account manager has disabled this feature. To use AI /)
    ).toBeInTheDocument();
    expect(screen.getByText('Enable')).toBeInTheDocument();
  });

  test('navigates to settings page for account manager on "Enable" button click', async () => {
    renderComponent(['can_edit_llm_settings']);

    const enableButton = screen.getByText('Enable');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/settings/ai-settings');
    });
  });

  test('makes API call and shows success toast for non-account manager on "Enable" button click', async () => {
    mockHttpPost.mockResolvedValue({
      success: true,
      res: 'Your request to enable AI Data Analysis has been sent.',
    });

    renderComponent([]);

    const enableButton = screen.getByText('Enable');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        { user: { email: 'test@example.com' } },
        'userpreferences/llm_analysis/request',
        {}
      );
      expect(mockSuccessToast).toHaveBeenCalledWith(
        'Your request to enable AI Data Analysis has been sent.',
        [],
        mockGlobalContext
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/pipeline');
    });
  });

  test('handles API failure and shows error toast for non-account manager', async () => {
    mockHttpPost.mockRejectedValue(new Error('API Error'));

    renderComponent([]);

    const enableButton = screen.getByText('Enable');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalled();
      expect(mockErrorToast).toHaveBeenCalledWith('API Error', [], mockGlobalContext);
    });
  });

  test('tracks event when "Enable" button is clicked', async () => {
    renderComponent([]);

    const enableButton = screen.getByText('Enable');
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(trackAmplitudeEvent).toHaveBeenCalledWith(`[Enable-LLMAnalysis] Button Clicked`);
    });
  });
});
