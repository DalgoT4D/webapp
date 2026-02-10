import React, { useState } from 'react';
import { Box, Dialog, DialogContent, IconButton, Tab, Tabs, Typography } from '@mui/material';
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

const MODAL_CONTENT_HEIGHT = 500;

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: NodeDetailTab) => {
    setSelectedTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: '80vh' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #E0E0E0',
          background: '#F5FAFA',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>
          {nodeName}
          <Typography
            component="span"
            sx={{ color: '#757575', fontSize: '13px', ml: 1, fontWeight: 400 }}
          >
            {schema}.{table}
          </Typography>
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Box
        sx={{
          borderBottom: '1px solid #E0E0E0',
          background: '#F5FAFA',
        }}
      >
        <Tabs value={selectedTab} onChange={handleTabChange} sx={{ px: 2, minHeight: '40px' }}>
          <Tab label="Preview" value="preview" sx={{ minHeight: '40px' }} />
          <Tab label="Logs" value="logs" sx={{ minHeight: '40px' }} />
          {isFeatureFlagEnabled(FeatureFlagKeys.DATA_STATISTICS) && (
            <Tab label="Data Statistics" value="statistics" sx={{ minHeight: '40px' }} />
          )}
        </Tabs>
      </Box>

      <DialogContent sx={{ padding: 0, overflow: 'auto' }}>
        {selectedTab === 'preview' && (
          <PreviewPane height={MODAL_CONTENT_HEIGHT} schema={schema} table={table} />
        )}
        {selectedTab === 'logs' && (
          <LogsPane
            height={MODAL_CONTENT_HEIGHT}
            dbtRunLogs={dbtRunLogs}
            finalLockCanvas={finalLockCanvas}
          />
        )}
        {selectedTab === 'statistics' && (
          <StatisticsPane height={MODAL_CONTENT_HEIGHT} schema={schema} table={table} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NodeDetailModal;
