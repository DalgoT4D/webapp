import { createContext, useReducer } from 'react';
import {
  NodeActionToDoReducer,
  initialNodeActionToDoState,
  NodeActionToDoInterface,
} from './reducers/FlowEditor/SelectedNodeReducer';

import React from 'react';

interface context {
  NodeActionTodo: { state: NodeActionToDoInterface; dispatch: any };
}
export const FlowEditorContext = createContext<context | null>(null);

const FlowEditorContextProvider = ({ children }: any) => {
  // NodeActionToDo reducer/logic-updater
  const [nodeActionToDo, nodeActionToDoDispatch]: [any, any] = useReducer<any>(
    NodeActionToDoReducer,
    initialNodeActionToDoState
  );

  // You can add other reducers here to have global state for different use cases with the same global context

  return (
    <FlowEditorContext.Provider
      value={{
        NodeActionTodo: {
          state: nodeActionToDo,
          dispatch: nodeActionToDoDispatch,
        },
      }}
    >
      {children}
    </FlowEditorContext.Provider>
  );
};

export default FlowEditorContextProvider;
