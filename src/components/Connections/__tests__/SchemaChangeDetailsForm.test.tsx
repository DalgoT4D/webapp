import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SchemaChangeDetailsForm from '../SchemaChangeDetailsForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
// import CustomDialog from '../Dialog/CustomDialog';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../../ToastMessage/ToastHelper';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('../../../helpers/http');
jest.mock('../../ToastMessage/ToastHelper');
const nonBreakingData = {
  progress: [
    {
      message: 'started',
      status: 'running',
    },
    {
      message: 'fetched catalog data',
      status: 'completed',
      result: {
        name: 'Worldometer',
        connectionId: '1ff9f64f-fc97-4358-8b8a-59cfa2432479',
        catalogId: '76e1f022-a049-4ab0-b5f6-7a34c46cb82c',
        syncCatalog: {
          streams: [
            {
              stream: {
                name: 'worldometer_data',
                jsonSchema: {
                  type: 'object',
                  properties: {
                    'New column of nulls': { type: 'string' },
                    'Second new column': { type: 'string' },
                  },
                },
              },
              config: {
                syncMode: 'full_refresh',
                destinationSyncMode: 'overwrite',
                aliasName: 'worldometer_data',
                selected: true,
              },
            },
            {
              stream: {
                name: 'new_tab',
                jsonSchema: {
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    b: { type: 'string' },
                  },
                },
              },
              config: {
                syncMode: 'full_refresh',
                destinationSyncMode: 'overwrite',
                aliasName: 'new_tab',
                selected: false,
              },
            },
          ],
        },
        schemaChange: 'non_breaking',
        catalogDiff: {
          transforms: [
            {
              transformType: 'add_stream',
              streamDescriptor: {
                name: 'new_tab',
              },
            },
            {
              transformType: 'update_stream',
              streamDescriptor: {
                name: 'worldometer_data',
              },
              updateStream: [
                {
                  transformType: 'add_field',
                  fieldName: ['Second new column'],
                  breaking: false,
                },
                {
                  transformType: 'add_field',
                  fieldName: ['New column of nulls'],
                  breaking: false,
                },
              ],
            },
          ],
        },
      },
    },
  ],
};
describe('SchemaChangeDetailsForm', () => {
  const mockMutate = jest.fn();
  const mockSetShowForm = jest.fn();
  const mockSetConnectionId = jest.fn();
  const mockFetchPendingActions = jest.fn();
  const mockSession = { data: { token: 'mockToken' } };

  const defaultProps = {
    connectionId: 'test-connection-id',
    mutate: mockMutate,
    showForm: true,
    setShowForm: mockSetShowForm,
    setConnectionId: mockSetConnectionId,
    fetchPendingActions: mockFetchPendingActions,
  };

  const mockContextValue = {
    someContextValue: 'test-value',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('renders the component and fetches data on load', async () => {
    jest.useFakeTimers(); // Use fake timers

    httpGet.mockResolvedValueOnce({
      task_id: 'mock-task-id',
    });

    httpGet.mockResolvedValueOnce({
      progress: [
        {
          status: 'completed',
          result: {
            catalogId: 'mock-catalog-id',
            name: 'mock-name',
            syncCatalog: { streams: [] },
          },
        },
      ],
    });

    render(
      <GlobalContext.Provider value={mockContextValue}>
        <SchemaChangeDetailsForm {...defaultProps} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('Schema Changes')).toBeInTheDocument();

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(2));

    await waitFor(() => expect(screen.getByText('Schema Changes')).toBeInTheDocument());

    jest.useRealTimers(); // Restore real timers
  });

  it('handles form submission successfully', async () => {
    jest.useFakeTimers(); // Use fake timers
    httpGet.mockResolvedValueOnce({
      task_id: 'mock-task-id',
    });

    httpGet.mockResolvedValueOnce(nonBreakingData);

    httpPost.mockResolvedValueOnce({});

    render(
      <GlobalContext.Provider value={mockContextValue}>
        <SchemaChangeDetailsForm {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Ensure data is fetched and rendered
    expect(screen.getByText('Schema Changes')).toBeInTheDocument();

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));

    jest.advanceTimersByTime(3000); // Fast-forward time by 3 seconds

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(2));
    jest.advanceTimersByTime(3000);
    // Verify the presence of table changes
    await waitFor(() => expect(screen.getByText('2 tables with changes')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Tables Added')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('new_tab')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('New column of nulls')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Second new column')).toBeInTheDocument());

    // Submit the form
    fireEvent.click(screen.getByText('Yes, I approve'));

    await waitFor(() => expect(httpPost).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(successToast).toHaveBeenCalledWith('Success', [], mockContextValue));
    jest.useRealTimers(); // Restore real timers
  });

  it('handles form submission failure', async () => {
    jest.useFakeTimers(); // Use fake timers
    httpGet.mockResolvedValueOnce({
      task_id: 'mock-task-id',
    });

    httpGet.mockResolvedValueOnce(nonBreakingData);

    httpPost.mockResolvedValueOnce({});

    render(
      <GlobalContext.Provider value={mockContextValue}>
        <SchemaChangeDetailsForm {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Ensure data is fetched and rendered
    expect(screen.getByText('Schema Changes')).toBeInTheDocument();

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));

    jest.advanceTimersByTime(3000); // Fast-forward time by 3 seconds

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(2));
    jest.advanceTimersByTime(3000);
    // Verify the presence of table changes
    await waitFor(() => expect(screen.getByText('2 tables with changes')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Tables Added')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('new_tab')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('New column of nulls')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Second new column')).toBeInTheDocument());

    // Submit the form
    fireEvent.click(screen.getByText('Yes, I approve'));
    const mockError = new Error('Submission failed');
    httpPost.mockRejectedValueOnce(mockError);

    render(
      <GlobalContext.Provider value={mockContextValue}>
        <SchemaChangeDetailsForm {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('approveschemachange'));

    await waitFor(() => expect(httpPost).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith(mockError.message, [], mockContextValue)
    );
    jest.useRealTimers();
  });

  it('handles closing the dialog', () => {
    render(
      <GlobalContext.Provider value={mockContextValue}>
        <SchemaChangeDetailsForm {...defaultProps} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByText('Close'));
    expect(mockSetShowForm).toHaveBeenCalledWith(false);
  });

  it('disables the submit button if there are breaking changes', async () => {
    jest.useFakeTimers(); // Use fake timers
    httpGet.mockResolvedValueOnce({
      task_id: 'mock-task-id',
    });

    httpGet.mockResolvedValueOnce({
      progress: [
        {
          message: 'started',
          status: 'running',
        },
        {
          message: 'fetched catalog data',
          status: 'completed',
          result: {
            name: 'Worldometer',
            connectionId: '1ff9f64f-fc97-4358-8b8a-59cfa2432479',
            catalogId: '76e1f022-a049-4ab0-b5f6-7a34c46cb82c',
            syncCatalog: {
              streams: [
                {
                  stream: {
                    name: 'worldometer_data',
                    jsonSchema: {
                      type: 'object',
                      properties: {
                        'New column of nulls': { type: 'string' },
                        'Second new column': { type: 'string' },
                      },
                    },
                  },
                  config: {
                    syncMode: 'full_refresh',
                    destinationSyncMode: 'overwrite',
                    aliasName: 'worldometer_data',
                    selected: true,
                  },
                },
                {
                  stream: {
                    name: 'new_tab',
                    jsonSchema: {
                      type: 'object',
                      properties: {
                        A: { type: 'string' },
                        b: { type: 'string' },
                      },
                    },
                  },
                  config: {
                    syncMode: 'full_refresh',
                    destinationSyncMode: 'overwrite',
                    aliasName: 'new_tab',
                    selected: false,
                  },
                },
              ],
            },
            schemaChange: 'breaking',
            catalogDiff: {
              transforms: [
                {
                  transformType: 'add_stream',
                  streamDescriptor: {
                    name: 'new_tab',
                  },
                },
                {
                  transformType: 'update_stream',
                  streamDescriptor: {
                    name: 'worldometer_data',
                  },
                  updateStream: [
                    {
                      transformType: 'add_field',
                      fieldName: ['Second new column'],
                      breaking: false,
                    },
                    {
                      transformType: 'add_field',
                      fieldName: ['New column of nulls'],
                      breaking: false,
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    });

    httpPut.mockResolvedValueOnce({});

    render(
      <GlobalContext.Provider value={mockContextValue}>
        <SchemaChangeDetailsForm {...defaultProps} />
      </GlobalContext.Provider>
    );

    // Ensure data is fetched and rendered
    expect(screen.getByText('Schema Changes')).toBeInTheDocument();

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(1));

    jest.advanceTimersByTime(3000); // Fast-forward time by 3 seconds

    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(2));
    jest.advanceTimersByTime(3000);
    // Verify the presence of table changes
    await waitFor(() => expect(screen.getByText('2 tables with changes')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Tables Added')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('new_tab')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('New column of nulls')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Second new column')).toBeInTheDocument());

    await waitFor(() => expect(screen.getByTestId('approveschemachange')).toBeDisabled());
  });
});
