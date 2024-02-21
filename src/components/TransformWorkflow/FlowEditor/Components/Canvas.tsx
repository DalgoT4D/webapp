import { Box, Button, Divider } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import React from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';

const Canvas = ({}) => {
  const nodes: any = [];
  const edges: any = [];
  const handleNodesChange = () => {};
  const handleEdgesChange = () => {};
  const handleNewConnection = () => {};
  const nodeTypes: any = [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ height: '10%', background: 'lightgrey' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'row-reverse',
            padding: '0 20px',
            gap: '10px',
          }}
        >
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
