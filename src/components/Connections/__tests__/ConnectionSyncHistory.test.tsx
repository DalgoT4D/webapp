import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionSyncHistory } from '../ConnectionSyncHistory';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import useSWR from 'swr';
// Mock useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('swr');

// Mock useFeatureFlags hook to enable LOG_SUMMARIZATION flag
jest.mock('@/customHooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isFeatureFlagEnabled: (flag: string) => {
      // Enable LOG_SUMMARIZATION flag for tests
      if (flag === 'LOG_SUMMARIZATION') return true;
      return false;
    },
    flags: { LOG_SUMMARIZATION: true },
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

// Mock GlobalContext
const mockGlobalContext = {
  state: {},
  dispatch: jest.fn(),
};

// Mock httpGet
jest.mock('../../../helpers/http', () => ({
  httpGet: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockedHttpGet = require('../../../helpers/http').httpGet;

// Sample connection data
const sampleConnection = {
  connectionId: '123',
  name: 'Test Connection',
  source: { sourceName: 'Source A' },
  destination: { destinationName: 'Destination B' },
};

// Sample log data
const sampleLogs = [
  {
    last_attempt_no: 1,
    bytes_committed: '100MB',
    created_at: moment().subtract(1, 'days').toISOString(),
    job_id: 1,
    logs: ['Log 1', 'Log 2'],
    records_committed: 1000,
    records_emitted: 1000,
    status: 'completed',
    duration_seconds: 60,
  },
  {
    last_attempt_no: 2,
    bytes_committed: '200MB',
    created_at: moment().subtract(1, 'days').toISOString(),
    job_id: 1,
    logs: ['Log 3', 'Log 4'],
    records_committed: 1000,
    status: 'completed',
    duration_seconds: 60,
  },
  {
    last_attempt_no: 3,
    bytes_committed: '300MB',
    created_at: moment().subtract(1, 'days').toISOString(),
    job_id: 1,
    logs: ['Log 5', 'Log 6'],
    records_committed: 1000,
    status: 'failed',
    duration_seconds: 60,
  },
  {
    last_attempt_no: 4,
    bytes_committed: '400MB',
    created_at: moment().subtract(1, 'days').toISOString(),
    job_id: 1,
    logs: ['Log 7', 'Log 8'],
    records_committed: 1000,
    status: 'completed',
    duration_seconds: 60,
  },
];

// Mock useSession data
(useSession as jest.Mock).mockReturnValue({
  data: { user: { name: 'Test User' } },
});

// Helper function to render component with context
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<GlobalContext.Provider value={mockGlobalContext}>{ui}</GlobalContext.Provider>);
};
const sampleTotalSyncs = 20;
describe('ConnectionLogs Component', () => {
  beforeEach(() => {
    mockedHttpGet.mockResolvedValue({ history: sampleLogs, totalSyncs: sampleTotalSyncs });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ConnectionLogs dialog', async () => {
    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={jest.fn()} connection={sampleConnection} />
    );

    expect(screen.getByText('Connection History')).toBeInTheDocument();
    expect(screen.getByText('Test Connection |')).toBeInTheDocument();
    expect(screen.getByText('Source A → Destination B')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('100MB')).toBeInTheDocument());
  });

  it('calls setShowLogsDialog on close button click', () => {
    const setShowLogsDialog = jest.fn();
    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={setShowLogsDialog} connection={sampleConnection} />
    );

    fireEvent.click(screen.getByLabelText('close'));
    expect(setShowLogsDialog).toHaveBeenCalledWith(false);
  });

  it('loads more logs when "load more" is clicked', async () => {
    mockedHttpGet.mockResolvedValueOnce({ history: sampleLogs, totalSyncs: sampleTotalSyncs });
    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={jest.fn()} connection={sampleConnection} />
    );

    await waitFor(() => expect(screen.getByText('load more')).toBeInTheDocument());
    fireEvent.click(screen.getByText('load more'));

    await waitFor(() => expect(mockedHttpGet).toHaveBeenCalledTimes(2));
  });

  it('displays no information message if no logs are available', async () => {
    mockedHttpGet.mockResolvedValueOnce({ history: [] });
    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={jest.fn()} connection={sampleConnection} />
    );

    await waitFor(() => expect(screen.getByText('No information available')).toBeInTheDocument());
  });

  it('renders AI summary when "AI summary" button is clicked', async () => {
    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={jest.fn()} connection={sampleConnection} />
    );

    await waitFor(() => expect(screen.getByText('100MB')).toBeInTheDocument());

    const button = screen.getAllByTestId('aisummary-123');
    if (button.length) {
      fireEvent.click(button[0]); //only failed ones.
      await waitFor(() =>
        expect(mockedHttpGet).toHaveBeenCalledWith(
          expect.anything(),
          `airbyte/v1/connections/123/logsummary?job_id=1&attempt_number=3`
        )
      );
    }
  });
  it('renders without crashing when no connection is provided', () => {
    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={jest.fn()} connection={undefined} />
    );

    expect(screen.getByText('Connection History')).toBeInTheDocument();
    expect(screen.getByText('No information available')).toBeInTheDocument();
  });
  it('fetches and displays detailed logs when "Logs" button is clicked', async () => {
    mockedHttpGet.mockResolvedValueOnce({ history: sampleLogs }); // For initial fetch
    mockedHttpGet.mockResolvedValueOnce(['Detailed Log 1', 'Detailed Log 2']); // For detailed logs

    renderWithProviders(
      <ConnectionSyncHistory setShowLogsDialog={jest.fn()} connection={sampleConnection} />
    );

    await waitFor(() => expect(screen.getByText('300MB')).toBeInTheDocument());
    const firstLabelTextButton = screen.getAllByTestId('logs');
    fireEvent.click(firstLabelTextButton[2]);

    await waitFor(() =>
      expect(mockedHttpGet).toHaveBeenCalledWith(
        expect.anything(),
        `airbyte/v1/logs?job_id=1&attempt_number=3`
      )
    );

    expect(screen.getByText('Detailed Log 1')).toBeInTheDocument();
    expect(screen.getByText('Detailed Log 2')).toBeInTheDocument();
  });
});
