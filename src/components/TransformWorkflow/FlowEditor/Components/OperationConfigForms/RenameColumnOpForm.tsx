import React from 'react';
import {
  OperationNodeType,
  SrcModelNodeType,
  UIOperationType,
} from '../Canvas';

interface RenameColumnOpProps {
  operation: UIOperationType;
  node: SrcModelNodeType | OperationNodeType;
}

const RenameColumnOp = ({ node }: RenameColumnOpProps) => {
  return <>Rename op {node.id}</>;
};

export default RenameColumnOp;
