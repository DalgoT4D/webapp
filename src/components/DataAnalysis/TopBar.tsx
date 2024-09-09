import { Box, Button, Typography } from '@mui/material';
import InfoTooltip from '../UI/Tooltip/Tooltip';
export const TopBar = ({ handleOpenSavedSession, handleNewSession }: any) => {
  return (
    <>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: '0.2rem',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#0F2440',
            fontWeight: 600,
            fontSize: '20px',
          }}
        >
          Parameters
          <InfoTooltip title="Parameters" />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Button
              variant="outlined"
              id="create-new-button"
              sx={{ width: '100%', height: '2rem' }}
              onClick={handleOpenSavedSession}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
                Saved Sessions
              </Typography>
            </Button>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Button
              variant="contained"
              id="create-new-button"
              sx={{ width: '100%', height: '2rem' }}
              onClick={handleNewSession}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>
                + New
              </Typography>
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};
