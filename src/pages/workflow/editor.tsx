import 'react';
import { PageHead } from '@/components/PageHead';
import styles from '@/styles/Home.module.css';
import FlowEditor from '@/components/TransformWorkflow/FlowEditor/FlowEditor';
import FlowEditorContextProvider from '@/contexts/FlowEditorContext';
import { DbtRunLogsProvider } from '@/contexts/DbtRunLogsContext';
export default function WorkflowEditor() {
  return (
    <>
      <PageHead title="FlowEditors" />
      <main className={styles.floweditor}>
        <FlowEditorContextProvider>
          <DbtRunLogsProvider>
            <FlowEditor />
          </DbtRunLogsProvider>
        </FlowEditorContextProvider>
      </main>
    </>
  );
}
