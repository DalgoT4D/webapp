import { PageHead } from '@/components/PageHead';
import { WarehouseTable } from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import { StatisticsPane } from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane';

import { httpGet } from '@/helpers/http';
import { Box, Dialog, Divider, IconButton, Tab, Tabs } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { TopNavBar, Transition } from '@/components/DBT/DBTTransformType';
import { ResizableBox } from 'react-resizable';
import ProjectTree from '@/components/TransformWorkflow/FlowEditor/Components/ProjectTree';
import PreviewPane from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane';
import { NodeApi } from 'react-arborist';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { FeatureFlagKeys, useFeatureFlags } from '@/customHooks/useFeatureFlags';
import { Close } from '@mui/icons-material';
import { useParentCommunication } from '@/contexts/ParentCommunicationProvider';

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

  const { isFeatureFlagEnabled } = useFeatureFlags();

  const { setPreviewAction } = usePreviewAction();

  const { isEmbedded } = useParentCommunication();

  const fetchSourcesModels = () => {
    setLoading(true);
    httpGet(session, 'warehouse/sync_tables?fresh=1')
      .then((response: WarehouseTable[]) => {
        response.sort((a, b) => {
          //Comparing schemas
          if (a.schema < b.schema) return -1;
          if (a.schema > b.schema) return 1;

          // if schemas are same, then compare by the input name.
          if (a.input_name < b.input_name) return -1;
          if (a.input_name > b.input_name) return 1;

          return 0; // if input name and schema are same
        });
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
    if (session) {
      fetchSourcesModels();
    }
  }, [session]);

  useEffect(() => {
    const dialogBox = document.querySelector('.MuiDialog-container');

    if (dialogBox) {
      const fullHeight = dialogBox?.clientHeight - 100;
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
      <PageHead title="Dalgo | Explore" />
      <Dialog fullScreen open={dialogueOpen} TransitionComponent={Transition}>
        {!isEmbedded && (
          <TopNavBar
            handleClose={() => {
              setDialogueOpen(false);
              router.push('/pipeline/ingest');
            }}
          />
        )}

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
                  height: '44px',
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

                  {isFeatureFlagEnabled(FeatureFlagKeys.DATA_STATISTICS) && (
                    <Tab label="Data statistics" value="statistics" />
                  )}
                </Tabs>
                <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto' }}></Box>
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
