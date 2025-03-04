import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DBTTransformType from '../DBTTransformType';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';

// Mock modules
jest.mock('next-auth/react');
jest.mock('@/helpers/http');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe('DBTTransformType', () => {
  const mockSession = {
    data: {
      user: { email: 'test@example.com' },
      access_token: 'mock-token',
    },
    status: 'authenticated',
  };

  const mockContext = {
    Permissions: {
      state: ['can_create_dbt_workspace', 'can_edit_dbt_workspace'],
    },
    CurrentOrg: {
      state: { wtype: 'postgres' },
    },
    Toast: {
      dispatch: jest.fn(),
    },
    OrgUsers: {
      state: [],
      dispatch: jest.fn(),
    },
    UnsavedChanges: {
      state: false,
      dispatch: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (httpGet as jest.Mock).mockReset();
    (httpPost as jest.Mock).mockReset();
  });

  it('shows snowflake not available message', () => {
    const snowflakeContext = {
      ...mockContext,
      CurrentOrg: {
        state: { wtype: 'snowflake' },
      },
    };

    render(
      <GlobalContext.Provider value={snowflakeContext}>
        <DBTTransformType transformType="github" />
      </GlobalContext.Provider>
    );

    expect(screen.getByText(/dbt not available for snowflake warehouses/i)).toBeInTheDocument();
  });

  it('renders github transform type with no workspace configured', async () => {
    (httpGet as jest.Mock).mockResolvedValueOnce({
      error: 'no dbt workspace has been configured',
    });

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTransformType transformType="github" />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Connect & Setup Repo')).toBeInTheDocument();
    });
  });

  it('renders github transform type with existing workspace', async () => {
    const mockWorkspace = {
      status: 'fetched',
      gitrepo_url: 'https://github.com/test/repo',
      gitrepo_access_token: 'token123',
      default_schema: 'public',
    };

    // Mock both required API calls
    (httpGet as jest.Mock).mockImplementation((session, endpoint) => {
      if (endpoint === 'dbt/dbt_workspace') {
        return Promise.resolve(mockWorkspace);
      }
      if (endpoint === 'prefect/tasks/transform/') {
        return Promise.resolve([{ id: 1 }]); // Return a non-empty array to indicate tasks exist
      }
      return Promise.reject(new Error('Unexpected endpoint'));
    });

    const { container } = render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTransformType transformType="github" />
      </GlobalContext.Provider>
    );

    // Wait for all elements to be rendered
    await waitFor(() => {
      // Check for DBT REPOSITORY text
      expect(screen.getByText('DBT REPOSITORY')).toBeInTheDocument();

      // Check for the repo URL using a more flexible matcher
      const repoLink = screen.getByRole('link', { name: /github\.com\/test\/repo/i });
      expect(repoLink).toBeInTheDocument();
      expect(repoLink).toHaveAttribute('href', 'https://github.com/test/repo');

      // Check for schema
      expect(screen.getByText('public')).toBeInTheDocument();
    });
  });

  it('handles fetch workspace error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (httpGet as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTransformType transformType="github" />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(mockContext.Toast.dispatch).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles tab changes', async () => {
    (httpGet as jest.Mock).mockResolvedValueOnce({ status: 'complete' }).mockResolvedValueOnce([]); // tasks fetch

    render(
      <GlobalContext.Provider value={mockContext}>
        <DBTTransformType transformType="github" />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /setup/i })).toBeInTheDocument();
    });

    const setupTab = screen.getByRole('tab', { name: /setup/i });
    fireEvent.click(setupTab);
    expect(setupTab).toHaveAttribute('aria-selected', 'true');
  });
});
