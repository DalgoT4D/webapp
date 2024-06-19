import { Box, Dialog, IconButton, Typography } from '@mui/material';
import { Transition } from '../DBT/DBTTransformType';
import Close from '@mui/icons-material/Close';

const TopNavBar = ({ handleClose }: any) => (
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
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Connection History
      </Typography>
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

interface ConnectionLogsProps {
  setShowLogsDialog: (value: boolean) => any;
}

export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  setShowLogsDialog,
}) => {
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
      open
      TransitionComponent={Transition}
    >
      <TopNavBar handleClose={() => setShowLogsDialog(false)} />
      hey
    </Dialog>
  );
};
