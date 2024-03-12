import {
  OperationNodeType,
  SrcModelNodeType,
} from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import React, { useState, useContext, Dispatch, SetStateAction } from 'react';

///////////////////////////// Preview Action ////////////////////////////////

interface Action {
  type: 'preview' | 'clear-preview' | '' | undefined | null;
  data: any;
}

interface PreviewActionContext {
  previewAction: Action;
  setPreviewAction: Dispatch<SetStateAction<Action>>;
}

const PreviewActionContext = React.createContext<PreviewActionContext>({
  previewAction: { type: '', data: null },
  setPreviewAction: () => {},
});

export const PreviewActionProvider = ({ children }: any) => {
  const [previewAction, setPreviewAction] = useState<Action>({
    type: '',
    data: null,
  });

  return (
    <PreviewActionContext.Provider value={{ previewAction, setPreviewAction }}>
      {children}
    </PreviewActionContext.Provider>
  );
};

export const usePreviewAction = () => {
  return useContext<PreviewActionContext>(PreviewActionContext);
};
