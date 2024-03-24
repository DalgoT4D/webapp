import {
  OperationNodeType,
  SrcModelNodeType,
} from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import React, { useState, useContext, Dispatch, SetStateAction } from 'react';

///////////////////////////// Canvas Node ////////////////////////////////

interface CanvasNodeContext {
  canvasNode: SrcModelNodeType | OperationNodeType | null | undefined;
  setCanvasNode: Dispatch<
    SetStateAction<SrcModelNodeType | OperationNodeType | null | undefined>
  >;
}

const CanvasNodeContext = React.createContext<CanvasNodeContext>({
  canvasNode: null,
  setCanvasNode: () => {},
});

export const CanvasNodeProvider = ({ children }: any) => {
  const [canvasNode, setCanvasNode] = useState<
    SrcModelNodeType | OperationNodeType | null | undefined
  >(null);

  return (
    <CanvasNodeContext.Provider value={{ canvasNode, setCanvasNode }}>
      {children}
    </CanvasNodeContext.Provider>
  );
};

export const useCanvasNode = () => {
  return useContext<CanvasNodeContext>(CanvasNodeContext);
};

///////////////////////////// Canvas Action ////////////////////////////////

interface Action {
  type:
    | 'add-srcmodel-node'
    | 'delete-node'
    | 'refresh-canvas'
    | 'open-opconfig-panel'
    | 'close-reset-opconfig-panel'
    | 'sync-sources'
    | 'run-workflow'
    | ''
    | undefined
    | null;
  data: any;
}

interface CanvasActionContext {
  canvasAction: Action;
  setCanvasAction: Dispatch<SetStateAction<Action>>;
}

const CanvasActionContext = React.createContext<CanvasActionContext>({
  canvasAction: { type: '', data: null },
  setCanvasAction: () => {},
});

export const CanvasActionProvider = ({ children }: any) => {
  const [canvasAction, setCanvasAction] = useState<Action>({
    type: '',
    data: null,
  });

  return (
    <CanvasActionContext.Provider value={{ canvasAction, setCanvasAction }}>
      {children}
    </CanvasActionContext.Provider>
  );
};

export const useCanvasAction = () => {
  return useContext<CanvasActionContext>(CanvasActionContext);
};
