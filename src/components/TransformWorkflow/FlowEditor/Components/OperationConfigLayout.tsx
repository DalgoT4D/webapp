import { Box, Divider, SxProps, Typography } from '@mui/material';
import React from 'react';
import { OperationNodeType, SrcModelNodeType, UIOperationType } from './Canvas';
import { operations } from './OperationConfigForms/constant';
import InfoIcon from '@mui/icons-material/Info';
import { RENAME_COLUMNS_OP } from './OperationConfigForms/constant';
import RenameColumnOpForm from './OperationConfigForms/RenameColumnOpForm';

interface OperationConfigProps {
  sx: SxProps;
  openConfigPanel: boolean;
  setOpenConfigPanel: (...args: any) => void;
  operation: UIOperationType | null;
  node: SrcModelNodeType | OperationNodeType | null;
}

interface OperationFormProps {
  node: SrcModelNodeType | OperationNodeType;
  operation: UIOperationType;
}

const operationComponentMapping: any = {
  [RENAME_COLUMNS_OP]: ({ node, operation }: OperationFormProps) => (
    <RenameColumnOpForm node={node} operation={operation} />
  ), // add more operations here
};

const OperationForm = ({ operation, node }: OperationFormProps) => {
  return operationComponentMapping[operation.slug]({ operation, node });
};

const OperationConfigLayout = ({
  operation,
  node,
  openConfigPanel,
  setOpenConfigPanel,
  sx,
}: OperationConfigProps) => {
  if (!openConfigPanel) return null;

  if (!operation) return <Box sx={{ ...sx }}>Operation not found</Box>;

  if (!node) return <Box sx={{ ...sx }}>Please select a node</Box>;

  console.log('Selected this node in config form', node);
  console.log('Selected this operation in config form', operation);
  return (
    <Box sx={{ ...sx }}>
      <Box
        sx={{
          padding: '6px 16px 6px 16px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography fontWeight={600} fontSize="15px" color="#5E5E5E">
          {operation.label}
        </Typography>
        <Box sx={{ width: '16px', height: '16px' }}>
          <InfoIcon sx={{ color: '#D9D9D9' }} />
        </Box>
      </Box>
      <Divider orientation="horizontal" />
      <OperationForm operation={operation} node={node} />
    </Box>
  );
};

export default OperationConfigLayout;
