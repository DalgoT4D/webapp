import { Box, Divider, Tab, Tabs } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/PreviewPane';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { SRC_MODEL_NODE } from './constant';

import { useDbtRunLogs } from '@/contexts/DbtRunLogsContext';

export type DbtSourceModel = {
  source_name: string;
  input_name: string;
  input_type: 'model' | 'source';
  schema: string;
  id: string;
  type: typeof SRC_MODEL_NODE;
};

const FlowEditor = ({}) => {
  const { data: session } = useSession();
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const [refreshEditor, setRefreshEditor] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const dbtRunLogs = useDbtRunLogs();

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Box
      sx={{
        overflow: 'hidden',
        flexDirection: 'column',
        height: '100vh',
        paddingTop: '3.5rem',
      }}
    >
      <Box sx={{ display: 'flex', height: '60%', overflow: 'inherit' }}>
        <Box sx={{ width: '20%' }}>
          <ProjectTree dbtSourceModels={sourcesModels} />
        </Box>
        <Divider orientation="vertical" sx={{ color: 'black' }} />
        <Box sx={{ width: '80%' }}>
          <Canvas
            redrawGraph={refreshEditor}
            setRedrawGraph={setRefreshEditor}
          />
        </Box>
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ display: 'flex', height: '4rem', alignItems: 'center' }}
        >
          <Tab label="Preview" />
          <Tab label="Logs" />
        </Tabs>
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box sx={{ height: '40%', overflow: 'auto' }}>
        {selectedTab === 0 && <PreviewPane />}
        {selectedTab === 1 && (
          <Box sx={{ padding: '1rem' }}>
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

export default FlowEditor;
