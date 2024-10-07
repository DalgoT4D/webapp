import { Box, Button, Typography } from '@mui/material';
import InfoTooltip from '../UI/Tooltip/Tooltip';
import Folder from '@mui/icons-material/Folder';
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
          <InfoTooltip
            title={
              <div>
                <Typography variant="body2" gutterBottom>
                  Provide the required parameters:
                </Typography>
                <Typography variant="body2">
                  1. Enter the SQL query to access data stored in your warehouse.
                </Typography>
                <Typography variant="body2">
                  2. Select/enter a prompt to generate AI enabled insights on your data.
                </Typography>
              </div>
            }
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{}}>
            <Button
              variant="contained"
              id="create-new-button"
              sx={{
                width: '100%',
                height: '2rem',
                gap: '.5rem',
                padding: '0.4rem',
                backgroundColor: '#F5FAFA',
                color: '#00897B',
                '&:hover': {
                  backgroundColor: '#00897B',
                  color: '#FFFFFF',
                },
              }}
              onClick={handleOpenSavedSession}
            >
              <Folder />
              <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>Saved Sessions</Typography>
            </Button>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Button
              variant="contained"
              id="create-new-button"
              sx={{ width: '100%', height: '2rem' }}
              onClick={() => {
                handleNewSession();
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>+ New</Typography>
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};
