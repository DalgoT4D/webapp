import { render, screen, waitFor } from '@testing-library/react';
import { ServicesInfo } from '../ServicesInfo';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet } from '@/helpers/http';
import { errorToast } from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
}));

describe('ServicesInfo Component', () => {
  const mockUseSession = useSession as jest.Mock;
  const mockHttpGet = httpGet as jest.Mock;
  const mockErrorToast = errorToast as jest.Mock;

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
  });

  const renderComponent = () =>
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <ServicesInfo />
      </GlobalContext.Provider>
    );

  test('renders loader when fetching data', async () => {
    mockHttpGet.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, res: [] }), 500);
        })
    );

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
  });

  test('renders tool information correctly', async () => {
    mockHttpGet.mockResolvedValue({
      success: true,
      res: [{ Airbyte: { version: '0.1.0' } }, { Superset: { version: '2.0.0' } }],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Airbyte 0.1.0')).toBeInTheDocument();
      expect(screen.getByText('Superset 2.0.0')).toBeInTheDocument();
    });
  });

  test('shows error toast on API failure', async () => {
    mockHttpGet.mockRejectedValue(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith('API Error', [], mockGlobalContext);
    });
  });

  test('does not render any tools if API returns empty array', async () => {
    mockHttpGet.mockResolvedValue({ success: true, res: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/Airbyte/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Superset/)).not.toBeInTheDocument();
    });
  });
});
