import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectTree from './ProjectTree';
import { GlobalContext } from '@/contexts/ContextProvider';
import { CanvasActionContext } from '@/contexts/FlowEditorCanvasContext';
import { SRC_MODEL_NODE } from '../constant';

jest.mock('use-resize-observer', () => () => ({ ref: jest.fn(), width: 300, height: 500 }));

const mockDbtSourceModels = [
  {
    id: 'node-1',
    schema: 'public',
    input_name: 'users',
    input_type: 'source',
    type: SRC_MODEL_NODE,
  },
  {
    id: 'node-2',
    schema: 'public',
    input_name: 'orders',
    input_type: 'source',
    type: SRC_MODEL_NODE,
  },
  {
    id: 'node-3',
    schema: 'sales',
    input_name: 'transactions',
    input_type: 'source',
    type: SRC_MODEL_NODE,
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
        />
      </CanvasActionContext.Provider>
    </GlobalContext.Provider>
  );
};

describe('ProjectTree Component', () => {
  it('renders ProjectTree with search and checkboxes', () => {
    renderComponent();
    expect(screen.getByLabelText(/Search by table/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by schema/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by table/i)).toBeInTheDocument();
  });

  it('shows tree nodes when data is provided', () => {
    renderComponent();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('public')).toBeInTheDocument();
    expect(screen.getByText('sales')).toBeInTheDocument();
  });

  it('filters by schema', async () => {
    renderComponent();

    const schemaCheckbox = screen.getByLabelText(/filter by schema/i);
    fireEvent.click(schemaCheckbox);

    const searchInput = screen.getByLabelText(/Search by schema/i);
    fireEvent.change(searchInput, { target: { value: 'sales' } });

    await waitFor(() => {
      expect(screen.getByText('sales')).toBeInTheDocument();
      expect(screen.queryByText('public')).not.toBeInTheDocument();
    });
  });

  it('filters by table', async () => {
    renderComponent();

    const tableCheckbox = screen.getByLabelText(/filter by table/i);
    fireEvent.click(tableCheckbox);

    const searchInput = screen.getByLabelText(/Search by table/i);
    fireEvent.change(searchInput, { target: { value: 'users' } });

    await waitFor(() => {
      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.queryByText('sales')).not.toBeInTheDocument();
    });
  });

  it('displays no results when search yields nothing', async () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search by table/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/No results found/i)).toBeInTheDocument();
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
          />
        </CanvasActionContext.Provider>
      </GlobalContext.Provider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
