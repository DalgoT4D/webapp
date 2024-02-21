import React from 'react';
import { PageHead } from '@/components/PageHead';
import styles from '@/styles/Home.module.css';
import { Box, Button } from '@mui/material';
import FlowEditor from '@/components/TransformWorkflow/FlowEditor/FlowEditor';

export default function WorkflowEditor() {
  return (
    <>
      <PageHead title="FlowEditors" />
      <main className={styles.floweditor}>
        <FlowEditor />
      </main>
    </>
  );
}
