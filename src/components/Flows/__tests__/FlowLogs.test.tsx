import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlowLogs } from '../FlowLogs'; // Adjust the import path as needed
import { useSession } from 'next-auth/react';
import { httpGet } from '@/helpers/http';
import moment from 'moment';
import { GlobalContext } from '@/contexts/ContextProvider';
import useSWR from 'swr';

// Mock necessary dependencies
jest.mock('next-auth/react');
jest.mock('../../../helpers/http');
jest.mock('swr');

const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
  accessToken: 'test-token',
};

const mockFlow = {
  deploymentId: 'deployment-123',
  name: 'Test Flow',
  status: 'Active',
};

const mockLogDetails = [
  {
    id: 'log-1',
    deployment_id: 'deployment-123',
    startTime: moment().subtract(1, 'days').toISOString(),
    runs: [
      {
        id: 'run-1',
        label: 'task 1',
        start_time: moment().subtract(1, 'hours').toISOString(),
        end_time: moment().toISOString(),
        logs: [
          {
            level: 1,
            message: 'Log message 1',
            timestamp: moment().toISOString(),
          },
        ],
      },
    ],
    status: 'COMPLETED',
  },
  {
    id: 'log-2',
    deployment_id: 'deployment-1234',
    startTime: moment().subtract(2, 'days').toISOString(),
    runs: [
      {
        id: 'run-2',
        label: 'task 2',
        start_time: moment().subtract(2, 'hours').toISOString(),
        end_time: moment().toISOString(),
        state_type: 'FAILED',
        logs: [
          {
            level: 1,
            message: 'Log message 2',
            timestamp: moment().toISOString(),
          },
        ],
      },
    ],
    status: 'FAILED',
  },
  {
    id: 'log-3',
    deployment_id: 'deployment-1235',
    startTime: moment().subtract(2, 'days').toISOString(),
    runs: [
      {
        id: 'run-3',
        label: 'task 3',
        start_time: moment().subtract(2, 'hours').toISOString(),
        end_time: moment().toISOString(),
        logs: [
          {
            level: 1,
            message: 'Log message 3',
            timestamp: moment().toISOString(),
          },
        ],
      },
    ],
    status: 'COMPLETED',
  },
  {
    id: 'log-4',
    deployment_id: 'deployment-1236',
    startTime: moment().subtract(2, 'days').toISOString(),
    runs: [
      {
        id: 'run-4',
        label: 'task 4',
        start_time: moment().subtract(2, 'hours').toISOString(),
        end_time: moment().toISOString(),
        logs: [
          {
            level: 1,
            message: 'Log message 4',
            timestamp: moment().toISOString(),
          },
        ],
      },
    ],
    status: 'COMPLETED',
  },
];
const mockSummaryResponse = {
  task_id: 'summary-task-1',
};

const mockPollResponse = {
  progress: [
    {
      status: 'completed',
      result: [{ prompt: 'summary', response: 'This is the AI summary.' }],
    },
  ],
};
describe('FlowLogs Component', () => {
  beforeEach(() => {
    useSession.mockReturnValue({ data: mockSession });
    httpGet.mockResolvedValue(mockLogDetails);
    useSWR.mockReturnValue({ data: { allowLogsSummary: true } });
    httpGet.mockImplementation((session, url) => {
      if (url.includes('logsummary')) {
        return Promise.resolve(mockSummaryResponse);
      }
      if (url.includes('tasks/stp')) {
        return Promise.resolve(mockPollResponse);
      }
      return Promise.resolve(mockLogDetails);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders FlowLogs component', async () => {
    const setShowLogsDialog = jest.fn();
    render(
      <GlobalContext.Provider value={{}}>
        <FlowLogs setShowLogsDialog={setShowLogsDialog} flow={mockFlow} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('Logs History')).toBeInTheDocument();
    expect(screen.getByText('Test Flow |')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Check if loading indicator is shown initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the logs to be loaded
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if the logs are rendered
    expect(screen.getByText('task 1')).toBeInTheDocument();
    // expect(screen.getByText('Log message 1')).toBeInTheDocument();
  });

  test('handles closing the dialog', async () => {
    const setShowLogsDialog = jest.fn();
    render(
      <GlobalContext.Provider value={{}}>
        <FlowLogs setShowLogsDialog={setShowLogsDialog} flow={mockFlow} />
      </GlobalContext.Provider>
    );

    // Simulate closing the dialog
    fireEvent.click(screen.getByLabelText('close'));

    expect(setShowLogsDialog).toHaveBeenCalledWith(false);
  });

  test('loads more logs on button click', async () => {
    const setShowLogsDialog = jest.fn();
    render(
      <GlobalContext.Provider value={{}}>
        <FlowLogs setShowLogsDialog={setShowLogsDialog} flow={mockFlow} />
      </GlobalContext.Provider>
    );

    // Wait for the initial logs to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // // Mock the additional logs response
    const additionalLogs = [
      {
        id: 'log-6',
        deployment_id: 'deployment-12333',
        startTime: moment().subtract(2, 'days').toISOString(),
        runs: [
          {
            id: 'run-6',
            label: 'task 6',
            start_time: moment().subtract(2, 'hours').toISOString(),
            end_time: moment().toISOString(),
            logs: [
              {
                level: 1,
                message: 'Log message 6',
                timestamp: moment().toISOString(),
              },
            ],
          },
        ],
        status: 'COMPLETED',
      },
      {
        id: 'log-7',
        deployment_id: 'deployment-12344',
        startTime: moment().subtract(2, 'days').toISOString(),
        runs: [
          {
            id: 'run-7',
            label: 'task 7',
            start_time: moment().subtract(2, 'hours').toISOString(),
            end_time: moment().toISOString(),
            logs: [
              {
                level: 1,
                message: 'Log message 7',
                timestamp: moment().toISOString(),
              },
            ],
          },
        ],
        status: 'COMPLETED',
      },
      {
        id: 'log-8',
        deployment_id: 'deployment-12388',
        startTime: moment().subtract(2, 'days').toISOString(),
        runs: [
          {
            id: 'run-8',
            label: 'task 8',
            start_time: moment().subtract(2, 'hours').toISOString(),
            end_time: moment().toISOString(),
            logs: [
              {
                level: 1,
                message: 'Log message 8',
                timestamp: moment().toISOString(),
              },
            ],
          },
        ],
        status: 'COMPLETED',
      },
      {
        id: 'log-9',
        deployment_id: 'deployment-123345',
        startTime: moment().subtract(2, 'days').toISOString(),
        runs: [
          {
            id: 'run-9',
            label: 'task 9',
            start_time: moment().subtract(2, 'hours').toISOString(),
            end_time: moment().toISOString(),
            logs: [
              {
                level: 1,
                message: 'Log message 9',
                timestamp: moment().toISOString(),
              },
            ],
          },
        ],
        status: 'COMPLETED',
      },
    ];

    httpGet.mockResolvedValueOnce(additionalLogs);
    // Simulate clicking "load more"
    fireEvent.click(screen.getByText(/load more/i));

    // Wait for the additional logs to load
    await waitFor(() => {
      expect(screen.getByText('task 6')).toBeInTheDocument();
    });
  });

  test('displays no information available when there are no logs', async () => {
    httpGet.mockResolvedValueOnce([]);
    const setShowLogsDialog = jest.fn();
    render(
      <GlobalContext.Provider value={{}}>
        <FlowLogs setShowLogsDialog={setShowLogsDialog} flow={mockFlow} />
      </GlobalContext.Provider>
    );

    // Wait for the initial logs to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No information available')).toBeInTheDocument();
  });

  //aisummary
  test('renders and fetches AI summary logs when allowLogsSummary is true', async () => {
    const setShowLogsDialog = jest.fn();

    render(
      <GlobalContext.Provider value={{}}>
        <FlowLogs setShowLogsDialog={setShowLogsDialog} flow={mockFlow} />
      </GlobalContext.Provider>
    );

    // Wait for the initial logs to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that the AI summary button is present
    expect(screen.getByTestId('aisummary-run-2')).toBeInTheDocument();

    // Simulate clicking the AI summary button
    fireEvent.click(screen.getByTestId('aisummary-run-2'));
    await waitFor(() => {
      expect(screen.queryByTestId('aisummary-run-2')).toBeDisabled();
    });
  });
});
