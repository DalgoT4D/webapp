import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OperationNode } from '../OperationNode';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useCanvasAction, useCanvasNode } from '@/contexts/FlowEditorCanvasContext';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { useNodeId, useEdges, Handle, Position } from 'reactflow';

// Mock necessary hooks and components
jest.mock('reactflow', () => ({
    ...jest.requireActual('reactflow'),
    useNodeId: jest.fn(),
    useEdges: jest.fn(),
    Handle: ({ type, position }) => <div data-testid={`${type}-${position}`} />,
    Position: { Left: 'left', Right: 'right' },
}));

jest.mock('@/contexts/FlowEditorCanvasContext', () => ({
    useCanvasAction: jest.fn(),
    useCanvasNode: jest.fn(),
}));

jest.mock('@/contexts/FlowEditorPreviewContext', () => ({
    usePreviewAction: jest.fn(),
}));

const mockGlobalContext = {
    Permissions: {
        state: ['can_delete_dbt_operation', 'can_edit_dbt_operation'],
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
    type: 'operation',
    data: {
        config: {
            type: 'flattenjson',
        },
        isDummy: false,
    },
};

const edges = [
    //   { id: 'e1-2', source: '1', target: '2' },
];

beforeEach(() => {
    jest.clearAllMocks();
    useEdges.mockReturnValue(edges);
    useNodeId.mockReturnValue('1');
    useCanvasAction.mockReturnValue(mockCanvasAction);
    useCanvasNode.mockReturnValue(mockCanvasNode);
    usePreviewAction.mockReturnValue(mockPreviewAction);
});

describe('OperationNode Component', () => {
    it('should render the component', () => {
        const node = {
            id: '1',
            type: 'operation',
            data: {
                config: {
                    type: 'Not found',
                },
                isDummy: false,
            },
        };

        render(
            <GlobalContext.Provider value={mockGlobalContext}>
                <OperationNode {...node} />
            </GlobalContext.Provider>
        );

        expect(screen.getByText(/Not found/i)).toBeInTheDocument();
        expect(screen.getByTestId('target-left')).toBeInTheDocument();
        expect(screen.getByTestId('source-right')).toBeInTheDocument();
    });

    it('should call handleSelectNode on click', () => {
        const node = {
            id: '1',
            type: 'operation',
            data: {
                config: {
                    type: 'flattenjson',
                },
                isDummy: false,
            },
        };
        render(
            <GlobalContext.Provider value={mockGlobalContext}>
                <OperationNode {...node} />
            </GlobalContext.Provider>
        );

        fireEvent.click(screen.getByTestId("nodeselectbox"));
        expect(mockSetCanvasNode).toHaveBeenCalledWith(node);
        expect(mockSetPreviewAction).toHaveBeenCalledWith({ type: 'clear-preview', data: null });
        expect(mockSetCanvasAction).toHaveBeenCalledWith({
            type: 'open-opconfig-panel',
            data: 'edit',
        });
    });

    it('should call handleDeleteAction on delete icon click', () => {
        const node = {
            id: '1',
            type: 'operation',
            data: {
                config: {
                    type: 'flattenjson',
                },
                isDummy: false,
            },
        };

        render(
            <GlobalContext.Provider value={mockGlobalContext}>
                <OperationNode {...node} />
            </GlobalContext.Provider>
        );

        fireEvent.click(screen.getByTestId('closebutton'));

        expect(mockSetCanvasAction).toHaveBeenCalledWith({
            type: 'delete-node',
            data: {
                nodeId: '1',
                nodeType: 'operation',
                shouldRefreshGraph: false,
                isDummy: false,
            },
        });
    });
});
