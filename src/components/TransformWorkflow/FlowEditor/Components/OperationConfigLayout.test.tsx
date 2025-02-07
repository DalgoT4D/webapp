import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OperationConfigLayout from './OperationConfigLayout';
import { GlobalContext } from '@/contexts/ContextProvider';
import { CanvasActionContext, CanvasNodeContext } from '@/contexts/FlowEditorCanvasContext';
import { ReactFlowProvider } from 'reactflow';
import { OPERATION_NODE } from '../constant';

// Mock the contexts
const mockGlobalContext = {
  Permissions: {
    state: ['can_view_dbt_operation'],
  },
};

const mockCanvasAction = {
  canvasAction: { type: '', data: null },
  setCanvasAction: jest.fn(),
};

const mockCanvasNode = {
  canvasNode: {
    id: 'test-node',
    type: OPERATION_NODE,
    data: {
      config: {
        type: 'rename-columns',
      },
    },
  },
  setCanvasNode: jest.fn(),
};

// Mock components and icons
jest.mock('@mui/icons-material/Close', () => ({
  __esModule: true,
  default: () => <div data-testid="close-icon">CloseIcon</div>,
}));

jest.mock('@mui/icons-material/ChevronLeft', () => ({
  __esModule: true,
  default: () => <div data-testid="chevron-left-icon">ChevronLeftIcon</div>,
}));

// Mock useReactFlow
const mockGetNodes = jest.fn(() => []);
const mockGetEdges = jest.fn(() => []);
const mockAddNodes = jest.fn();
const mockAddEdges = jest.fn();
const mockDeleteElements = jest.fn();
const mockSetNodes = jest.fn();

jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  useReactFlow: () => ({
    addEdges: mockAddEdges,
    addNodes: mockAddNodes,
    deleteElements: mockDeleteElements,
    getNodes: mockGetNodes,
    setNodes: mockSetNodes,
    getEdges: mockGetEdges,
  }),
}));

// Mock the operations and constants
jest.mock('../constant', () => ({
  OPERATION_NODE: 'operation-node',
  SRC_MODEL_NODE: 'src-model-node',
  RENAME_COLUMNS_OP: 'rename-columns',
  operations: [
    { slug: 'rename-columns', label: 'Rename Columns', infoToolTip: 'Rename columns tooltip' },
    { slug: 'join', label: 'Join Tables', infoToolTip: 'Join tables tooltip' },
    { slug: 'create-table', label: 'Create Output Table', infoToolTip: 'Create table tooltip' },
  ],
}));

// Mock all required components
jest.mock('./OperationPanel/Forms/RenameColumnOpForm', () => ({
  __esModule: true,
  default: ({ operation, node }: any) => (
    <div data-testid="rename-column-form">Rename Column Form</div>
  ),
}));

jest.mock('./OperationPanel/CreateTableOrAddFunction', () => ({
  __esModule: true,
  default: ({ clickCreateTable, clickAddFunction, showAddFunction }: any) => (
    <div>
      <button onClick={clickCreateTable}>Create Output Table</button>
      {showAddFunction && <button onClick={clickAddFunction}>Add Function</button>}
    </div>
  ),
}));

jest.mock('./OperationPanel/Forms/CreateTableForm', () => ({
  __esModule: true,
  default: () => <div data-testid="create-table-form">Create Table Form</div>,
}));

// Mock generateDummyOperationlNode
jest.mock('./dummynodes', () => ({
  generateDummyOperationlNode: () => ({
    id: 'dummy-node-id',
    type: 'operation-node',
    position: { x: 0, y: 0 },
    data: { isDummy: true },
  }),
}));

const renderWithProviders = (component: React.ReactNode, customCanvasNode = mockCanvasNode) => {
  return render(
    <GlobalContext.Provider value={mockGlobalContext as any}>
      <CanvasActionContext.Provider value={mockCanvasAction as any}>
        <CanvasNodeContext.Provider value={customCanvasNode as any}>
          <ReactFlowProvider>{component}</ReactFlowProvider>
        </CanvasNodeContext.Provider>
      </CanvasActionContext.Provider>
    </GlobalContext.Provider>
  );
};

describe('OperationConfigLayout', () => {
  const defaultProps = {
    sx: {},
    openPanel: true,
    setOpenPanel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockGetNodes.mockImplementation(() => []);
    mockGetEdges.mockImplementation(() => []);
  });

  it('should not render when openPanel is false', () => {
    renderWithProviders(<OperationConfigLayout {...defaultProps} openPanel={false} />);
    expect(screen.queryByTestId('closeoperationpanel')).not.toBeInTheDocument();
  });

  it('should render create table and add function options by default', async () => {
    const customCanvasNode = {
      canvasNode: null,
      setCanvasNode: jest.fn(),
    };
    renderWithProviders(<OperationConfigLayout {...defaultProps} />, customCanvasNode);

    expect(screen.getByText('Create Output Table')).toBeInTheDocument();
    expect(screen.getByText('Add Function')).toBeInTheDocument();
  });

  it('should show functions list when Add Function is clicked', async () => {
    const customCanvasNode = {
      canvasNode: null,
      setCanvasNode: jest.fn(),
    };
    renderWithProviders(<OperationConfigLayout {...defaultProps} />, customCanvasNode);

    const addFunctionButton = screen.getByText('Add Function');
    fireEvent.click(addFunctionButton);

    expect(screen.getByText('Functions')).toBeInTheDocument();
    expect(screen.getByText('Rename Columns')).toBeInTheDocument();
    expect(screen.getByText('Join Tables')).toBeInTheDocument();
  });

  it('should close panel when close button is clicked', () => {
    renderWithProviders(<OperationConfigLayout {...defaultProps} />);

    const closeButton = screen.getByTestId('closeoperationpanel');
    fireEvent.click(closeButton);

    expect(defaultProps.setOpenPanel).toHaveBeenCalledWith(false);
  });

  it('should show discard dialog when back button is clicked during operation creation', async () => {
    mockGetNodes.mockImplementation(() => [
      {
        id: 'dummy-node',
        data: { isDummy: true },
        position: { x: 0, y: 0 },
      },
    ]);

    const customCanvasNode = {
      canvasNode: null,
      setCanvasNode: jest.fn(),
    };
    renderWithProviders(<OperationConfigLayout {...defaultProps} />, customCanvasNode);

    // Click Add Function and wait for functions list
    fireEvent.click(screen.getByText('Add Function'));
    expect(screen.getByText('Functions')).toBeInTheDocument();

    // Click Rename Columns operation
    fireEvent.click(screen.getByText('Rename Columns'));

    // Click back button
    const backButton = screen.getByTestId('openoperationlist');
    fireEvent.click(backButton);

    expect(screen.getByText('Discard Changes?')).toBeInTheDocument();
  });

  it('should update panel when canvas action changes to open-opconfig-panel', async () => {
    const { rerender } = renderWithProviders(<OperationConfigLayout {...defaultProps} />);

    const updatedCanvasAction = {
      canvasAction: { type: 'open-opconfig-panel', data: 'view' },
      setCanvasAction: jest.fn(),
    };

    const updatedCanvasNode = {
      canvasNode: {
        id: 'test-node',
        type: 'operation-node',
        data: {
          config: {
            type: 'rename-columns',
          },
        },
      },
      setCanvasNode: jest.fn(),
    };

    rerender(
      <GlobalContext.Provider value={mockGlobalContext as any}>
        <CanvasActionContext.Provider value={updatedCanvasAction as any}>
          <CanvasNodeContext.Provider value={updatedCanvasNode as any}>
            <ReactFlowProvider>
              <OperationConfigLayout {...defaultProps} />
            </ReactFlowProvider>
          </CanvasNodeContext.Provider>
        </CanvasActionContext.Provider>
      </GlobalContext.Provider>
    );

    expect(screen.getByTestId('rename-column-form')).toBeInTheDocument();
  });

  it('should show create table form when creating a table', async () => {
    const customCanvasNode = {
      canvasNode: null,
      setCanvasNode: jest.fn(),
    };
    renderWithProviders(<OperationConfigLayout {...defaultProps} />, customCanvasNode);

    fireEvent.click(screen.getByText('Create Output Table'));
    expect(screen.getByTestId('create-table-form')).toBeInTheDocument();
  });
});
