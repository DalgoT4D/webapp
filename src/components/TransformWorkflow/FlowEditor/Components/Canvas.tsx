import { Box, Button, Divider, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import React, { useContext, useEffect } from 'react';
import { useCallback, useState } from 'react';
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  useNodesState,
  Controls,
  Background,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  ControlButton,
  Node,
  Edge,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DbtSourceModel } from '../FlowEditor';
import { DbtSourceModelNode } from './Nodes/DbtSourceModelNode';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';

type CanvasProps = {};

const CanvasHeader = ({}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        flexDirection: 'space-between',
        justifyContent: 'center',
        padding: '0 20px',
        gap: '10px',
      }}
    >
      <Typography variant="h6" sx={{ marginLeft: 'auto' }}>
        Workflow01
      </Typography>

      <Box sx={{ marginLeft: 'auto', display: 'flex', gap: '20px' }}>
        <Button
          variant="contained"
          type="button"
          onClick={() =>
            alert('This will run the workflow with or without parameters.')
          }
        >
          Run
        </Button>
        <Button
          variant="contained"
          type="button"
          onClick={() => alert('Not sure what this will do')}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

const nodeTypes = { custom: DbtSourceModelNode };

const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

const Canvas = ({}: CanvasProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const flowEditorContext = useContext(FlowEditorContext);

  const handleNodesChange = (changes: NodeChange[]) => {
    console.log(
      'inside handle nodes changes; changes include move, drag and select'
    );
    console.log('node changes', changes);
    onNodesChange(changes);
  };

  const handleEdgesChange = (changes: EdgeChange[]) => {
    console.log(
      'inside handle edges changes; changes include select and remove'
    );
    onEdgesChange(changes);
  };

  const handleNewConnection = (connection: Connection) => {
    console.log(
      'inside handle new connection; when two nodes are connected by user',
      connection
    );
    setEdges((edges) => addEdge(connection, edges));
  };

  const handleDeleteNode = (nodeId: string) => {
    console.log('deleting a node with id ', nodeId);
    // remove the node from preview if its there
    // this will work once we use the uuids from the backend
    if (nodeId === flowEditorContext?.NodeActionTodo.state.node?.id) {
      flowEditorContext?.NodeActionTodo.dispatch({
        type: 'clear-preview',
        actionState: {
          node: null,
          toDo: 'clear-preview',
        },
      });
    }
    setNodes((nds) => applyNodeChanges([{ type: 'remove', id: nodeId }], nds));
  };

  const handlePreviewDataForNode = (sourceModel: DbtSourceModel | null) => {
    console.log('previewing data for ', sourceModel);
    if (sourceModel) {
      flowEditorContext?.NodeActionTodo.dispatch({
        type: 'preview',
        actionState: {
          node: sourceModel,
          toDo: 'preview',
        },
      });
    }
  };

  const addNewNodeToCanvas = (
    dbtSourceModel: DbtSourceModel | null | undefined
  ) => {
    if (dbtSourceModel) {
      console.log('adding a source or a model to canvas', dbtSourceModel);
      const newNode = {
        id: `randomnode_${+new Date()}`,
        type: 'custom',
        data: {
          label: `${dbtSourceModel.input_type} | ${dbtSourceModel.schema}.${dbtSourceModel.input_name}`,
          triggerDelete: handleDeleteNode,
          triggerPreview: handlePreviewDataForNode,
          dbtSourceModel: dbtSourceModel,
        },
        position: { x: 100, y: 125 },
      };
      setNodes((nds) => nds.concat(newNode));
    }
  };

  useEffect(() => {
    // This event is triggered via the ProjectTree component
    if (flowEditorContext?.NodeActionTodo.state.toDo === 'new') {
      addNewNodeToCanvas(flowEditorContext?.NodeActionTodo.state.node);
    }
  }, [flowEditorContext?.NodeActionTodo.state]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: '10%', background: 'lightgrey' }}>
        <CanvasHeader />
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box sx={{ height: '90%' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleNewConnection}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            defaultViewport={defaultViewport}
            fitView
          >
            <Background />
            <Controls>
              <ControlButton
                onClick={() =>
                  alert(
                    'This should clear the canvas and reset things, not sure yet. ✨'
                  )
                }
              >
                <ReplayIcon />
              </ControlButton>
            </Controls>
          </ReactFlow>
        </ReactFlowProvider>
      </Box>
    </Box>
  );
};

export default Canvas;
