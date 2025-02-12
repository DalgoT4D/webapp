import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Elementary } from '../Elementary';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { successToast, errorToast } from '@/components/ToastMessage/ToastHelper';
import { Session } from 'next-auth';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock Toast Helpers
jest.mock('../../ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
  successToast: jest.fn(),
}));

describe('Elementary Component', () => {
  const mockSession: Session = {
    expires: 'false',
    user: { email: 'a' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays "dbt is not configured" message when applicable', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('dbt is not configured for this client'));

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('dbt is not configured for this client')).toBeInTheDocument();
    });
  });

  it('shows setup button when elementary is not set up', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'not-set-up' }),
    });

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/You currently dont have elementary setup/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Setup Elementary/ })).toBeInTheDocument();
    });
  });

  it('fetches elementary token when elementary is set up', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      // First API call: Mock `dbt/elementary-setup-status` with "set-up"
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'set-up' }),
      })
      // Second API call: Mock `dbt/fetch-elementary-report/` to return a token
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          created_on_utc: new Date().toISOString(),
        }),
      });

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('dbt/elementary-setup-status'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('dbt/fetch-elementary-report'),
        expect.any(Object)
      );
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
    });
  });

  it('handles report refresh correctly and shows generating state', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    const mockFetch = jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().includes('dbt/elementary-setup-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'set-up' }),
        });
      }
      if (url.toString().includes('dbt/fetch-elementary-report')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            token: 'test-token',
            created_on_utc: new Date().toISOString(),
          }),
        });
      }
      if (url.toString().includes('dbt/v1/refresh-elementary-report/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ flow_run_id: '123' }),
        });
      }
      return Promise.reject(new Error('Unknown API call'));
    });

    // jest.useFakeTimers();

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    // Ensure initial state loads properly
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
    });

    // Wait until the button is enabled
    const regenerateButton = await screen.findByRole('button', { name: /Regenerate report/ });
    expect(regenerateButton).toBeEnabled();

    // Click the button
    fireEvent.click(regenerateButton);

    // Wait until the button is disabled
    await waitFor(() => expect(regenerateButton).toBeDisabled());

    // Wait until the button is enabled again
    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('dbt/v1/refresh-elementary-report/'),
      expect.any(Object)
    );

    expect(successToast).toHaveBeenCalledWith(
      'Your latest report is being generated. This may take a few minutes. Thank you for your patience',
      [],
      expect.any(Object)
    );

    // jest.runAllTimers();
  });

  it('displays error message on report refresh failure', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      // Mock dbt/elementary-setup-status to return "set-up"
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'set-up' }),
      })
      // Mock fetching elementary token
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          created_on_utc: new Date().toISOString(),
        }),
      })
      // Mock report refresh API but reject it to simulate failure
      .mockRejectedValueOnce(new Error('Failed to refresh report'));

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Regenerate report/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(errorToast).toHaveBeenCalledWith('Failed to refresh report', [], expect.any(Object));
    });
  });

  it('renders MappingComponent with existing and missing items', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    const mockElementaryStatus = {
      exists: {
        elementary_package: '1.0.0',
        elementary_target_schema: 'test_schema',
      },
      missing: {
        elementary_package: 'package_config',
        elementary_target_schema: 'schema_config',
      },
    };

    // Mock all required API calls in sequence
    global.fetch = jest
      .fn()
      // First call: elementary-setup-status
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'not-set-up' }),
      })
      // Second call: git_pull
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      // Third call: check-dbt-files
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockElementaryStatus,
      });

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    // Wait for the setup button to appear
    const setupButton = await screen.findByRole('button', { name: /Setup Elementary/ });

    // Click the button
    await act(async () => {
      fireEvent.click(setupButton);
    });

    // Verify the mapping component renders correctly
    await waitFor(() => {
      // Check "Existing" section
      expect(screen.getByText('Existing')).toBeInTheDocument();
      expect(screen.getAllByText('packages.yml')[0]).toBeInTheDocument();
      expect(screen.getAllByText('dbt_project.yml')[0]).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('test_schema')).toBeInTheDocument();

      // Check "Missing" section
      expect(screen.getByText(/Missing : Please add these missing lines/)).toBeInTheDocument();
      expect(screen.getByText('package_config')).toBeInTheDocument();
      expect(screen.getByText('schema_config')).toBeInTheDocument();
    });

    // Verify API calls
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('dbt/git_pull/'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('dbt/check-dbt-files'),
      expect.any(Object)
    );
  });

  it('renders MappingComponent with only existing items', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    const mockElementaryStatus = {
      exists: {
        elementary_package: '1.0.0',
      },
      missing: {},
    };

    // Mock all required API calls in sequence
    global.fetch = jest
      .fn()
      // First call: elementary-setup-status
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'not-set-up' }),
      })
      // Second call: git_pull
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      // Third call: check-dbt-files
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockElementaryStatus,
      });

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    // Wait for the setup button to appear
    const setupButton = await screen.findByRole('button', { name: /Setup Elementary/ });

    // Click the button
    await act(async () => {
      fireEvent.click(setupButton);
    });

    // Verify the mapping component renders correctly
    await waitFor(() => {
      expect(screen.getByText('Existing')).toBeInTheDocument();
      expect(screen.getByText('packages.yml')).toBeInTheDocument();
      expect(screen.queryByText(/Missing/)).not.toBeInTheDocument();
    });

    // Verify API calls
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('dbt/git_pull/'),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('dbt/check-dbt-files'),
      expect.any(Object)
    );
  });

  it('handles the complete setup process successfully', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    const mockFetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ status: 'not-set-up' }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            exists: {},
            missing: {},
          }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success' }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ task_id: 'test-id', hashkey: 'test-hash' }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            progress: [{ status: 'completed', message: 'Success' }],
          }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success' }),
        })
      );

    global.fetch = mockFetch;

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    const setupButton = await screen.findByRole('button', { name: /Setup Elementary/ });
    fireEvent.click(setupButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(5);
      expect(successToast).toHaveBeenCalledWith(
        'Elementary profile created successfully',
        [],
        expect.any(Object)
      );
    });
  });

  it('handles setup process failure', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'not-set-up' }),
      })
      .mockRejectedValueOnce(new Error('Setup failed'));

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    const setupButton = await screen.findByRole('button', { name: /Setup Elementary/ });
    fireEvent.click(setupButton);

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Setup failed', [], expect.any(Object));
    });
  });

  it('handles lock check errors correctly', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'set-up' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          created_on_utc: new Date().toISOString(),
        }),
      })
      .mockRejectedValueOnce(new Error('Lock check failed'));

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(errorToast).toHaveBeenCalledWith('Lock check failed', [], expect.any(Object));
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
    });
  });
});
