import { render, screen, waitFor, within } from '@testing-library/react';
import { AIEnablePanel } from '../AiEnablePanel';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPut } from '@/helpers/http';
import { errorToast } from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');
jest.mock('@/components/DataAnalysis/Disclaimer', () => ({
  Disclaimer: ({ open }: { open: boolean }) => (open ? <div>Disclaimer</div> : null),
}));

describe('AIEnablePanel Component', () => {
  const mockUseSession = useSession as jest.Mock;
  const mockHttpGet = httpGet as jest.Mock;
  const mockHttpPut = httpPut as jest.Mock;
  const mockErrorToast = errorToast as jest.Mock;

  const mockGlobalContext = {
    Permissions: {
      state: ['can_edit_llm_settings'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com', expires: 'false' } },
      status: 'authenticated',
    });
  });

  const renderComponent = (permissions = []) => {
    const contextValue = {
      ...mockGlobalContext,
      Permissions: { state: permissions },
    };

    return render(
      <GlobalContext.Provider value={contextValue}>
        <AIEnablePanel />
      </GlobalContext.Provider>
    );
  };

  test('renders details and switch for LLM function', async () => {
    mockHttpGet.mockResolvedValue({
      success: true,
      res: { llm_optin: true },
    });

    renderComponent(['can_edit_llm_settings']);

    await waitFor(() => {
      expect(screen.getByText('Enable LLM function for data analysis')).toBeInTheDocument();
      expect(
        screen.getByText(
          'I consent and grant permission for this information to be shared with the OpenAI platform in order to produce the necessary data'
        )
      ).toBeInTheDocument();
      const switchElement = screen.getByTestId('enable-disable-llm');
      const checkbox = within(switchElement).getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });
  });

  test('fetches and displays organization preference', async () => {
    mockHttpGet.mockResolvedValue({
      success: true,
      res: { llm_optin: false },
    });

    renderComponent(['can_edit_llm_settings']);

    await waitFor(() => {
      expect(mockHttpGet).toHaveBeenCalled();
      const switchElement = screen.getByTestId('enable-disable-llm');
      const checkbox = within(switchElement).getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });
  });

  // test('handles enabling/disabling LLM with disclaimer flow', async () => {
  //     mockHttpGet.mockResolvedValue({
  //         success: true,
  //         res: { llm_optin: false },
  //     });

  //     mockHttpPut.mockResolvedValue({
  //         success: true,
  //     });

  //     renderComponent(['can_edit_llm_settings']);

  //     // Trigger switch toggle, which sets openDisclaimer
  //     await waitFor(() => {
  //         const switchElement = screen.getByTestId('enable-disable-llm');
  //         const checkbox = within(switchElement).getByRole('checkbox');
  //         console.log(checkbox.outerHTML, "outerhtml")
  //         expect(checkbox).toBeInTheDocument();
  //         expect(checkbox).not.toBeChecked();

  //         fireEvent.change(checkbox, { target: { checked: true } });
  //     });

  //     // Ensure the disclaimer modal is displayed
  //     await waitFor(() => {
  //         expect(screen.getByText('Disclaimer')).toBeInTheDocument();
  //     });

  //     // Simulate clicking "Agree" in the disclaimer modal
  //     const agreeButton = screen.getByText('Agree');
  //     fireEvent.click(agreeButton);

  //     // Verify that the API is called after agreeing
  //     await waitFor(() => {
  //         expect(mockHttpPut).toHaveBeenCalledWith(
  //             { user: { email: 'test@example.com' } },
  //             'orgpreferences/llm_approval',
  //             { llm_optin: true }
  //         );
  //     });
  // });

  // test('does not call API if user does not agree to disclaimer', async () => {
  //     mockHttpGet.mockResolvedValue({
  //         success: true,
  //         res: { llm_optin: false },
  //     });

  //     renderComponent(['can_edit_llm_settings']);

  //     // Trigger switch toggle, which sets openDisclaimer
  //     await waitFor(() => {
  //         const switchElement = screen.getByTestId('enable-disable-llm');
  //         const checkbox = within(switchElement).getByRole('checkbox');
  //         fireEvent.change(checkbox, { target: { checked: true } });
  //     });

  //     // Ensure the disclaimer modal is displayed
  //     await waitFor(() => {
  //         expect(screen.getByText('Disclaimer')).toBeInTheDocument();
  //     });

  //     // Simulate dismissing the disclaimer without agreeing
  //     const cancelButton = screen.getByText('Cancel');
  //     fireEvent.click(cancelButton);

  //     // Verify that the API is not called
  //     await waitFor(() => {
  //         expect(mockHttpPut).not.toHaveBeenCalled();
  //     });
  // });

  test('disables switch if user does not have permissions', async () => {
    mockHttpGet.mockResolvedValue({
      success: true,
      res: { llm_optin: false },
    });

    renderComponent([]);

    await waitFor(() => {
      const switchElement = screen.getByTestId('enable-disable-llm');
      const checkbox = within(switchElement).getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  test('shows error toast if fetching organization preference fails', async () => {
    mockHttpGet.mockRejectedValue(new Error('API Error'));

    renderComponent(['can_edit_llm_settings']);

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('API Error', [], mockGlobalContext);
    });
  });
});
