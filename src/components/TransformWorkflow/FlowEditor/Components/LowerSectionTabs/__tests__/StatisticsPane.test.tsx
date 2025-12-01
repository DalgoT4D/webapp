// StatisticsPane.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { StatisticsPane } from '../StatisticsPane';
import { GlobalContext } from '@/contexts/ContextProvider';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { httpGet, httpPost } from '@/helpers/http';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { pollTaskStatus } from '../StatisticsPane';
import { CanvasNodeRenderData, DbtModelResponse } from '@/types/transform-v2.types';

// Mock external dependencies
jest.mock('@/helpers/http', () => ({
  httpGet: jest.fn(),
  httpPost: jest.fn(),
}));

jest.mock('@/contexts/FlowEditorPreviewContext', () => ({
  usePreviewAction: jest.fn(),
}));

// Mock session and context
const mockSession: Session = {};
const mockToastContext = {};
const mockSetData = jest.fn();
const mockPostBody = {
  db_schema: 'test_schema',
  db_table: 'test_table',
  column_name: 'test_column',
};
const mockDbtModel: DbtModelResponse = {
  name: 'test_table',
  display_name: 'Test Table',
  schema: 'test_schema',
  sql_path: 'path/to/sql',
  type: 'source',
  source_name: 'test_source',
  output_cols: [],
  uuid: 'test-uuid',
};

const mockPreviewAction = {
  type: 'preview' as const,
  data: {
    uuid: 'test-uuid',
    name: 'test_node',
    output_columns: [],
    node_type: 'SRC' as any,
    dbtmodel: mockDbtModel,
    operation_config: {} as any,
    is_last_in_chain: false,
    isDummy: false,
  } as CanvasNodeRenderData,
};

describe('StatisticsPane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePreviewAction as jest.Mock).mockReturnValue({
      previewAction: mockPreviewAction,
    });
    (httpGet as jest.Mock).mockResolvedValue({ total_rows: 1 });
    (httpPost as jest.Mock).mockResolvedValue({ task_id: 'test_task_id' });
  });

  it('renders loading state when data is being fetched', async () => {
    (httpGet as jest.Mock).mockResolvedValueOnce({ total_rows: 0 });

    render(
      <SessionProvider session={mockSession}>
        <GlobalContext.Provider value={mockToastContext}>
          <StatisticsPane height={500} />
        </GlobalContext.Provider>
      </SessionProvider>
    );

    // Check for the loading state message
    expect(screen.getByText(/Generating insights/i)).toBeInTheDocument();
  });

  it('renders no data available state when there are no rows', async () => {
    (httpGet as jest.Mock).mockResolvedValueOnce({ total_rows: 0 });

    render(
      <SessionProvider session={mockSession}>
        <GlobalContext.Provider value={mockToastContext}>
          <StatisticsPane height={500} />
        </GlobalContext.Provider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No data \(0 rows\) available to generate insights/i)
      ).toBeInTheDocument();
    });
  });

  it('renders table with data when rows are present', async () => {
    (httpGet as jest.Mock).mockResolvedValueOnce({ total_rows: 10 });
    (httpPost as jest.Mock).mockResolvedValueOnce({ task_id: 'test_task_id' });

    // Mock the response for column data
    (httpGet as jest.Mock).mockResolvedValueOnce([
      { name: 'column1', translated_type: 'Numeric' },
      { name: 'column2', translated_type: 'String' },
    ]);

    render(
      <SessionProvider session={mockSession}>
        <GlobalContext.Provider value={mockToastContext}>
          <StatisticsPane height={500} />
        </GlobalContext.Provider>
      </SessionProvider>
    );

    // Check for table header
    await waitFor(() => {
      expect(screen.getByText(/Column name/i)).toBeInTheDocument();
      expect(screen.getByText(/Column type/i)).toBeInTheDocument();
      expect(screen.getByText(/Distinct/i)).toBeInTheDocument();
      expect(screen.getByText(/Null/i)).toBeInTheDocument();
      expect(screen.getByText(/Data distribution/i)).toBeInTheDocument();
    });
  });

  it('renders select a table message when no model is selected', () => {
    (usePreviewAction as jest.Mock).mockReturnValue({
      previewAction: { type: 'clear-preview', data: null },
    });

    render(
      <SessionProvider session={mockSession}>
        <GlobalContext.Provider value={mockToastContext}>
          <StatisticsPane height={500} />
        </GlobalContext.Provider>
      </SessionProvider>
    );

    // Check for the message when no model is selected
    expect(screen.getByText(/Select a table from the left pane to view/i)).toBeInTheDocument();
  });

  it('should resolve when status is completed', async () => {
    const mockResult = { countNull: 1, countDistinct: 2, someOtherResult: 'data' };
    const mockResponse = {
      progress: [{ status: 'completed', results: mockResult }],
    };

    (httpGet as jest.Mock).mockResolvedValue(mockResponse);

    await expect(
      pollTaskStatus(mockSession, 'test_task_id', mockPostBody, mockSetData)
    ).resolves.toEqual(mockResult);
  });

  it('should reject when status is failed', async () => {
    const mockResponse = {
      progress: [{ status: 'failed' }],
    };

    (httpGet as jest.Mock).mockResolvedValue(mockResponse);

    await expect(
      pollTaskStatus(mockSession, 'test_task_id', mockPostBody, mockSetData)
    ).rejects.toEqual({ reason: 'Failed' });
  });

  //can add polling test

  it('should retry and eventually reject on error', async () => {
    const mockError = new Error('Network Error');
    (httpGet as jest.Mock).mockRejectedValue(mockError);

    await expect(
      pollTaskStatus(mockSession, 'test_task_id', mockPostBody, mockSetData)
    ).rejects.toThrow(mockError);
  });
});
