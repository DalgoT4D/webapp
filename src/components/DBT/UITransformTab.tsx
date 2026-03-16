import React, { useState } from 'react';
import { Box, Card, Typography, Button, Dialog, Slide, IconButton } from '@mui/material';
import Close from '@mui/icons-material/Close';
import Image from 'next/image';
import Logo from '@/assets/images/logo.svg';
import DBTRepositoryCard from './DBTRepositoryCard';
import CanvasPreview from '@/components/TransformWorkflow/FlowEditor/Components/CanvasPreview';
import WorkflowEditor from '@/components/Workflow/Editor';
import { TransitionProps } from '@mui/material/transitions';
import { useParentCommunication } from '@/contexts/ParentCommunicationProvider';

export const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} timeout={400} />;
});

export const TopNavBar = ({ handleClose, hideHeader = false }: any) => {
  // If header should be hidden (embedded mode), don't render anything
  if (hideHeader) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          ml: 1.8,
          height: '56px',
        }}
      >
        <Image src={Logo} alt="dalgo logo" />
      </Box>
      <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto' }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={handleClose}
          sx={{ mr: 1 }}
          aria-label="close"
        >
          <Close />
        </IconButton>
      </Box>
    </Box>
  );
};

interface UITransformTabProps {
  onGitConnected: () => void;
  gitConnected: boolean;
}

const UITransformTab: React.FC<UITransformTabProps> = ({ onGitConnected, gitConnected }) => {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const { hideHeader } = useParentCommunication();

  const handleGoToWorkflow = () => {
    setShowWorkflow(true);
  };

  const handleCloseWorkflow = () => {
    setShowWorkflow(false);
    // Increment key to force CanvasPreview to remount and refetch data
    setPreviewRefreshKey((prev) => prev + 1);
  };

  return (
    <Box>
      {/* GitHub Repository Connection Section */}
      <DBTRepositoryCard onConnectGit={onGitConnected} />

      {/* Workflow Canvas Section */}
      <Box sx={{ mb: 2 }}>
        {/* Canvas Container - matching DBT repository style */}
        <Card
          sx={{
            background: 'white',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          {/* Header with title and edit button - matching DBT repository layout */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <Typography sx={{ fontWeight: 700 }} variant="h4" color="#000">
              Workflow
            </Typography>
            <Button
              variant="contained"
              color="primary"
              data-testid="gotoworkflow"
              onClick={handleGoToWorkflow}
            >
              Edit Workflow
            </Button>
          </Box>

          {/* Canvas Content - Read-only */}
          <Box
            sx={{
              width: '100%',
              height: '400px',
              position: 'relative',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <CanvasPreview key={previewRefreshKey} />
          </Box>
        </Card>
      </Box>

      {/* Full-screen Workflow Editor Dialog */}
      <Dialog
        fullScreen
        open={showWorkflow}
        onClose={handleCloseWorkflow}
        TransitionComponent={Transition}
      >
        {/* Floating close button replaces TopNavBar for full-screen canvas */}
        {!hideHeader && (
          <IconButton
            onClick={handleCloseWorkflow}
            aria-label="close"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2000,
              backgroundColor: 'white',
              border: '1px solid #E0E0E0',
              '&:hover': {
                backgroundColor: '#F5F5F5',
              },
            }}
          >
            <Close />
          </IconButton>
        )}
        {showWorkflow && <WorkflowEditor onClose={handleCloseWorkflow} />}
      </Dialog>
    </Box>
  );
};

export default UITransformTab;
