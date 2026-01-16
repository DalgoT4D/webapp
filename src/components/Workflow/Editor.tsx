import 'react';
import { PageHead } from '@/components/PageHead';
import styles from '@/styles/Home.module.css';
import FlowEditor from '@/components/TransformWorkflow/FlowEditor/FlowEditor';
import { DbtRunLogsProvider } from '@/contexts/DbtRunLogsContext';
import { CanvasActionProvider, CanvasNodeProvider } from '@/contexts/FlowEditorCanvasContext';
import { PreviewActionProvider } from '@/contexts/FlowEditorPreviewContext';

interface WorkflowEditorProps {
  onClose?: () => void;
}

export default function WorkflowEditor({ onClose }: WorkflowEditorProps = {}) {
  return (
    <>
      <PageHead title="Dalgo | FlowEditor" />
      <main className={styles.floweditor}>
        <CanvasNodeProvider>
          <CanvasActionProvider>
            <PreviewActionProvider>
              <DbtRunLogsProvider>
                <FlowEditor onClose={onClose} />
              </DbtRunLogsProvider>
            </PreviewActionProvider>
          </CanvasActionProvider>
        </CanvasNodeProvider>
      </main>
    </>
  );
}
