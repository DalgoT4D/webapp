import React, { useEffect, useState } from 'react';
import { Box, Dialog, IconButton, Slide, Tab, Tabs, Typography } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import Close from '@mui/icons-material/Close';
import PreviewPane from './LowerSectionTabs/PreviewPane';
import { LogsPane } from './LowerSectionTabs/LogsPane';
import { StatisticsPane } from './LowerSectionTabs/StatisticsPane';
import { useDbtRunLogs } from '@/contexts/DbtRunLogsContext';
import { FeatureFlagKeys, useFeatureFlags } from '@/customHooks/useFeatureFlags';

type NodeDetailTab = 'preview' | 'logs' | 'statistics';

interface NodeDetailModalProps {
  open: boolean;
  onClose: () => void;
  schema: string;
  table: string;
  nodeName: string;
  finalLockCanvas: boolean;
  initialTab?: NodeDetailTab;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} timeout={400} />;
});

const NodeDetailModal = ({
  open,
  onClose,
  schema,
  table,
  nodeName,
  finalLockCanvas,
  initialTab = 'preview',
}: NodeDetailModalProps) => {
  const [selectedTab, setSelectedTab] = useState<NodeDetailTab>(initialTab);
  const dbtRunLogs = useDbtRunLogs();
  const { isFeatureFlagEnabled } = useFeatureFlags();

  useEffect(() => {
    if (open) {
      setSelectedTab(initialTab);
    }
  }, [open, initialTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: NodeDetailTab) => {
    setSelectedTab(newValue);
  };

  return (
    <Dialog
      sx={{
        m: '74px 24px 22px 24px',
        background: '#00000000',
      }}
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: '12px',
        },
      }}
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      {/* Top Nav Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px 12px 28px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {nodeName}
          </Typography>
          {schema && table && (
            <Typography sx={{ color: '#757575', fontSize: '14px', fontWeight: 400 }}>
              {schema}.{table}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ mr: 1 }} aria-label="close">
          <Close />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: '1px solid #E0E0E0',
          px: '28px',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{
            minHeight: '40px',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              minHeight: '40px',
            },
            '& .Mui-selected': {
              color: '#00897B',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00897B',
            },
          }}
        >
          <Tab label="Data" value="preview" />
          <Tab label="Logs" value="logs" />
          {isFeatureFlagEnabled(FeatureFlagKeys.DATA_STATISTICS) && (
            <Tab label="Statistics" value="statistics" />
          )}
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ p: '0px 28px', flex: 1, overflow: 'auto' }}>
        <Box sx={{ height: 'calc(100vh - 210px)', overflow: 'auto' }}>
          {selectedTab === 'preview' && (
            <PreviewPane height={window.innerHeight - 250} schema={schema} table={table} />
          )}
          {selectedTab === 'logs' && (
            <LogsPane
              height={window.innerHeight - 250}
              dbtRunLogs={dbtRunLogs}
              finalLockCanvas={finalLockCanvas}
            />
          )}
          {selectedTab === 'statistics' && (
            <StatisticsPane height={window.innerHeight - 250} schema={schema} table={table} />
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default NodeDetailModal;
