import { useState, useEffect, useContext } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Button } from '@mui/material';
import { List } from '../List/List';
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

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const [rows, setRows] = useState<Array<Array<string>>>([]);
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

  const handleEditSource = (sourceId: string) => {
    setSourceIdToEdit(sourceId);
    setShowEditSourceDialog(true);
  };

  useEffect(() => {
    if (data && data.length >= 0) {
      const rows = data.map((source: any, idx: number) => [
        <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
          <Image
            style={{ marginRight: 10 }}
            src={connectionIcon}
            alt="connection icon"
          />
          {source.name}
        </Box>,
        source.sourceDest,

        <Box
          sx={{ justifyContent: 'end', display: 'flex', gap: '5px' }}
          key={'box-' + idx}
        >
          <Button
            variant="contained"
            onClick={() => handleEditSource(source?.sourceId)}
            key={'edit-' + idx}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={() => handleDeleteSource(source)}
            key={'del-' + idx}
            sx={{ backgroundColor: '#d84141' }}
          >
            Delete
          </Button>
        </Box>,
      ]);
      setRows(rows);
    }
  }, [data]);

  const handleClickOpen = () => {
    setShowCreateSourceDialog(true);
  };

  const handleDeleteSource = (source: any) => {
    setSourceToBeDeleted(source);
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteSource = () => {
    setSourceToBeDeleted(null);
    setShowConfirmDeleteDialog(false);
  };

  const deleteSource = async (source: any) => {
    try {
      const response = await httpDelete(
        session,
        `airbyte/sources/${source.sourceId}`
      );
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
      <CreateSourceForm
        mutate={mutate}
        showForm={showCreateSourceDialog}
        setShowForm={setShowCreateSourceDialog}
      />
      <EditSourceForm
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
