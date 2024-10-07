import React, { useEffect } from 'react';
import { Box, Button, TextField, Typography, DialogActions } from '@mui/material';
import CustomDialog from '../Dialog/CustomDialog';
import { useForm, Controller } from 'react-hook-form';
import { MODALS } from './LLMSummary';
import { useTracking } from '@/contexts/TrackingContext';
// Define the form data type
interface FormData {
  sessionName: string;
  feedback: string;
}

export const OverWriteDialog = ({
  open,
  setIsBoxOpen,
  modalName,
  onSubmit,
  onConfirmNavigation,
  setModalName,
  submitFeedback,
  oldSessionName,
  handleNewSession,
}: {
  open: boolean;
  modalName: string;
  onSubmit: any;
  onConfirmNavigation: any;
  setModalName: (x: string) => void;
  setIsBoxOpen: (a: boolean) => void;
  submitFeedback: (x: string) => void;
  handleNewSession: (x: boolean) => void;
  oldSessionName: string;
}) => {
  const trackAmplitudeEvent: any = useTracking();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: {
      sessionName: '',
      feedback: '',
    },
  });

  const handleClose = () => {
    reset({
      sessionName: '',
      feedback: '',
    });
    setIsBoxOpen(false);
  };
  useEffect(() => {
    if (oldSessionName && modalName === MODALS.OVERWRITE) {
      reset({
        sessionName: oldSessionName,
      });
    }
  }, [oldSessionName, modalName]);
  const ModalData: any = {
    SAVE: {
      mainheading: 'Save as',
      label: 'Session name',
      subHeading: 'Please name the configuration before saving it in the warehouse',
      buttons: [
        {
          label: 'Save',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            trackAmplitudeEvent(`[Save-LLMSummary] Button Clicked`);
            handleSubmit((data) => onSubmit(data.sessionName, false))(); // Use handleSubmit from react-hook-form
          },
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
      label: 'Session name',
      subHeading: 'The session with this name already exists. Do you want to overwrite?',
      buttons: [
        {
          label: 'Overwrite',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            trackAmplitudeEvent(`[Overwrite-LLMSummary] Button Clicked`);
            handleSubmit((data) => onSubmit(data.sessionName, true))(); // Handle form submission
          },
        },
        {
          label: 'Save as new',
          variant: 'outlined',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            reset({
              sessionName: '',
              feedback: '',
            });
            setModalName(MODALS.CONFIRM_SAVEAS);
          },
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
      label: 'Session name',
      subHeading: 'Please rename the configuration before saving it in the warehouse',
      buttons: [
        {
          label: 'Save',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            trackAmplitudeEvent(`[Save-LLMSummary] Button Clicked`);
            handleSubmit((data) => onSubmit(data.sessionName, false))(); // Use handleSubmit from react-hook-form
          },
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
          onClick: handleSubmit((data) => submitFeedback(data.feedback)),
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
            setModalName(oldSessionName ? MODALS.OVERWRITE : MODALS.SAVE);
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
    RESET_WARNING: {
      mainheading: 'Reset changes',
      subHeading:
        'You are about to Reset this page without saving the changes.\nAll the changes that were made will be lost. Do you wish to continue?',
      label: 'Reset changes',
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
            setModalName(oldSessionName ? MODALS.OVERWRITE : MODALS.SAVE);
          },
        },
        {
          label: 'Reset',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            handleNewSession(true);
            setIsBoxOpen(false);
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
            whiteSpace: 'pre-line',
          }}
        >
          {ModalData[modalName].subHeading}
        </Typography>
        {!['UNSAVED_CHANGES', 'RESET_WARNING'].includes(modalName) && (
          <Box sx={{ marginTop: '1.75rem' }}>
            <Controller
              name={modalName === 'FEEDBACK_FORM' ? 'feedback' : 'sessionName'}
              control={control}
              rules={{
                required:
                  modalName === 'FEEDBACK_FORM'
                    ? 'Feedback is required'
                    : 'Session Name is required',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={ModalData[modalName]?.rowsNum || 1}
                  label={ModalData[modalName]?.label || ''}
                  variant="outlined"
                  error={modalName === 'FEEDBACK_FORM' ? !!errors.feedback : !!errors.sessionName}
                  helperText={
                    modalName === 'FEEDBACK_FORM'
                      ? errors.feedback
                        ? errors.feedback.message
                        : ''
                      : errors.sessionName
                        ? errors.sessionName.message
                        : ''
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

OverWriteDialog.displayName = 'OverwriteBox';
