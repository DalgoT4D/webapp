import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { DBTDocs } from '../DBTDocs';
import { backendUrl } from '@/config/constant';

// Mock the useSession hook
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockSession = {
  expires: '1',
  user: { email: 'a', name: 'Delta', image: 'c', token: 'test-token' },
};

describe('DBTDocs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display the loading message when there is no token', () => {
    (useSession as jest.Mock).mockReturnValueOnce({ data: null, status: 'loading' });

    render(<DBTDocs />);

    expect(screen.getByText(/Please go to the setup tab and select the function DBT docs-generate/i)).toBeInTheDocument();
  });

  it('should fetch and display the token when session is available', async () => {
    (useSession as jest.Mock).mockReturnValueOnce({
      data: mockSession,
      status: 'authenticated',
    });
  
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ token: 'dbt-docs-token' }),
      })
    ) as jest.Mock;
  
    render(<DBTDocs />);
  
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
    });
});

  it('should display error message if fetching token fails', async () => {
    (useSession as jest.Mock).mockReturnValueOnce({
      data: mockSession,
      status: 'authenticated',
    });

    global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch token'))) as jest.Mock;

    render(<DBTDocs />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Please go to the setup tab and select the function DBT docs-generate/i)).toBeInTheDocument();
    });
  });
});
