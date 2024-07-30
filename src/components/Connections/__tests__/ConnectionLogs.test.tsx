import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionLogs } from '../ConnectionLogs';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import useSWR from 'swr';
// Mock useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('swr');

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
const sampleLogs: any[] = [];

for (let i = 1; i <= 11; i++) {
  sampleLogs.push({
    attempt_no: i,
    bytesEmitted: `${i * 100}MB`,
    date: moment().subtract(1, 'days').toISOString(),
    job_id: 1,
    logs: [`Log ${i * 2 - 1}`, `Log ${i * 2}`],
    recordsCommitted: 1000,
    recordsEmitted: 1000,
    status: 'completed',
    totalTimeInSeconds: 60,
  });
}

// Mock useSession data
(useSession as jest.Mock).mockReturnValue({
  data: { user: { name: 'Test User' } },
});

// Helper function to render component with context
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <GlobalContext.Provider value={mockGlobalContext}>
      {ui}
    </GlobalContext.Provider>
  );
};

describe('ConnectionLogs Component', () => {
  beforeEach(() => {
    mockedHttpGet.mockResolvedValue({ history: sampleLogs });
    useSWR.mockReturnValue({
      data: { allowLogsSummary: true },
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ConnectionLogs dialog', async () => {
    renderWithProviders(
      <ConnectionLogs
        setShowLogsDialog={jest.fn()}
        connection={sampleConnection}
      />
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
      <ConnectionLogs
        setShowLogsDialog={setShowLogsDialog}
        connection={sampleConnection}
      />
    );

    fireEvent.click(screen.getByLabelText('close'));
    expect(setShowLogsDialog).toHaveBeenCalledWith(false);
  });

  it('loads more logs when "load more" is clicked', async () => {
    mockedHttpGet.mockResolvedValueOnce({ history: sampleLogs });
    renderWithProviders(
      <ConnectionLogs
        setShowLogsDialog={jest.fn()}
        connection={sampleConnection}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('load more')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('load more'));

    await waitFor(() => expect(mockedHttpGet).toHaveBeenCalledTimes(2));
  });

  it('displays no information message if no logs are available', async () => {
    mockedHttpGet.mockResolvedValueOnce({ history: [] });
    renderWithProviders(
      <ConnectionLogs
        setShowLogsDialog={jest.fn()}
        connection={sampleConnection}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('No information available')).toBeInTheDocument()
    );
  });

  it('renders AI summary when "AI summary" button is clicked', async () => {
    renderWithProviders(
      <ConnectionLogs
        setShowLogsDialog={jest.fn()}
        connection={sampleConnection}
      />
    );

    await waitFor(() => expect(screen.getByText('100MB')).toBeInTheDocument());

    const button = screen.getAllByTestId('aisummary-123');
    if (button.length) {
      fireEvent.click(button[0]);
      await waitFor(() =>
        expect(mockedHttpGet).toHaveBeenCalledWith(
          expect.anything(),
          `airbyte/v1/connections/123/logsummary?job_id=1&attempt_number=1`
        )
      );
    }
  });
  it('renders without crashing when no connection is provided', () => {
    renderWithProviders(
      <ConnectionLogs setShowLogsDialog={jest.fn()} connection={undefined} />
    );

    expect(screen.getByText('Connection History')).toBeInTheDocument();
    expect(screen.getByText('No information available')).toBeInTheDocument();
  });
  it('fetches and displays detailed logs when "Logs" button is clicked', async () => {
    mockedHttpGet.mockResolvedValueOnce({ history: sampleLogs }); // For initial fetch
    mockedHttpGet.mockResolvedValueOnce(['Detailed Log 1', 'Detailed Log 2']); // For detailed logs

    renderWithProviders(
      <ConnectionLogs
        setShowLogsDialog={jest.fn()}
        connection={sampleConnection}
      />
    );

    await waitFor(() => expect(screen.getByText('100MB')).toBeInTheDocument());
    const firstLabelTextButton = screen.getAllByTestId('logs');
    fireEvent.click(firstLabelTextButton[0]);

    await waitFor(() =>
      expect(mockedHttpGet).toHaveBeenCalledWith(
        expect.anything(),
        `airbyte/v1/logs?job_id=1&attempt_number=1`
      )
    );

    expect(screen.getByText('Detailed Log 1')).toBeInTheDocument();
    expect(screen.getByText('Detailed Log 2')).toBeInTheDocument();
  });
});
