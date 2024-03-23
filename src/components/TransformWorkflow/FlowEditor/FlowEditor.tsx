import {
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
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
  changeLowerSectionTabTo: (value: LowerSectionTabValues) => void;
};

const UpperSection = ({
  sourcesModels,
  refreshEditor,
  setRefreshEditor,
  changeLowerSectionTabTo,
}: UpperSectionProps) => {
  const [width, setWidth] = useState(260);
  const [lockUpperSection, setLockUpperSection] = useState<boolean>(false);

  const onResize = (event: any, { node, size, handle }: any) => {
    setWidth(size.width);
  };
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        overflow: 'inherit',
        position: 'relative',
      }}
    >
      <Backdrop
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          position: 'absolute', // Position the Backdrop over the Box
          top: 0,
          left: 0,
          right: 0,
          bottom: 0, // Cover the entire Box
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={lockUpperSection}
        onClick={() => {}}
      >
        <CircularProgress
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />
      </Backdrop>

      <ResizableBox
        axis="x"
        width={width}
        onResize={onResize}
        minConstraints={[280, Infinity]}
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
            setLockUpperSection={setLockUpperSection}
            changeLowerSectionTabTo={changeLowerSectionTabTo}
          />
        </ReactFlowProvider>
      </Box>
    </Box>
  );
};

export type LowerSectionTabValues = 'preview' | 'logs';

type LowerSectionProps = {
  selectedTab: LowerSectionTabValues;
  setSelectedTab: (value: LowerSectionTabValues) => void;
};

const LowerSection = ({ selectedTab, setSelectedTab }: LowerSectionProps) => {
  const dbtRunLogs = useDbtRunLogs();
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: LowerSectionTabValues
  ) => {
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
          <Tab label="Preview" value="preview" />
          <Tab label="Logs" value="logs" />
        </Tabs>
      </Box>
      <Box height={'calc(100% - 50px)'} sx={{ overflow: 'auto' }}>
        {selectedTab === 'preview' && <PreviewPane />}
        {selectedTab === 'logs' && (
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
  const [selectedTab, setSelectedTab] =
    useState<LowerSectionTabValues>('preview');

  const onResize = (_event: any, { size }: any) => {
    setLowerSectionHeight(size.height);
  };
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
    if (session) fetchSourcesModels();
  }, [session, refreshEditor]);

  return (
    <Box
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
      }}
    >
      <UpperSection
        setRefreshEditor={setRefreshEditor}
        sourcesModels={sourcesModels}
        refreshEditor={refreshEditor}
        changeLowerSectionTabTo={setSelectedTab}
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
        <LowerSection
          setSelectedTab={setSelectedTab}
          selectedTab={selectedTab}
        />
      </ResizableBox>
    </Box>
  );
};

export default FlowEditor;
