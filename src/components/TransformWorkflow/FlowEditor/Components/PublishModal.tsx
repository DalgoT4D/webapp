import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  onPublishSuccess?: () => void;
}

interface GitStatusSummary {
  added: string[];
  modified: string[];
  deleted: string[];
}

const PublishModal: React.FC<PublishModalProps> = ({ open, onClose, onPublishSuccess }) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [commitMessage, setCommitMessage] = useState('');
  const [gitStatus, setGitStatus] = useState<GitStatusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Fetch git status when modal opens
  useEffect(() => {
    if (open && session) {
      fetchGitStatus();
    }
  }, [open, session]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCommitMessage('');
      setGitStatus(null);
      setLoading(false);
      setPublishing(false);
    }
  }, [open]);

  const fetchGitStatus = async () => {
    setLoading(true);
    try {
      const response = await httpGet(session, 'dbt/git_status/');
      console.log('Git status response:', response);
      setGitStatus(response);
    } catch (error: any) {
      console.error('Error fetching git status:', error);
      errorToast('Failed to load git status', [], globalContext);
      setGitStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!commitMessage.trim()) {
      errorToast('Commit message is required', [], globalContext);
      return;
    }

    setPublishing(true);
    try {
      const response = await httpPost(session, 'dbt/publish_changes/', {
        commit_message: commitMessage.trim(),
      });

      if (response.success) {
        successToast('Changes published successfully', [], globalContext);
        onPublishSuccess?.();
        onClose();
      } else {
        errorToast(response.message || 'Failed to publish changes', [], globalContext);
      }
    } catch (error: any) {
      console.error('Error publishing changes:', error);
      errorToast(error.message || 'Failed to publish changes', [], globalContext);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          Publish Changes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review your changes and provide a commit message to publish to git
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Changes to be published:
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">Loading git status...</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 2,
                minHeight: 100,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {gitStatus ? (
                <Box>
                  {gitStatus.added.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 0.5 }}
                      >
                        Added ({gitStatus.added.length})
                      </Typography>
                      {gitStatus.added.map((file, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: '#2e7d32',
                            pl: 1,
                          }}
                        >
                          + {file}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {gitStatus.modified.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: '#f57f17', mb: 0.5 }}
                      >
                        Modified ({gitStatus.modified.length})
                      </Typography>
                      {gitStatus.modified.map((file, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: '#f57f17',
                            pl: 1,
                          }}
                        >
                          ~ {file}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {gitStatus.deleted.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 0.5 }}
                      >
                        Deleted ({gitStatus.deleted.length})
                      </Typography>
                      {gitStatus.deleted.map((file, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            color: '#d32f2f',
                            pl: 1,
                          }}
                        >
                          - {file}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {gitStatus.added.length === 0 &&
                    gitStatus.modified.length === 0 &&
                    gitStatus.deleted.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                      >
                        No changes to publish
                      </Typography>
                    )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No changes to publish
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Commit message: <span style={{ color: '#d32f2f' }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter a descriptive commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            disabled={publishing}
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={publishing} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handlePublish}
          disabled={!commitMessage.trim() || publishing}
          sx={{
            backgroundColor: '#00897B',
            '&:hover': {
              backgroundColor: '#00695C',
            },
          }}
        >
          {publishing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Publishing...
            </>
          ) : (
            'Publish Changes'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishModal;
