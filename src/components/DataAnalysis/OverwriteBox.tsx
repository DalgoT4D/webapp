import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  DialogActions,
} from '@mui/material';
import CustomDialog from '../Dialog/CustomDialog';
import { useForm, Controller } from 'react-hook-form';

// Define the form data type
interface FormData {
  sessionName: string;
}

export const OverWriteDialog = ({
  open,
  setIsBoxOpen,
  modalName,
  onSubmit,
  onConfirmNavigation,
  setModalName,
}: {
  open: boolean;
  modalName: string;
  onSubmit: any;
  onConfirmNavigation: any;
  setModalName: any;
  setIsBoxOpen: (a: boolean) => void;
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: {
      sessionName: '',
    },
  });

  const handleClose = () => {
    reset();
    setIsBoxOpen(false);
  };

  const ModalData: any = {
    SAVE: {
      mainheading: 'Save as',
      subHeading:
        'Please name the configuration before saving it in the warehouse',
      buttons: [
        {
          label: 'Save',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleSubmit((data) => onSubmit(data, false)), // Use handleSubmit from react-hook-form
        },
        {
          label: 'Cancel',
          variant: 'outlined',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleClose,
        },
      ],
    },
    OVERWRITE: {
      mainheading: 'Overwrite existing session',
      subHeading:
        'The session with this name already exists. Do you want to overwrite?',
      buttons: [
        {
          label: 'Overwrite',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleSubmit((data) => onSubmit(data, true)), // Handle form submission
        },
        {
          label: 'Save as new',
          variant: 'outlined',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleSubmit((data) => onSubmit(data, false)), // Use handleSubmit from react-hook-form
        },
        {
          label: 'Cancel',
          variant: 'outlined',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleClose,
        },
      ],
    },
    CONFIRM_SAVEAS: {
      mainheading: 'Confirm save as',
      subHeading:
        'Please rename the configuration before saving it in the warehouse',
      buttons: [
        {
          label: 'Save',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleSubmit((data) => onSubmit(data, false)), // Use handleSubmit from react-hook-form
        },
        {
          label: 'Cancel',
          variant: 'outlined',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: handleClose,
        },
      ],
    },
    FEEDBACK_FORM: {
      mainheading: 'Provide additional feedback',
      subHeading: 'Tell us why this response was unsatisfactory',
      rowsNum: 5,
      label: 'Feedback',
      buttons: [
        {
          label: 'Submit',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {},
        },
      ],
    },
    UNSAVED_CHANGES: {
      mainheading: 'Unsaved changes',
      subHeading:
        'You are about to leave this page without saving the changes.\nAll the changes that were made will be lost. Do you wish to continue?',
      // rowsNum: 5,
      label: 'Unsaved changes',
      buttons: [
        {
          label: 'Save changes',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            setModalName('OVERWRITE');
          },
        },
        {
          label: 'Leave anyway',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            onConfirmNavigation();
          },
        },
      ],
    },
  };

  const FormContent = () => {
    return (
      <>
        <Typography
          sx={{
            fontWeight: '600',
            fontSize: '14px',
            color: 'rgba(0, 0, 0, 0.6)',
            whiteSpace: "pre-line"
          }}
        >
          {ModalData[modalName].subHeading}
        </Typography>
        {modalName !== 'UNSAVED_CHANGES' && (
          <Box sx={{ marginTop: '1.75rem' }}>
            <Controller
              name="sessionName"
              control={control}
              rules={{ required: 'Session Name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={ModalData[modalName]?.rowsNum || 1}
                  label={ModalData[modalName]?.label || 'Session Name'}
                  variant="outlined"
                  error={!!errors.sessionName}
                  helperText={
                    errors.sessionName ? errors.sessionName.message : ''
                  }
                />
              )}
            />
          </Box>
        )}
      </>
    );
  };

  return (
    <CustomDialog
      maxWidth={false}
      data-testid="dialog"
      title={ModalData[modalName].mainheading}
      show={open}
      handleClose={handleClose}
      handleSubmit={() => {}}
      formContent={<FormContent />}
      formActions={
        <DialogActions
          sx={{
            padding: '2rem 0 0.5rem 0',
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '12px',
          }}
        >
          {ModalData[modalName]?.buttons.map((button: any, index: number) => (
            <Button
              key={index}
              variant={button.variant}
              sx={button.sx}
              onClick={button.onClick}
              disabled={isSubmitting}
            >
              {button.label}
            </Button>
          ))}
        </DialogActions>
      }
      loading={isSubmitting} // Set loading state based on form submission
    />
  );
};

OverWriteDialog.displayName = "OverwriteBox";