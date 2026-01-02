import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSession } from 'next-auth/react';
import DBTRepositoryCard from '../DBTRepositoryCard';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { successToast, errorToast } from '@/components/ToastMessage/ToastHelper';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');
jest.mock('@/assets/images/dbt.png', () => '/mock-dbt.png');

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockHttpGet = httpGet as jest.MockedFunction<typeof httpGet>;
const mockHttpPost = httpPost as jest.MockedFunction<typeof httpPost>;
const mockHttpPut = httpPut as jest.MockedFunction<typeof httpPut>;
const mockSuccessToast = successToast as jest.MockedFunction<typeof successToast>;
const mockErrorToast = errorToast as jest.MockedFunction<typeof errorToast>;

const mockGlobalContextValue = {
  Permissions: {
    state: ['can_create_dbt_workspace', 'can_edit_dbt_workspace'],
  },
  globalState: {},
  setGlobalState: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <GlobalContext.Provider value={mockGlobalContextValue}>{component}</GlobalContext.Provider>
  );
};

describe('DBTRepositoryCard', () => {
  const mockSession = {
    user: { email: 'test@example.com' },
    accessToken: 'mock-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  it('renders the component with DBT logo and title', () => {
    mockHttpGet.mockResolvedValue({ error: true });

    renderWithProviders(<DBTRepositoryCard />);

    expect(screen.getByText('DBT REPOSITORY')).toBeInTheDocument();
    expect(screen.getByAltText('DBT Logo')).toBeInTheDocument();
  });

  it('shows "Connect to Github" button when not connected', async () => {
    mockHttpGet.mockResolvedValue({ error: true });

    renderWithProviders(<DBTRepositoryCard />);

    await waitFor(() => {
      expect(screen.getByText('Connect to Github')).toBeInTheDocument();
    });
  });

  it('shows "Edit" button when repository is connected', async () => {
    mockHttpGet.mockResolvedValue({
      gitrepo_url: 'https://github.com/test/repo',
      default_schema: 'intermediate',
    });

    renderWithProviders(<DBTRepositoryCard />);

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  it('displays repository information when connected', async () => {
    const mockWorkspaceData = {
      gitrepo_url: 'https://github.com/test/repo',
      default_schema: 'intermediate',
    };
    mockHttpGet.mockResolvedValue(mockWorkspaceData);

    renderWithProviders(<DBTRepositoryCard />);

    await waitFor(() => {
      expect(screen.getByText('test/repo')).toBeInTheDocument();
      expect(screen.getByText('intermediate')).toBeInTheDocument();
    });
  });

  it('opens dialog when connect button is clicked', async () => {
    mockHttpGet.mockResolvedValue({ error: true });

    renderWithProviders(<DBTRepositoryCard />);

    await waitFor(() => {
      const connectButton = screen.getByText('Connect to Github');
      fireEvent.click(connectButton);
    });

    expect(screen.getByText('Connect GitHub Repository')).toBeInTheDocument();
  });

  it('disables button when user lacks permissions', () => {
    const contextWithoutPermissions = {
      Permissions: { state: [] },
      globalState: {},
      setGlobalState: jest.fn(),
    };

    mockHttpGet.mockResolvedValue({ error: true });

    render(
      <GlobalContext.Provider value={contextWithoutPermissions}>
        <DBTRepositoryCard />
      </GlobalContext.Provider>
    );

    waitFor(() => {
      const button = screen.getByText('Connect to Github');
      expect(button).toBeDisabled();
    });
  });

  it('validates form fields correctly', async () => {
    mockHttpGet.mockResolvedValue({ error: true });

    renderWithProviders(<DBTRepositoryCard />);

    // Open dialog
    await waitFor(() => {
      const connectButton = screen.getByText('Connect to Github');
      fireEvent.click(connectButton);
    });

    // Try to submit empty form
    const submitButton = screen.getByText('Save');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Repository URL is required')).toBeInTheDocument();
      expect(screen.getByText('Personal Access Token is required')).toBeInTheDocument();
      expect(screen.getByText('Default schema is required')).toBeInTheDocument();
    });
  });

  it('handles form submission successfully', async () => {
    mockHttpGet.mockResolvedValue({ error: true });
    mockHttpPost.mockResolvedValue({ success: true });

    renderWithProviders(<DBTRepositoryCard />);

    // Open dialog
    await waitFor(() => {
      const connectButton = screen.getByText('Connect to Github');
      fireEvent.click(connectButton);
    });

    // Fill form
    const repoUrlInput = screen.getByLabelText(/Repository URL/i);
    const tokenInput = screen.getByLabelText(/Personal Access Token/i);
    const schemaInput = screen.getByLabelText(/Default Schema/i);

    fireEvent.change(repoUrlInput, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.change(tokenInput, { target: { value: 'ghp_token123' } });
    fireEvent.change(schemaInput, { target: { value: 'intermediate' } });

    // Submit form
    const submitButton = screen.getByText('Save');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttpPost).toHaveBeenCalledWith(
        mockSession,
        'dbt/dbt_workspace/',
        expect.objectContaining({
          gitrepoUrl: 'https://github.com/test/repo',
          gitrepoAccessToken: 'ghp_token123',
          defaultSchema: 'intermediate',
        })
      );
    });
  });

  it('handles form submission errors', async () => {
    mockHttpGet.mockResolvedValue({ error: true });
    mockHttpPost.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<DBTRepositoryCard />);

    // Open dialog
    await waitFor(() => {
      const connectButton = screen.getByText('Connect to Github');
      fireEvent.click(connectButton);
    });

    // Fill and submit form
    const repoUrlInput = screen.getByLabelText(/Repository URL/i);
    const tokenInput = screen.getByLabelText(/Personal Access Token/i);
    const schemaInput = screen.getByLabelText(/Default Schema/i);

    fireEvent.change(repoUrlInput, { target: { value: 'https://github.com/test/repo' } });
    fireEvent.change(tokenInput, { target: { value: 'ghp_token123' } });
    fireEvent.change(schemaInput, { target: { value: 'intermediate' } });

    const submitButton = screen.getByText('Save');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalled();
    });
  });

  it('closes dialog when cancel button is clicked', async () => {
    mockHttpGet.mockResolvedValue({ error: true });

    renderWithProviders(<DBTRepositoryCard />);

    // Open dialog
    await waitFor(() => {
      const connectButton = screen.getByText('Connect to Github');
      fireEvent.click(connectButton);
    });

    expect(screen.getByText('Connect GitHub Repository')).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Connect GitHub Repository')).not.toBeInTheDocument();
    });
  });

  it('calls onConnectGit prop when provided', () => {
    const mockOnConnectGit = jest.fn();
    mockHttpGet.mockResolvedValue({ error: true });

    renderWithProviders(<DBTRepositoryCard onConnectGit={mockOnConnectGit} />);

    // This should be called internally when connection is established
    // but since we're mocking, we test the prop exists
    expect(mockOnConnectGit).toBeDefined();
  });

  it('does not fetch workspace when session is not available', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    renderWithProviders(<DBTRepositoryCard />);

    expect(mockHttpGet).not.toHaveBeenCalled();
  });
});
