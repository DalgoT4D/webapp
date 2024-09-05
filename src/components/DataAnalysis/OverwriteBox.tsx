import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import Image from 'next/image';
import CloseIcon from '@/assets/icons/close_small.svg';
import { httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

export const OverWriteDialog = ({
  open,
  setIsBoxOpen,
  modalName,
  oldSessionId,
  newSessionId,
  handleNewSession
}: {
  open: boolean;
  modalName: string;
  oldSessionId: string;
  newSessionId: string;
  handleNewSession:any
  setIsBoxOpen: (a: boolean) => void;
}) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [textBoxData, setTextBoxData] = useState('');
  const [openModalName, setOpenModalName] = useState(modalName);
  const [isSessionSaved, setIsSessionSaved] = useState(false);
  const handleClose = () => setIsBoxOpen(false);

console.log(modalName, "modalname");
  const handleSaveSession = async (
    overwrite: boolean,
    old_session_id: string | null
  ) => {
    try {
      const response = await httpPost(
        session,
        `warehouse/ask/${newSessionId}/save`,
        {
          session_name: textBoxData,
          overwrite,
          old_session_id,
        }
      );
      console.log(response, 'response');
      //write error condition
      if (response.success) {
        successToast(`${textBoxData} saved successfully`, [], globalContext);
        setIsSessionSaved(true);
        handleNewSession();
      }
    } catch (err: any) {
      console.log(err);
      errorToast(err.message, [], globalContext);
    } finally {
      handleClose();
    }
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
          onClick: () => {
            handleSaveSession(false, null);
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
          onClick: () => {
            setOpenModalName('CONFIRM_SAVEAS');
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
            handleSaveSession(false, null);
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
          onClick: handleClose, // Use existing handleClose function for the Cancel button
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
          onClick: () => {
            handleSaveSession(true, oldSessionId); //overwriting, opens when clicked overwrite.
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
      label: "Feedback",
      buttons: [
        {
          label: 'Submit',
          variant: 'contained',
          sx: {
            width: '6.75rem',
            padding: '8px 0',
            borderRadius: '5px',
          },
          onClick: () => {
            
          },
        },
      ],
    },
    UNSAVED_CHANGES: {
      mainheading: 'Unsaved changes',
      subHeading: 'You are about to leave this page without saving the changes.\nAll the changes that were made will be lost. Do you wish to continue?',
      buttons: [   {
        label: 'Save changes',
        variant: 'contained',
        sx: {
          width: '6.75rem',
          padding: '8px 0',
          borderRadius: '5px',
        },
        onClick: () => {
          handleSaveSession(false, oldSessionId);
        },
      },
      {
        label: 'Leave anyway',
        variant: 'outlined',
        sx: {
          width: '6.75rem',
          padding: '8px 0',
          borderRadius: '5px',
        },
        onClick: handleClose,
      },],
    },
  };
  return (
    <>
      {/* Dialog Box */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        {/* Dialog Title with close button */}
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Typography
              sx={{ color: '#000000', fontWeight: '600', fontSize: '1.5rem' }}
            >
              {ModalData[openModalName].mainheading}
            </Typography>
            <IconButton
              sx={{ marginLeft: 'auto' }}
              onClick={handleClose}
              aria-label="close"
            >
              <Image src={CloseIcon} alt="Close" width={20} height={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
          <Typography
            sx={{
              fontWeight: '600',
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            {ModalData[openModalName].subHeading}
          </Typography>

          {/* Input Field */}
          <Box sx={{ marginTop: '1.75rem' }}>
            <TextField
              name="overwrite"
              fullWidth
              multiline
              rows={ModalData[openModalName]?.rowsNum || 1}
              label={ModalData[openModalName]?.label || "Session Name"}
              variant="outlined"
              value={textBoxData}
              onChange={(e) => {
                setTextBoxData(e.target.value);
              }}
            />
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions
          sx={{
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '12px',
          }}
        >
          {ModalData[openModalName].buttons.map(
            (button: any, index: number) => (
              <Button
                key={index}
                variant={button.variant}
                sx={button.sx}
                onClick={button.onClick}
              >
                {button.label}
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
