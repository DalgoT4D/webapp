import { Box } from '@mui/material';
import React from 'react';
import { DbtSourceModel } from '../FlowEditor';

type PreviewPaneProps = {
  dbtSourceModel: DbtSourceModel | undefined | null;
};

const PreviewPane = ({ dbtSourceModel }: PreviewPaneProps) => {
  console.log('dbtSourceModel', dbtSourceModel);
  return (
    <>
      {dbtSourceModel ? (
        <Box>previewing this {dbtSourceModel.input_name}</Box>
      ) : (
        'No model to preview'
      )}
    </>
  );
};

export default PreviewPane;
