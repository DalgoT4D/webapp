import React, { useContext, useState } from 'react';
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

export const OverWriteDialog = ({ open, setIsBoxOpen, session_name, modalName,oldSessionId, newSessionId }: { open: boolean, session_name: string, modalName: string, oldSessionId: string, newSessionId:string,setIsBoxOpen: (a: boolean) => void }) => {
  const {data:session} = useSession();
  const globalContext = useContext(GlobalContext);
  const [sessionName, setSessionName] = useState(session_name);
  const handleClose = () => (setIsBoxOpen(false));

  const handleSaveSession =async(overwrite:boolean, old_session_id:string | null)=>{
    try {
      const response = await httpPost(session, `warehouse/ask/${newSessionId}/save`, {
        "session_name": sessionName,
        overwrite,
        old_session_id
      });
      console.log(response, "response");
      //write error condition
      if(response.success){
        successToast(`${sessionName} saved successfully`, [], globalContext);
      }
    
    } catch (err:any) {
      console.log(err);
      errorToast(err.message, [], globalContext);
    }finally{
      handleClose();
    }
  }
  const ModalData: any = {
    SAVE: {
      mainheading: "Save as",
      subHeading: "Please name the configuration before saving it in the warehouse",
      buttons: [{
        label: 'Save',
        variant: 'contained',
        sx: {
          width: '6.75rem',
          padding: '8px 0',
          borderRadius: '5px',
        },
        onClick: () => {
          handleSaveSession(false, null)
        },
      }, {
        label: 'Cancel',
        variant: 'outlined',
        sx: {
          width: '6.75rem',
          padding: '8px 0',
          borderRadius: '5px',
        },
        onClick: handleClose,
      },]
    },
    OVERWRITE: {
      mainheading: "Overwrite existing session",
      subHeading: "The session with this name already exists. Do you want to overwrite?",
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
          handleSaveSession(true, oldSessionId)
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
            handleSaveSession(false, null)
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
        },]
    },
    UNSAVED_CHANGES: {
      mainheading: "",
      subHeading: "",
      buttons: [{}, {}]
    }
  }
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
              {ModalData[modalName].mainheading}
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
            {ModalData[modalName].subHeading}
          </Typography>

          {/* Input Field */}
          <Box sx={{ marginTop: '1.75rem' }}>
            <TextField
              name="overwrite"
              fullWidth
              label="Session Name"
              variant="outlined"
              value={sessionName}
              onChange={(e) => { setSessionName(e.target.value) }}
            />
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ padding: '1.5rem 2rem', display: 'flex',justifyContent: "flex-start", gap: '12px'}}>
          {ModalData[modalName].buttons.map((button: any, index: number) => (
            <Button
              key={index}
              variant={button.variant}
              sx={button.sx}
              onClick={button.onClick}
            >
              {button.label}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    </>
  );
};


