import { PageHead } from '@/components/PageHead';
import { DbtSourceModel } from '@/components/TransformWorkflow/FlowEditor/Components/Canvas';
import { StatisticsPane } from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane';

import { httpGet } from '@/helpers/http';
import { Box, Dialog, Divider, IconButton, Tab, Tabs } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Transition } from '@/components/DBT/DBTTransformType';
import { ResizableBox } from 'react-resizable';
import ProjectTree from '@/components/TransformWorkflow/FlowEditor/Components/ProjectTree';
import PreviewPane from '@/components/TransformWorkflow/FlowEditor/Components/LowerSectionTabs/PreviewPane';
import { NodeApi } from 'react-arborist';
import Close from '@mui/icons-material/Close';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';

export const Explore = () => {
  const { data: session } = useSession();
  const [selectedTab, setSelectedTab] = useState<'preview' | 'statistics'>('preview');
  const router = useRouter();

  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [width, setWidth] = useState(260);

  const [height, setheight] = useState(500);
  const [sourceModels, setSourcesModels] = useState<DbtSourceModel[]>([]);

  const { setPreviewAction } = usePreviewAction();

  const fetchSourcesModels = () => {
    httpGet(session, 'transform/dbt_project/sources_models/')
      .then((response: DbtSourceModel[]) => {
        setSourcesModels(response);
      })
      .catch((error) => {
        console.log(error);
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
            <ProjectTree dbtSourceModels={sourceModels} handleNodeClick={handleNodeClick} />
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
                  sx={{ display: 'flex', alignItems: 'center', height: '100%' }}
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
