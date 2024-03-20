import { Box, Divider, Tab, Tabs } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/PreviewPane';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { SRC_MODEL_NODE } from './constant';
import { DbtSourceModel } from './Components/Canvas';
import { useDbtRunLogs } from '@/contexts/DbtRunLogsContext';
import { ReactFlowProvider } from 'reactflow';
import { ResizableBox } from 'react-resizable';

type UpperSectionProps = {
  sourcesModels: DbtSourceModel[];
  refreshEditor: boolean;
  setRefreshEditor: any;
};

const UpperSection = ({
  sourcesModels,
  refreshEditor,
  setRefreshEditor,
}: UpperSectionProps) => {
  const [width, setWidth] = useState(260);

  const onResize = (event: any, { node, size, handle }: any) => {
    setWidth(size.width);
  };
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        overflow: 'inherit',
        marginTop: '3.5rem',
      }}
    >
      <ResizableBox
        axis="x"
        width={width}
        onResize={onResize}
        minConstraints={[260, Infinity]}
        maxConstraints={[550, Infinity]}
        resizeHandles={['e']}
      >
        <ProjectTree dbtSourceModels={sourcesModels} />
      </ResizableBox>
      <Divider orientation="vertical" sx={{ color: 'black' }} />
      <Box sx={{ width: '100%' }}>
        <ReactFlowProvider>
          <Canvas
            redrawGraph={refreshEditor}
            setRedrawGraph={setRefreshEditor}
          />
        </ReactFlowProvider>
      </Box>
    </Box>
  );
};

const LowerSection = () => {
  const dbtRunLogs = useDbtRunLogs();
  const [selectedTab, setSelectedTab] = useState(0);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  return (
    <Box height={'100%'}>
      <Box
        sx={{
          height: '50px',
          background: '#F8F8F8',
          borderTop: '1px solid #CCCCCC',
          borderBottom: '1px solid #CCCCCC',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ display: 'flex', alignItems: 'center', height: '100%' }}
        >
          <Tab label="Preview" />
          <Tab label="Logs" />
        </Tabs>
      </Box>
      <Box height={'100%'}>
        {selectedTab === 0 && <PreviewPane />}
        {selectedTab === 1 && (
          <Box height={'100%'} sx={{ padding: '1rem' }}>
            {dbtRunLogs.length > 0 ? (
              dbtRunLogs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ fontWeight: 700, minWidth: '25%' }}>
                    {new Date(log.timestamp).toTimeString()}
                  </Box>
                  <Box sx={{ color: 'blue', textAlign: 'left', width: '100%' }}>
                    {log.message}
                  </Box>
                </Box>
              ))
            ) : (
              <Box>No logs available</Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
const FlowEditor = ({}) => {
  const { data: session } = useSession();
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const [refreshEditor, setRefreshEditor] = useState<boolean>(false);
  const [lowerSectionHeight, setLowerSectionHeight] = useState(300);

  const onResize = (event: any, { node, size, handle }: any) => {
    setLowerSectionHeight(size.height);
  };
  const fetchSourcesModels = async () => {
    try {
      const response: DbtSourceModel[] = await httpGet(
        session,
        'transform/dbt_project/sources_models/'
      );
      setSourcesModels(response);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (session) fetchSourcesModels();
  }, [session, refreshEditor]);

  return (
    <Box
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <UpperSection
        setRefreshEditor={setRefreshEditor}
        sourcesModels={sourcesModels}
        refreshEditor={refreshEditor}
      />

      <ResizableBox
        axis="y"
        resizeHandles={['n']}
        width={Infinity}
        height={lowerSectionHeight}
        onResize={onResize}
        minConstraints={[Infinity, 100]}
        maxConstraints={[Infinity, 500]}
      >
        <LowerSection />
      </ResizableBox>
    </Box>
  );
};

export default FlowEditor;
