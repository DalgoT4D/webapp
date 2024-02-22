import { createContext, useReducer } from 'react';
import {
  CanvasReducer,
  PreviewPaneReducer,
  initialFlowEditorNodeState,
  FlowEditorNodeInterface,
} from './reducers/FlowEditor/FlowEditorNodeReducer';

import React from 'react';

interface context {
  previewNode: { state: FlowEditorNodeInterface; dispatch: any };
  canvasNode: { state: FlowEditorNodeInterface; dispatch: any };
}
export const FlowEditorContext = createContext<context | null>(null);

const FlowEditorContextProvider = ({ children }: any) => {
  // Canvas node state & reducer/logic-updater
  const [canvasNode, canvasNodeDispatch]: [any, any] = useReducer<any>(
    CanvasReducer,
    initialFlowEditorNodeState
  );

  // Preview node state & reducer/logic-updater
  const [previewNode, previewNodeDispatch]: [any, any] = useReducer<any>(
    PreviewPaneReducer,
    initialFlowEditorNodeState
  );

  // You can add other reducers here to have global state for different use cases with the same global context

  return (
    <FlowEditorContext.Provider
      value={{
        previewNode: {
          state: previewNode,
          dispatch: previewNodeDispatch,
        },
        canvasNode: {
          state: canvasNode,
          dispatch: canvasNodeDispatch,
        },
      }}
    >
      {children}
    </FlowEditorContext.Provider>
  );
};

export default FlowEditorContextProvider;
