import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Sources } from '../Sources';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import useSWR from 'swr';
import { httpDelete, httpGet } from '@/helpers/http';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { Dialog } from '@mui/material';

jest.mock('../SourceForm', () => ({
  SourceForm: ({ showForm, setShowForm }: { showForm: boolean; setShowForm: any }) => {
    return (
      <Dialog open={showForm} data-testid="test-source-form">
        form-dialog-component
        <button
          data-testid="closebutton"
          onClick={() => {
            setShowForm(false);
          }}
        >
          Close
        </button>
      </Dialog>
    );
  },
}));

jest.mock('next-auth/react');
jest.mock('swr');
jest.mock('@/helpers/http');
jest.mock('@/components/ToastMessage/ToastHelper');

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock other components used by Sources
jest.mock('../../List/List', () => ({
  List: ({ title, openDialog, rows }: any) => (
    <div data-testid="list-component">
      <button onClick={openDialog}>New {title}</button>
      <div>
        {rows.map((row: any, index: number) => (
          <div key={index} data-testid={`row-${index}`}>
            {row.map((cell: any, cellIndex: number) => (
              <div key={cellIndex}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
}));

jest.mock('../../UI/Menu/Menu', () => ({
  ActionsMenu: ({ handleDelete }: any) => (
    <div data-testid="actions-menu">
      <button onClick={handleDelete}>Delete</button>
    </div>
  ),
}));

jest.mock('../../Dialog/ConfirmationDialog', () => {
  return function MockConfirmationDialog({ show, handleConfirm }: any) {
    return show ? (
      <div data-testid="confirmation-dialog">
        <button onClick={handleConfirm}>I understand the consequences, confirm</button>
      </div>
    ) : null;
  };
});

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
    dispatch: jest.fn(),
  },
  Toast: {
    state: {
      open: false,
      severity: 'success' as const,
      message: '',
      messages: [],
      seconds: 5000,
      handleClose: jest.fn(),
    },
    dispatch: jest.fn(),
  },
  CurrentOrg: {
    state: {
      slug: 'test-org',
      name: 'Test Org',
      airbyte_workspace_id: 'test-workspace',
      viz_url: '',
      viz_login_type: '',
      wtype: '',
      is_demo: false,
    },
    dispatch: jest.fn(),
  },
  OrgUsers: {
    state: [],
    dispatch: jest.fn(),
  },
  UnsavedChanges: {
    state: false,
    dispatch: jest.fn(),
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
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (useSWR as jest.Mock).mockReturnValue({ data: mockData, isLoading: false, mutate: jest.fn() });
    (httpGet as jest.Mock).mockResolvedValue(mockSourceDefs);
    (httpDelete as jest.Mock).mockResolvedValue({ success: true });
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

    // Wait for the data to be rendered and verify that source names are displayed
    await waitFor(() => {
      expect(screen.getByText('Source 1')).toBeInTheDocument();
      expect(screen.getByText('Source 2')).toBeInTheDocument();
    });
  });

  test('opens and closes SourceForm dialog', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <Sources />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByText(/New Source/i));
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

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Source 1')).toBeInTheDocument();
    });

    // Click Delete button in ActionsMenu
    fireEvent.click(screen.getByText('Delete'));

    // Confirm delete action
    fireEvent.click(screen.getByText(/I understand the consequences, confirm/i));

    await waitFor(() =>
      expect(successToast).toHaveBeenCalledWith('Source deleted', [], mockGlobalContext)
    );
  });

  test.only('displays loading indicator while fetching data', async () => {
    (useSWR as jest.Mock).mockReturnValueOnce({ data: null, isLoading: true, mutate: jest.fn() });

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <Sources />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
