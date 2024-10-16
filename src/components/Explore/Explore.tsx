import { PageHead } from '@/components/PageHead';
import {
  DbtSourceModel,
  WarehouseTable,
} from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import { StatisticsPane } from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane';

import { httpGet } from '@/helpers/http';
import { Box, Dialog, Divider, IconButton, Tab, Tabs } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { Transition } from '@/components/DBT/DBTTransformType';
import { ResizableBox } from 'react-resizable';
import ProjectTree from '@/components/TransformWorkflow/FlowEditor/Components/ProjectTree';
import PreviewPane from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane';
import { NodeApi } from 'react-arborist';
import Close from '@mui/icons-material/Close';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

export const Explore = () => {
  const { data: session } = useSession();
  const [selectedTab, setSelectedTab] = useState<'preview' | 'statistics'>('preview');
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [width, setWidth] = useState(260);

  const [height, setheight] = useState(500);
  const [sourceModels, setSourcesModels] = useState<WarehouseTable[]>([]);

  const { setPreviewAction } = usePreviewAction();

  const fetchSourcesModels = () => {
    setLoading(true);
    httpGet(session, 'warehouse/sync_tables')
      .then((response: WarehouseTable[]) => {
        setSourcesModels(response);
        successToast('Tables synced with warehouse', [], globalContext);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSourcesModels();
  }, []);

  useEffect(() => {
    const dialogBox = document.querySelector('.MuiDialog-container');

    if (dialogBox) {
      const fullHeight = dialogBox?.clientHeight - 50;
      setheight(fullHeight);
    }
  }, [sourceModels]);

  const onResize = (event: any, { size }: any) => {
    setWidth(size.width);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'preview' | 'statistics') => {
    setSelectedTab(newValue);
  };

  const handleNodeClick = (nodes: NodeApi<any>[]) => {
    if (nodes.length > 0 && nodes[0].isLeaf) {
      setPreviewAction({ type: 'preview', data: nodes[0].data });
    }
  };
  return (
    <>
      <PageHead title="Dalgo" />

      <Dialog fullScreen open={dialogueOpen} TransitionComponent={Transition}>
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            overflow: 'inherit',
            position: 'relative',
          }}
        >
          <ResizableBox
            axis="x"
            width={width}
            onResize={onResize}
            minConstraints={[280, Infinity]}
            maxConstraints={[550, Infinity]}
            resizeHandles={['e']}
          >
            <ProjectTree
              dbtSourceModels={sourceModels}
              handleNodeClick={handleNodeClick}
              handleSyncClick={fetchSourcesModels}
              isSyncing={loading}
            />
          </ResizableBox>
          <Divider orientation="vertical" sx={{ color: 'black' }} />
          <Box sx={{ width: `calc(100% - ${width}px)` }}>
            <Box sx={{ height: 'unset' }}>
              <Box
                sx={{
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F5FAFA',
                  borderTop: '1px solid #CCCCCC',
                  borderBottom: '1px solid #CCCCCC',
                }}
              >
                <Tabs
                  value={selectedTab}
                  onChange={handleTabChange}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    paddingLeft: '28px',
                  }}
                >
                  <Tab label="Preview" value="preview" />

                  <Tab label="Data statistics" value="statistics" />
                </Tabs>
                <IconButton
                  sx={{ ml: 'auto' }}
                  onClick={() => {
                    setDialogueOpen(false);
                    router.push('/pipeline/ingest');
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
              <Box>
                {selectedTab === 'preview' && <PreviewPane height={height} />}

                {selectedTab === 'statistics' && <StatisticsPane height={height} />}
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};
