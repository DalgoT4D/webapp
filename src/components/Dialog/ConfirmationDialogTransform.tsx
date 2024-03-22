import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { TransformType } from '@/pages/pipeline/transform';

interface ConfirmationDialogProps {
  open: boolean;
  handleClose: () => void;
  transformType: TransformType | null;
}

const ConfirmationDialogTransform: React.FC<ConfirmationDialogProps> = ({
  open,
  handleClose,
  transformType,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleConfirm = async () => {
    try {
      if (transformType === 'ui') {
        router.push('/pipeline/dbtsetup?transform_type=ui');
      } else if (transformType === 'github') {
        router.push('/pipeline/dbtsetup?transform_type=github');
      }
      handleClose();
    } catch (error) {
      console.error('Error occurred while setting up:', error);
    }
  };

  useEffect(() => {
    const fetchTransformType = async () => {
      try {
        const res = await httpGet(session, 'dbt/dbt_transform/');
        const { transform_type } = await res;
        console.log(transform_type);
      } catch (error) {
        console.error(error);
      }
    };

    if (open) {
      fetchTransformType();
    }
  }, [open, session]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs">
      <DialogTitle sx={{ fontSize: '25px', marginBottom: '-10px' }}>
        <strong>Confirmation</strong>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Please read before you continue.
        </Typography>
      </DialogContent>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{
            bgcolor: '#00000026',
            p: 1,
            borderRadius: 1,
            fontSize: 16,
            marginBottom: '8px',
          }}
        >
          You have opted to continue using the{' '}
          <strong>{transformType === 'ui' ? 'UI' : 'GitHub'} method</strong> to
          set up your transformation
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ marginBottom: '8px' }}
        >
          <strong>Note:</strong> Once a method is selected, you cannot change
          it.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button
          onClick={handleConfirm}
          autoFocus
          sx={{
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            width: '90%',
            '&:hover': {
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.6)',
            },
          }}
        >
          Continue with {transformType === 'ui' ? 'UI' : 'GitHub'} Method
        </Button>
      </DialogActions>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ color: 'rgba(0,0,0,0.6)', width: '90%' }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialogTransform;
