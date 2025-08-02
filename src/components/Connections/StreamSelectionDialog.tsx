// Updated StreamSelectionDialog.tsx with Switch toggles
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast } from '../ToastMessage/ToastHelper';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';

interface StreamData {
  streamName: string;
  selected: boolean;
}

interface StreamSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedStreams: Array<string>, selectAll: boolean) => void;
  connectionId: string;
}

export const StreamSelectionDialog: React.FC<StreamSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  connectionId,
}) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [connectionName, setConnectionName] = useState('');

  useEffect(() => {
    if (open && connectionId && session) {
      fetchStreams();
    }
  }, [open, connectionId, session]);

  const fetchStreams = async () => {
    setLoading(true);
    try {
      const response = await httpGet(session, `airbyte/v1/connections/${connectionId}`);
      if (response?.syncCatalog?.streams) {
        const availableStreams = response.syncCatalog.streams
          .filter((stream: any) => stream?.config?.selected)
          .map((stream: any) => ({
            streamName: stream.stream.name,
            selected: false, // Default to false for all streams
          }));
        setStreams(availableStreams);
      }
      setConnectionName(response?.name || 'Unknown Connection');
    } catch (error) {
      console.error('Error fetching streams:', error);
      errorToast('Failed to fetch streams. Please try again later.', [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamToggle = (streamName: string) => {
    const updatedStreams = streams.map((stream) =>
      stream.streamName === streamName ? { ...stream, selected: !stream.selected } : stream
    );

    setStreams(updatedStreams);

    // Update select all state
    const selectedCount = updatedStreams.filter((stream) => stream.selected).length;
    setSelectAll(selectedCount === updatedStreams.length);
  };

  const handleSelectAll = (checked: boolean) => {
    const updatedStreams = streams.map((stream) => ({
      ...stream,
      selected: checked,
    }));

    setStreams(updatedStreams);
    setSelectAll(checked);
  };

  const handleConfirm = () => {
    const selectedStreamNames = streams
      .filter((stream) => stream.selected)
      .map((stream) => stream.streamName);

    console.log('Selected Streams:', selectedStreamNames);

    if (selectedStreamNames.length === streams.length) onConfirm(selectedStreamNames, true);
    else onConfirm(selectedStreamNames, false);
  };

  const handleClose = () => {
    const resetStreams = streams.map((stream) => ({
      ...stream,
      selected: false,
    }));
    setStreams(resetStreams);
    setSelectAll(false);
    onClose();
  };

  const selectedCount = streams.filter((stream) => stream.selected).length;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Clear Streams from {connectionName}</DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the streams you want to clear. This will remove all data for the selected
              streams in the destination.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={selectAll}
                    onChange={(event) => handleSelectAll(event.target.checked)}
                  />
                }
                label="Select All"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <List dense>
              {streams.map((stream) => (
                <ListItem
                  key={stream.streamName}
                  sx={{
                    pl: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <ListItemText
                    primary={stream.streamName}
                    sx={
                      stream.selected
                        ? {
                            color: 'green',
                            fontWeight: 700,
                            '& .MuiListItemText-primary': {
                              fontWeight: 700,
                            },
                          }
                        : {}
                    }
                  />
                  <Switch
                    checked={stream.selected}
                    onChange={() => handleStreamToggle(stream.streamName)}
                    data-testid={`stream-toggle-${stream.streamName}`}
                  />
                </ListItem>
              ))}
            </List>

            {streams.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No streams found in this connection.
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button color="secondary" variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedCount === 0 || loading}
        >
          Clear Selected Streams ({selectedCount})
        </Button>
      </DialogActions>
    </Dialog>
  );
};
