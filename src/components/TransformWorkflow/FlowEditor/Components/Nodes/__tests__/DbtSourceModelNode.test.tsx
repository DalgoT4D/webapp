import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DbtSourceModelNode } from '../DbtSourceModelNode';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { useNodeId, useEdges } from 'reactflow';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/contexts/FlowEditorCanvasContext', () => ({
  useCanvasAction: jest.fn(),
  useCanvasNode: jest.fn(),
}));

jest.mock('@/contexts/FlowEditorPreviewContext', () => ({
  usePreviewAction: jest.fn(),
}));

jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  useNodeId: jest.fn(),
  useEdges: jest.fn(),
  Handle: ({ type, position }) => <div data-testid={`${type}-${position}`} />,
  Position: { Left: 'left', Right: 'right' },
}));

const mockGlobalContext = {
  Permissions: {
    state: ['can_delete_dbt_model', 'can_create_dbt_model'],
  },
};

const mockSetCanvasAction = jest.fn();
const mockSetCanvasNode = jest.fn();
const mockSetPreviewAction = jest.fn();

const mockCanvasAction = {
  setCanvasAction: mockSetCanvasAction,
  canvasAction: { type: '', data: null },
};

const mockCanvasNode = {
  setCanvasNode: mockSetCanvasNode,
  canvasNode: null,
};

const mockPreviewAction = {
  setPreviewAction: mockSetPreviewAction,
};

const node = {
  id: '1',
  type: 'source',
  data: {
    uuid: '1',
    name: 'test_input_name',
    output_columns: ['column1', 'column2'],
    node_type: 'source',
    dbtmodel: {
      uuid: '1',
      name: 'test_input_name',
      display_name: 'test_input_name',
      schema: 'test_schema',
      sql_path: '',
      type: 'source',
      source_name: 'test_input_name',
      output_cols: ['column1', 'column2'],
    },
    operation_config: null,
    is_last_in_chain: false,
    isDummy: false,
  },
};

const edges = [];

beforeEach(() => {
  jest.clearAllMocks();
  useEdges.mockReturnValue(edges);
  useNodeId.mockReturnValue('1');
  useCanvasAction.mockReturnValue(mockCanvasAction);
  useCanvasNode.mockReturnValue(mockCanvasNode);
  usePreviewAction.mockReturnValue(mockPreviewAction);
  useSession.mockReturnValue({ data: { session: 'mock-session' }, status: 'authenticated' });
});

describe('DbtSourceModelNode Component', () => {
  it('should render the component with name and handles', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText(/test_input_name/i)).toBeInTheDocument();
    expect(screen.getByTestId('target-left')).toBeInTheDocument();
    expect(screen.getByTestId('source-right')).toBeInTheDocument();
  });

  it('should display column count from output_columns', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('2 cols')).toBeInTheDocument();
  });

  it('should render the View detail button', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    expect(screen.getByTestId('view-detail-button')).toBeInTheDocument();
  });

  it('should dispatch open-node-detail-modal on View button click', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('view-detail-button'));

    expect(mockSetCanvasAction).toHaveBeenCalledWith({
      type: 'open-node-detail-modal',
      data: {
        schema: 'test_schema',
        table: 'test_input_name',
        nodeName: 'test_input_name',
      },
    });
  });

  it('should call handleSelectNode on click', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByText(/test_input_name/i));

    expect(mockSetCanvasNode).toHaveBeenCalledWith(node);
    expect(mockSetPreviewAction).toHaveBeenCalledWith({
      type: 'preview',
      data: {
        schema: 'test_schema',
        table: 'test_input_name',
      },
    });
    expect(mockSetCanvasAction).toHaveBeenCalledWith({
      type: 'open-opconfig-panel',
      data: 'create',
    });
  });

  it('should call handleDeleteAction on delete icon click', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    fireEvent.click(screen.getByTestId('closebutton'));

    expect(mockSetCanvasAction).toHaveBeenCalledWith({
      type: 'delete-node',
      data: {
        nodeId: '1',
        nodeType: 'source',
        shouldRefreshGraph: false,
        isDummy: false,
      },
    });
  });

  it('should display schema badge with schema name', () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText('test_schema')).toBeInTheDocument();
  });

  it('should render unpublished model nodes with dashed border', () => {
    const unpublishedModelNode = {
      ...node,
      type: 'model',
      data: {
        ...node.data,
        isPublished: false,
      },
    };

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...unpublishedModelNode} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText(/test_input_name/i)).toBeInTheDocument();
  });

  it('should render published model nodes with solid border', () => {
    const publishedModelNode = {
      ...node,
      type: 'model',
      data: {
        ...node.data,
        isPublished: true,
      },
    };

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...publishedModelNode} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText(/test_input_name/i)).toBeInTheDocument();
  });

  it('should render source nodes with solid border regardless of publish status', () => {
    const sourceNodeWithPublishStatus = {
      ...node,
      type: 'source',
      data: {
        ...node.data,
        isPublished: false,
      },
    };

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...sourceNodeWithPublishStatus} />
      </GlobalContext.Provider>
    );

    expect(screen.getByText(/test_input_name/i)).toBeInTheDocument();
  });
});
