import { PageHead } from '@/components/PageHead';
import { StatisticsPane } from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane';

import { httpGet } from '@/helpers/http';
import { Box, Dialog, Divider, Tab, Tabs } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { TopNavBar, Transition } from '@/components/DBT/UITransformTab';
import { ResizableBox } from 'react-resizable';
import ProjectTree from '@/components/TransformWorkflow/FlowEditor/Components/ProjectTree';
import PreviewPane from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane';
import { NodeApi } from 'react-arborist';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import { successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { FeatureFlagKeys, useFeatureFlags } from '@/customHooks/useFeatureFlags';
import { useParentCommunication } from '@/contexts/ParentCommunicationProvider';
import { DbtModelResponse } from '@/types/transform-v2.types';

interface WarehouseTable {
  id: string;
  name: string;
  schema: string;
  type: 'source' | 'model';
}

export const Explore = () => {
  const { data: session } = useSession();
  const [selectedTab, setSelectedTab] = useState<'preview' | 'statistics'>('preview');
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [width, setWidth] = useState(260);

  const [height, setheight] = useState(500);
  const [sourceModels, setSourcesModels] = useState<DbtModelResponse[]>([]);

  const { isFeatureFlagEnabled } = useFeatureFlags();

  const { setPreviewAction } = usePreviewAction();

  const { isEmbedded } = useParentCommunication();

  const fetchSourcesModels = () => {
    setLoading(true);
    httpGet(session, 'warehouse/sync_tables?fresh=1')
      .then((response: any[]) => {
        // Normalize every record to ensure fields expected by ProjectTree/Canvas exist
        const normalized: DbtModelResponse[] = (response || []).map((r: WarehouseTable) => ({
          id: r.id,
          name: r.name,
          schema: r.schema,
          type: r.type,
          display_name: r.name,
          source_name: r.name,
          sql_path: '',
          output_cols: [],
          uuid: r.id,
        }));

        normalized.sort((a, b) => {
          // Compare schemas
          if ((a.schema ?? '') < (b.schema ?? '')) return -1;
          if ((a.schema ?? '') > (b.schema ?? '')) return 1;

          // if schemas are same, then compare by the table/name
          if ((a.name ?? '') < (b.name ?? '')) return -1;
          if ((a.name ?? '') > (b.name ?? '')) return 1;

          return 0;
        });

        setSourcesModels(normalized);
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
      setPreviewAction({
        type: 'preview',
        data: { schema: nodes[0].data.schema, table: nodes[0].data.name },
      });
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
              included_in="explore"
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
