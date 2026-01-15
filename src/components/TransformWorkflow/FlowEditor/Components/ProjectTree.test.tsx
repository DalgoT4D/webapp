import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectTree from './ProjectTree';
import { GlobalContext } from '@/contexts/ContextProvider';
import { CanvasActionContext } from '@/contexts/FlowEditorCanvasContext';
jest.mock('use-resize-observer', () => () => ({ ref: jest.fn(), width: 300, height: 500 }));

const mockDbtSourceModels = [
  {
    uuid: 'node-1',
    name: 'users',
    display_name: 'users',
    schema: 'public',
    sql_path: '',
    type: 'source' as const,
    source_name: 'users',
    output_cols: [],
  },
  {
    uuid: 'node-2',
    name: 'orders',
    display_name: 'orders',
    schema: 'public',
    sql_path: '',
    type: 'source' as const,
    source_name: 'orders',
    output_cols: [],
  },
  {
    uuid: 'node-3',
    name: 'transactions',
    display_name: 'transactions',
    schema: 'sales',
    sql_path: '',
    type: 'source' as const,
    source_name: 'transactions',
    output_cols: [],
  },
];

const mockHandleNodeClick = jest.fn();
const mockHandleSyncClick = jest.fn();

const CanvasContext = {
  canvasAction: { type: null },
};

const globalPermissions = ['can_create_dbt_model', 'can_sync_sources'];

const renderComponent = (permissions = globalPermissions) => {
  const globalContextValue = {
    Permissions: { state: permissions },
  };

  render(
    <GlobalContext.Provider value={globalContextValue}>
      <CanvasActionContext.Provider value={CanvasContext}>
        <ProjectTree
          dbtSourceModels={mockDbtSourceModels}
          handleNodeClick={mockHandleNodeClick}
          handleSyncClick={mockHandleSyncClick}
          isSyncing={false}
          included_in="visual_designer"
        />
      </CanvasActionContext.Provider>
    </GlobalContext.Provider>
  );
};

describe('ProjectTree Component', () => {
  it('renders ProjectTree with unified search', () => {
    renderComponent();
    expect(screen.getByLabelText(/Search schemas and tables/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Type to search across schemas and tables/i)
    ).toBeInTheDocument();
    // Verify the filter checkboxes are no longer present
    expect(screen.queryByLabelText(/filter by schema/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/filter by table/i)).not.toBeInTheDocument();
  });

  it('shows tree nodes when data is provided', () => {
    renderComponent();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('public')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
  });

  it('filters by schema name using unified search', async () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search schemas and tables/i);
    fireEvent.change(searchInput, { target: { value: 'sales' } });

    await waitFor(() => {
      expect(screen.getByText('sales')).toBeInTheDocument();
      expect(screen.queryByText('public')).not.toBeInTheDocument();
    });
  });

  it('filters by table name using unified search', async () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search schemas and tables/i);
    fireEvent.change(searchInput, { target: { value: 'users' } });

    await waitFor(() => {
      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.queryByText('sales')).not.toBeInTheDocument();
    });
  });

  it('searches across both schemas and tables simultaneously', async () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search schemas and tables/i);
    // Search for 'transaction' which should match the 'transactions' table
    fireEvent.change(searchInput, { target: { value: 'transaction' } });

    await waitFor(() => {
      expect(screen.getByText('sales')).toBeInTheDocument(); // Schema containing the matching table
      expect(screen.queryByText('public')).not.toBeInTheDocument(); // Schema not containing the match
    });

    // Clear search and try searching for schema name
    fireEvent.change(searchInput, { target: { value: 'publ' } });

    await waitFor(() => {
      expect(screen.getByText('public')).toBeInTheDocument(); // Schema name matches
      expect(screen.queryByText('sales')).not.toBeInTheDocument(); // Other schema filtered out
    });
  });

  it('displays empty tree when search yields nothing', async () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search schemas and tables/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      // When search yields no results, only the Data folder should be visible with no children
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.queryByText('public')).not.toBeInTheDocument();
      expect(screen.queryByText('sales')).not.toBeInTheDocument();
    });
  });

  it('calls handleNodeClick on node selection when permitted', () => {
    renderComponent();

    fireEvent.click(screen.getByText('public'));
    expect(mockHandleNodeClick).toHaveBeenCalled();
  });

  it('shows sync icon and calls handleSyncClick', () => {
    renderComponent();

    const syncButton = screen.getByTestId('sync-button');
    fireEvent.click(syncButton);

    expect(mockHandleSyncClick).toHaveBeenCalled();
  });

  it('shows loader when syncing', () => {
    const globalContextValue = {
      Permissions: { state: globalPermissions },
    };

    render(
      <GlobalContext.Provider value={globalContextValue}>
        <CanvasActionContext.Provider value={CanvasContext}>
          <ProjectTree
            dbtSourceModels={mockDbtSourceModels}
            handleNodeClick={mockHandleNodeClick}
            handleSyncClick={mockHandleSyncClick}
            isSyncing={true}
            included_in="visual_designer"
          />
        </CanvasActionContext.Provider>
      </GlobalContext.Provider>
    );

    // When syncing, there should be multiple progress bars (overlay and sync button)
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.getByText('Fetching latest schemas and tables...')).toBeInTheDocument();
  });
});
