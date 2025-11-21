// PreviewPane.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import PreviewPane from '../PreviewPane';
import { httpGet } from '@/helpers/http';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/contexts/ContextProvider');
jest.mock('@/contexts/FlowEditorPreviewContext');
jest.mock('@/helpers/http');
jest.mock('next/image', () => {
  const NextImage = (props) => <img {...props} />;
  NextImage.displayName = 'NextImage';
  return NextImage;
});

const mockSession = {
  data: { user: { name: 'Test User' } },
};

const mockPreviewAction = {
  type: 'preview',
  data: {
    schema: 'public',
    input_name: 'test_table',
    dbtmodel: {
      schema: 'public',
      name: 'test_table',
    },
  },
};

describe('PreviewPane Component', () => {
  beforeEach(() => {
    useSession.mockReturnValue(mockSession);
    usePreviewAction.mockReturnValue({ previewAction: mockPreviewAction });
  });
  test('renders preview pane with table and headers', async () => {
    // Mock the httpGet function
    httpGet.mockImplementation((session, url) => {
      if (url.includes('table_columns')) {
        return Promise.resolve([
          { name: 'id', data_type: 'integer' },
          { name: 'name', data_type: 'text' },
        ]);
      } else if (url.includes('table_data')) {
        return Promise.resolve([
          { id: 1, name: 'Test1' },
          { id: 2, name: 'Test2' },
        ]);
      } else if (url.includes('table_count')) {
        return Promise.resolve({ total_rows: 2 });
      } else if (url.includes('download')) {
        return Promise.resolve(new Blob(['id,name\n1,Test1\n2,Test2'], { type: 'text/csv' }));
      }
    });

    render(<PreviewPane height={600} />);

    expect(screen.getByText('test_table')).toBeInTheDocument();
    await waitFor(() => expect(httpGet).toHaveBeenCalledTimes(3));
    await waitFor(() => {
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('Test1')).toBeInTheDocument();
      expect(screen.getByText('Test2')).toBeInTheDocument();
    });

    // Test header rendering and sorting
    const idHeader = screen.getByText('id');
    const nameHeader = screen.getByText('name');

    expect(idHeader).toBeInTheDocument();
    expect(nameHeader).toBeInTheDocument();

    // Test sorting functionality
    fireEvent.click(idHeader);
    await waitFor(() =>
      expect(httpGet).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('order_by=id&order=1')
      )
    );

    fireEvent.click(idHeader);
    await waitFor(() =>
      expect(httpGet).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('order_by=id&order=-1')
      )
    );

    fireEvent.click(nameHeader);
    await waitFor(() =>
      expect(httpGet).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('order_by=name&order=1')
      )
    );
  });
  test('initiates the download process when the download button is clicked', async () => {
    render(<PreviewPane height={600} />);

    const downloadButton = screen.getByTestId('downloadbutton');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(httpGet).toHaveBeenCalled();
    });
  });

  test('renders "Select a table from the left pane to view " message when no table is selected', () => {
    usePreviewAction.mockReturnValue({ previewAction: { type: 'clear-preview' } });

    render(<PreviewPane height={600} />);

    expect(screen.getByText('Select a table from the left pane to view')).toBeInTheDocument();
  });
});
