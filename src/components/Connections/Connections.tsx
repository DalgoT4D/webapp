import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { backendUrl } from '@/config/constant';
import { Close } from '@mui/icons-material';

function createData(name: string, sourceDest: string, lastSync: string) {
  return [name, sourceDest, lastSync];
}

const fakeRows: Array<Array<string>> = [
  createData('Connection 1', 'SWS -> PED', '28th March 2020'),
];

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
        element.lastSync,
      ]);
      setRows(rows);
    } else {
      setRows(fakeRows);
    }
  }, [data]);

  if (isLoading) {
    return <CircularProgress />;
  }

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  const sources = [{ label: 'Survey CTO' }];

  return (
    <>
      <Dialog open={showDialog} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1}> Add a new connection</Box>
            <Box>
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minWidth: '400px' }}>
          <Autocomplete
            disablePortal
            id="combo-box-demo"
            options={sources}
            renderInput={(params) => (
              <TextField {...params} label="Select source" variant="outlined" />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}>
          <Button variant="contained" onClick={handleClose}>
            Connect
          </Button>
          <Button color="secondary" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <List
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
