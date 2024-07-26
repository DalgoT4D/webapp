import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Elementary } from '../Elementary';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  successToast,
  errorToast,
} from '@/components/ToastMessage/ToastHelper';
import { Session } from 'next-auth';


// Mock the dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('../../ToastMessage/ToastHelper', () => ({
  errorToast: jest.fn(),
  successToast: jest.fn(),
}));

describe('Elementary', () => {
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

  it('fetches and displays elementary token', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
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

    expect(screen.getByTestId('outerbox')).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Regenerate report/ })
      ).toBeInTheDocument();
    });
  });

  //second test
  it('handles report refresh and its generating ', async () => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          created_on_utc: new Date().toISOString(),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: '123', ttl: 10 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          progress: [{ status: 'completed' }],
        }),
      });

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Regenerate report/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(successToast).toHaveBeenCalledWith(
        'Your latest report is being generated. This may take a few minutes. Thank you for your patience',
        [],
        expect.any(Object)
      );
      expect(
        screen.getByRole('button', { name: /Regenerate report \(10s\)/ })
      ).toBeDisabled();
    });

    //poll
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(successToast).toHaveBeenCalledWith(
        'Report generated successfully',
        [],
        expect.any(Object)
      );
    });

    //case for polling

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        progress: [{ status: 'running' }],
      }),
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  it('displays error message on report refresh failure', async () => {
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          created_on_utc: new Date().toISOString(),
        }),
      })
      .mockRejectedValueOnce(new Error('Failed to refresh report'));

    render(
      <GlobalContext.Provider value={{}}>
        <Elementary />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Last generated:/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Regenerate report/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(errorToast).toHaveBeenCalledWith(
        'Failed to refresh report',
        [],
        expect.any(Object)
      );
    });
  });
});
