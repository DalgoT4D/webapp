import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Explore } from '../Explore';
import '@testing-library/jest-dom';

const pushMock = jest.fn();
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: pushMock,
    };
  },
}));

// Mock the useParentCommunication hook
jest.mock('../../../contexts/ParentCommunicationProvider', () => ({
  useParentCommunication: () => ({
    isEmbedded: false,
    parentToken: null,
    parentOrgSlug: null,
    hideHeader: false,
    isReady: false,
    isEmbeddingBlocked: false,
  }),
  ParentCommunicationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useFeatureFlags hook to enable DATA_STATISTICS flag
jest.mock('@/customHooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isFeatureFlagEnabled: (flag: string) => {
      // Enable DATA_STATISTICS flag for tests
      if (flag === 'DATA_STATISTICS') return true;
      return false;
    },
    flags: { DATA_STATISTICS: true },
    isLoading: false,
    error: null,
  }),
  FeatureFlagKeys: {
    LOG_SUMMARIZATION: 'LOG_SUMMARIZATION',
    EMBED_SUPERSET: 'EMBED_SUPERSET',
    USAGE_DASHBOARD: 'USAGE_DASHBOARD',
    DATA_QUALITY: 'DATA_QUALITY',
    AI_DATA_ANALYSIS: 'AI_DATA_ANALYSIS',
    DATA_STATISTICS: 'DATA_STATISTICS',
  },
}));

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const mockSession: Session = {
  expires: 'false',
  user: { email: 'a' },
};

const mockedFetch = jest.fn().mockResolvedValueOnce({
  ok: true,
  json: jest.fn().mockResolvedValueOnce([]),
});
(global as any).fetch = mockedFetch;

it('renders the explore page with preview and data statistics tab', async () => {
  render(
    <SessionProvider session={mockSession}>
      <Explore />
    </SessionProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Data statistics')).toBeInTheDocument();
  });
});

it('calls router.push when TopNavBar close button is clicked', async () => {
  render(
    <SessionProvider session={mockSession}>
      <Explore />
    </SessionProvider>
  );

  const closeButton = await screen.findByRole('button', { name: /close/i });

  fireEvent.click(closeButton);

  expect(pushMock).toHaveBeenCalledWith('/pipeline/ingest');
});

it('handles fetch error and logs to console', async () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  mockedFetch.mockRejectedValueOnce(new Error('Network error'));

  render(
    <SessionProvider session={mockSession}>
      <Explore />
    </SessionProvider>
  );

  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  });

  consoleSpy.mockRestore();
});

it('should switch between Preview and Data Statistics tabs', async () => {
  render(
    <SessionProvider session={mockSession}>
      <Explore />
    </SessionProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Data statistics')).toBeInTheDocument();
  });

  expect(screen.getByText('Preview')).toBeInTheDocument();

  const statisticsTab = screen.getByText('Data statistics');
  fireEvent.click(statisticsTab);

  await waitFor(() => {
    expect(screen.getByText('Data statistics')).toBeInTheDocument();
  });

  expect(screen.getByText('Data statistics')).toBeVisible();
});
