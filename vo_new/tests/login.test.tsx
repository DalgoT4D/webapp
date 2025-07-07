import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/login/page';
import { useAuthStore } from '../stores/authStore';
import { act } from 'react-dom/test-utils';

jest.mock('../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../lib/api', () => ({
  apiPost: jest.fn((url, data) => {
    if (url === '/api/login/' && data.username === 'testuser' && data.password === 'password') {
      return Promise.resolve({ token: 'mock-token' });
    }
    return Promise.reject(new Error('Invalid credentials'));
  }),
}));

const mockSetToken = jest.fn();
const mockInitialize = jest.fn();

// Correctly mock useAuthStore
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockSetOrgUsers = jest.fn();
const mockSetSelectedOrg = jest.fn();

mockUseAuthStore.mockReturnValue({
  isAuthenticated: false,
  token: 'mock-token',
  setToken: mockSetToken,
  initialize: mockInitialize,
  logout: jest.fn(),
  selectedOrgSlug: null,
  currentOrg: null,
  setOrgUsers: mockSetOrgUsers,
  setSelectedOrg: mockSetSelectedOrg,
});

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: [
      { org: { slug: 'org1' } },
      { org: { slug: 'org2' } },
    ],
    error: null,
  })),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
  });

  it('shows validation errors when fields are empty', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findAllByText(/is required/i)).toHaveLength(2);
  });

  it('logs in successfully with correct credentials', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/business email/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('mock-token');
    });
  });

  it('shows error message with incorrect credentials', async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/business email/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('auto-selects the first organization if none is selected', async () => {
    await act(async () => {
      render(<LoginPage />);
    });

    expect(mockSetOrgUsers).toHaveBeenCalledWith([
      { org: { slug: 'org1' } },
      { org: { slug: 'org2' } },
    ]);
    expect(mockSetSelectedOrg).toHaveBeenCalledWith('org1');
  });

  it('verifies and selects the first organization if the selected one does not exist', async () => {
    mockUseAuthStore.mockReturnValueOnce({
      ...mockUseAuthStore(),
      selectedOrgSlug: 'nonexistent-org',
    });

    await act(async () => {
      render(<LoginPage />);
    });

    expect(mockSetSelectedOrg).toHaveBeenCalledWith('org1');
  });
}); 