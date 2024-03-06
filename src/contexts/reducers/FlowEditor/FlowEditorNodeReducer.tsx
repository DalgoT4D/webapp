// The reducer here will update the global state of the current selected org component

import { DbtSourceModel } from '@/components/TransformWorkflow/FlowEditor/FlowEditor';

export interface FlowEditorNodeInterface {
  node: DbtSourceModel | undefined | null;
  action: 'preview' | 'clear-preview' | 'add' | 'refresh-canvas' | null;
}

// action to add a new node to canvas or preview the node
interface Action {
  type: 'add' | 'preview' | 'clear-preview' | 'refresh-canvas';
  state: FlowEditorNodeInterface;
}

export const initialFlowEditorNodeState = {
  action: null,
  node: null,
};

export const CanvasReducer = (
  state: DbtSourceModel | undefined | null,
  updateAction: Action
) => {
  switch (updateAction?.type) {
    case 'add':
      return { node: updateAction.state.node, action: updateAction.type };
    case 'refresh-canvas':
      return { node: null, action: updateAction.type };
    default:
      return state;
  }
};

// export const ProjecTreeReducer = (
//   state: FlowEditorNodeInterface,
//   updateAction: Action
// ) => {
//   switch (updateAction?.type) {
//     case 'new':
//       return { node: updateAction.state.node, action: updateAction.type };
//     default:
//       return state;
//   }
// };

export const PreviewPaneReducer = (
  state: FlowEditorNodeInterface,
  updateAction: Action
) => {
  switch (updateAction?.type) {
    case 'preview':
    case 'clear-preview':
      return { node: updateAction.state.node, action: updateAction.type };
    default:
      return state;
  }
};
