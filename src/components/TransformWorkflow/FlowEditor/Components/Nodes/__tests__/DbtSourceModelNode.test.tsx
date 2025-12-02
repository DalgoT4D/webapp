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

const edges = [
  //   { id: 'e1-2', source: '1', target: '2' },
];

const columns = [
  { name: 'column1', data_type: 'string' },
  { name: 'column2', data_type: 'int' },
];

beforeEach(() => {
  jest.clearAllMocks();
  useEdges.mockReturnValue(edges);
  useNodeId.mockReturnValue('1');
  useCanvasAction.mockReturnValue(mockCanvasAction);
  useCanvasNode.mockReturnValue(mockCanvasNode);
  usePreviewAction.mockReturnValue(mockPreviewAction);
  useSession.mockReturnValue({ data: { session: 'mock-session' }, status: 'authenticated' });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(columns),
    })
  );
});

describe('DbtSourceModelNode Component', () => {
  it('should render the component', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/test_input_name/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId('target-left')).toBeInTheDocument();
    expect(screen.getByTestId('source-right')).toBeInTheDocument();
  });

  it('should call handleSelectNode on click', async () => {
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/test_input_name/i)).toBeInTheDocument();
    });

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
    const deleteNode = {
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
    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...deleteNode} />
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

  it('should display error message if columns fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch columns')));

    render(
      <GlobalContext.Provider value={mockGlobalContext}>
        <DbtSourceModelNode {...node} />
      </GlobalContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Please check logs/i)).toBeInTheDocument();
    });
  });
});
