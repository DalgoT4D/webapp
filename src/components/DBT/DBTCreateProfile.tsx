import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import { Close } from '@mui/icons-material';

interface DBTCreateProfileProps {
  createdProfile: (...args: any) => any;
  showDialog: boolean;
  setShowDialog: (...args: any) => any;
}

export const DBTCreateProfile = ({
  createdProfile,
  showDialog,
  setShowDialog,
}: DBTCreateProfileProps) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', target_configs_schema: '' },
  });
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [running, setRunning] = useState(false);

  type Profile = {
    name: string;
    target_configs_schema: string;
  };

  const createDbtProfile = async function (profile: Profile) {
    setRunning(true);

    try {
      const message = await httpPost(session, `prefect/blocks/dbt/`, {
        profile,
      });
      if (message.success) {
        successToast('Dbt profile added successfully', [], toastContext);
        createdProfile();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }

    setRunning(false);
  };

  const handleClose = () => {
    reset();
    setShowDialog(false);
  };

  return (
    <>
      <Dialog open={showDialog} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1}>Add dbt profile</Box>
            <Box>
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          <i>From your dbt_project.yml</i>
        </DialogTitle>
        <form onSubmit={handleSubmit(createDbtProfile)}>
          <DialogContent sx={{ minWidth: '400px' }}>
            <Box className={styles.Input}>
              <TextField
                sx={{ width: '100%' }}
                data-testid="target-schema"
                label="Profile name from dbt_project.yml"
                variant="outlined"
                {...register('name', { required: true })}
              />
            </Box>
            <Box className={styles.Input}>
              <TextField
                sx={{ width: '100%' }}
                data-testid="target-schema"
                label="Target schema in warehouse"
                variant="outlined"
                {...register('target_configs_schema')}
              />
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}
          >
            <Button
              variant="contained"
              type="submit"
              data-testid="save-profile"
            >
              Save
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancel"
            >
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
