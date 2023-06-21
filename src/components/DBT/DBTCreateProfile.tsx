import { Box, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import CustomDialog from '../Dialog/CustomDialog';
import Input from '../UI/Input/Input';

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

  const AddDbtProfileForm = () => {
    return (
      <>
        <Box>
          <Input
            sx={{ width: '100%' }}
            data-testid="profilename"
            label="Profile name from dbt_project.yml"
            variant="outlined"
            register={register}
            name="name"
            required
          />
        </Box>
        <Box sx={{ m: 2 }} />
        <Box>
          <Input
            sx={{ width: '100%' }}
            data-testid="targetschema"
            label="Target schema in warehouse"
            variant="outlined"
            register={register}
            name="target_configs_schema"
          />
        </Box>
      </>
    );
  };

  return (
    <>
      <CustomDialog
        data-testid="dialog"
        title={'Add dbt profile'}
        show={showDialog}
        handleClose={handleClose}
        handleSubmit={handleSubmit(createDbtProfile)}
        formContent={<AddDbtProfileForm />}
        formActions={
          <>
            <Button variant="contained" type="submit" data-testid="savebutton">
              Save
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancelbutton"
            >
              Cancel
            </Button>
          </>
        }
        loading={running}
      ></CustomDialog>
    </>
  );
};
