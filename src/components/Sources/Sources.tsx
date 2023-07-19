import { useState, useContext, useMemo } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Button, Typography } from '@mui/material';
import { List } from '../List/List';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { httpDelete } from '@/helpers/http';
import CreateSourceForm from './CreateSourceForm';
import EditSourceForm from './EditSourceForm';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import connectionIcon from '@/assets/icons/connection.svg';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import Image from 'next/image';
import { ActionsMenu } from '../UI/Menu/Menu';

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showCreateSourceDialog, setShowCreateSourceDialog] =
    useState<boolean>(false);
  const [showEditSourceDialog, setShowEditSourceDialog] =
    useState<boolean>(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [sourceIdToEdit, setSourceIdToEdit] = useState<string>('');
  const [sourceToBeDeleted, setSourceToBeDeleted] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleEditSource = () => {
    handleClose();
    setShowEditSourceDialog(true);
  };

  const open = Boolean(anchorEl);
  const handleClick = (sourceId: string, event: HTMLElement | null) => {
    setSourceIdToEdit(sourceId);
    setSourceToBeDeleted(sourceId);
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  let rows = [];

  rows = useMemo(() => {
    if (data && data.length >= 0) {
      return data.map((source: any, idx: number) => [
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
          <Image
            style={{ marginRight: 10 }}
            src={connectionIcon}
            alt="connection icon"
          />
          <Typography variant="body1" fontWeight={600}>
            {source.name}
          </Typography>
        </Box>,
        <Typography
          key={source.sourceName}
          variant="subtitle2"
          fontWeight={600}
        >
          {source.sourceName}
        </Typography>,
        <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'box-' + idx}>
          <Button
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={(event) =>
              handleClick(source.sourceId, event.currentTarget)
            }
            variant="contained"
            key={'menu-' + idx}
            color="info"
            sx={{ px: 0, minWidth: 32 }}
          >
            <MoreHorizIcon />
          </Button>
        </Box>,
      ]);
    }
    return [];
  }, [data]);

  const handleClickOpen = () => {
    setShowCreateSourceDialog(true);
  };

  const handleDeleteSource = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteSource = () => {
    setSourceToBeDeleted(null);
    setShowConfirmDeleteDialog(false);
  };

  const deleteSource = async (sourceId: any) => {
    try {
      const response = await httpDelete(session, `airbyte/sources/${sourceId}`);
      if (response.success) {
        successToast('Source deleted', [], globalContext);
        mutate();
      } else {
        errorToast('Something went wrong. Please try again', [], globalContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    handleCancelDeleteSource();
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <ActionsMenu
        eleType="source"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEditSource}
        handleDeleteConnection={handleDeleteSource}
      />
      <CreateSourceForm
        mutate={mutate}
        showForm={showCreateSourceDialog}
        setShowForm={setShowCreateSourceDialog}
      />
      <EditSourceForm
        mutate={mutate}
        showForm={showEditSourceDialog}
        setShowForm={setShowEditSourceDialog}
        sourceId={sourceIdToEdit}
      />
      <List
        openDialog={handleClickOpen}
        title="Source"
        headers={headers}
        rows={rows}
      />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteSource()}
        handleConfirm={() => deleteSource(sourceToBeDeleted)}
        message="This will delete the source permanentely and remove from the listing. It will also delete any connections related to it."
      />
    </>
  );
};
