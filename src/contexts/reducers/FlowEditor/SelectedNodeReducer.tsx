// The reducer here will update the global state of the current selected org component

import { DbtSourceModel } from '@/components/TransformWorkflow/FlowEditor/FlowEditor';

export interface NodeActionToDoInterface {
  toDo: 'new' | 'preview' | 'clear-preview' | 'clear' | null;
  node: DbtSourceModel | undefined | null;
}

// action to add a new node to canvas or preview the node
interface Action {
  type: 'new' | 'preview' | 'clear-preview' | 'clear';
  actionState: NodeActionToDoInterface;
}

export const initialNodeActionToDoState = {
  action: '',
  node: null,
};

export const NodeActionToDoReducer = (
  state: NodeActionToDoInterface,
  updateAction: Action
) => {
  switch (updateAction?.type) {
    case 'preview':
    case 'clear-preview':
    case 'new':
      return { node: updateAction.actionState.node, toDo: updateAction.type };
    case 'clear':
      return { node: null, toDo: null };
    default:
      return { node: state.node, toDo: null };
  }
};
