import { Box, IconButton } from '@mui/material';
import { useCallback } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from 'reactflow';
import { Close } from '@mui/icons-material';
import PreviewIcon from '@mui/icons-material/Preview';
import { DbtSourceModel } from '../../FlowEditor';

interface DbtSourceModelNodeData {
  label: string;
  triggerDelete: (nodeId: string | null) => void;
  triggerPreview: (sourceModel: DbtSourceModel | null) => void;
  dbtSourceModel: DbtSourceModel;
}

interface DbtSourceModelNodeProps {
  data: DbtSourceModelNodeData;
}

export function DbtSourceModelNode({ data }: DbtSourceModelNodeProps) {
  console.log('inside custom node', data);

  const nodeId: string | null = useNodeId();

  const handleDeleteAction = () => {
    data.triggerDelete(nodeId);
  };

  const handlePreviewAction = () => {
    data.triggerPreview(data.dbtSourceModel);
  };

  return (
    <>
      <Box
        sx={{
          background: 'white',
          padding: '10px',
          borderRadius: '10px',
          border: '1px solid black',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        {`${data.dbtSourceModel.input_type} | ${data.dbtSourceModel.schema}.${data.dbtSourceModel.input_name}`}
        <Box>
          <IconButton
            onClick={handleDeleteAction}
            data-testid="closebutton"
            sx={{}}
          >
            <Close />
          </IconButton>
        </Box>
        <Box>
          <IconButton
            onClick={handlePreviewAction}
            data-testid="closebutton"
            sx={{}}
          >
            <PreviewIcon />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}
