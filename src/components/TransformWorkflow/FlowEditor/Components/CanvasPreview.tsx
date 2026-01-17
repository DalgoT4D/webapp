import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from './Canvas';

const CanvasPreview: React.FC = () => {
  return (
    <ReactFlowProvider>
      <Canvas
        redrawGraph={false}
        setRedrawGraph={() => {}}
        finalLockCanvas={false}
        setTempLockCanvas={() => {}}
        isPreviewMode={true}
      />
    </ReactFlowProvider>
  );
};

export default CanvasPreview;
