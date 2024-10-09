import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Sources } from '../Sources';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import useSWR from 'swr';
import { httpDelete, httpGet } from '@/helpers/http';
import { successToast } from '@/components/ToastMessage/ToastHelper';

jest.mock('next-auth/react');
jest.mock('swr');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');

const mockSession = {
  data: {
    user: {
      email: 'test@example.com',
    },
  },
};

const mockGlobalContext = {
  Permissions: {
    state: ['can_create_source', 'can_edit_source', 'can_delete_source'],
  },
  CurrentOrg: {
    state: {
      is_demo: false,
    },
  },
};

const mockData = [
  {
    sourceId: '1',
    name: 'Source 1',
    sourceName: 'Type 1',
    sourceDefinitionId: 'def1',
  },
  {
    sourceId: '2',
    name: 'Source 2',
    sourceName: 'Type 2',
    sourceDefinitionId: 'def2',
  },
];

const mockSourceDefs = [
  {
    id: 'def1',
    name: 'Definition 1',
    dockerRepository: 'repo1',
    dockerImageTag: 'tag1',
  },
  {
    id: 'def2',
    name: 'Definition 2',
    dockerRepository: 'repo2',
    dockerImageTag: 'tag2',
  },
];
describe('Sources', () => {
  beforeEach(() => {
    useSession.mockReturnValue(mockSession);
    useSWR.mockReturnValue({ data: mockData, isLoading: false, mutate: jest.fn() });
    httpGet.mockResolvedValue(mockSourceDefs);
    httpDelete.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders Sources component and displays data', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <Sources />
      </GlobalContext.Provider>
    );

    // Verify that source names are displayed
    expect(screen.getByText('Source 1')).toBeInTheDocument();
    expect(screen.getByText('Source 2')).toBeInTheDocument();
  });

  test('opens and closes SourceForm dialog', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <Sources />
      </GlobalContext.Provider>
    );

    // Open the form dialog
    fireEvent.click(screen.getByText(/ New Source/i));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close the form dialog
    fireEvent.click(screen.getByTestId('closebutton'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('handles source deletion', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <Sources />
      </GlobalContext.Provider>
    );

    // Open the menu and select delete
    fireEvent.click(screen.getAllByTestId('MoreHorizIcon')[0]);
    fireEvent.click(screen.getByText('Delete'));

    // Confirm delete action
    fireEvent.click(screen.getByText(/I understand the consequences, confirm/i));
    await waitFor(() =>
      expect(successToast).toHaveBeenCalledWith('Source deleted', [], mockGlobalContext)
    );
  });

  test('displays loading indicator while fetching data', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <Sources />
      </GlobalContext.Provider>
    );
    useSWR.mockReturnValueOnce({ data: null, isLoading: true, mutate: jest.fn() });
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
