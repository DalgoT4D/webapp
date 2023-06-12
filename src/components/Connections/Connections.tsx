import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box } from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { httpDelete, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import CreateConnectionForm from './CreateConnectionForm';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [connectionToBeDeleted, setConnectionToBeDeleted] = useState<any>(null);
  const [rows, setRows] = useState<Array<Array<string>>>([]);

  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  const syncConnection = (connection: any) => {
    console.log(connection);
    (async () => {
      try {
        const message = await httpPost(
          session,
          `airbyte/connections/${connection.blockId}/sync/`,
          {}
        );
        if (message.success) {
          successToast(
            'Sync started... check for logs in two minutes',
            [],
            toastContext
          );
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  };

  const deleteConnection = (connection: any) => {
    (async () => {
      try {
        const message = await httpDelete(
          session,
          `airbyte/connections/${connection.blockId}`
        );
        if (message.success) {
          successToast('Connection deleted', [], toastContext);
          mutate();
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
    handleCancelDeleteConnection();
  };

  // when the connection list changes
  useEffect(() => {
    if (data && data.length >= 0) {
      const rows = data.map((connection: any, idx: number) => [
        connection.name,
        connection.sourceDest,
        connection.lastSync,
        [
          <Box
            sx={{ justifyContent: 'end', display: 'flex' }}
            key={'box-' + idx}
          >
            <Button
              variant="contained"
              onClick={() => syncConnection(connection)}
              key={'sync-' + idx}
              sx={{ marginRight: '10px' }}
            >
              Sync
            </Button>
            <Button
              variant="contained"
              onClick={() => handleDeleteConnection(connection)}
              key={'del-' + idx}
              sx={{ backgroundColor: '#d84141' }}
            >
              Delete
            </Button>
          </Box>,
        ],
      ]);
      setRows(rows);
    }
  }, [data]);

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleDeleteConnection = (connection: any) => {
    setConnectionToBeDeleted(connection);
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteConnection = () => {
    setConnectionToBeDeleted(null);
    setShowConfirmDeleteDialog(false);
  };

  // show load progress indicator
  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <CreateConnectionForm
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
      />
      <List
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
      />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteConnection()}
        handleConfirm={() => deleteConnection(connectionToBeDeleted)}
        message="This will delete the connection permanently and all the flows built on top of this."
      />
    </>
  );
};
