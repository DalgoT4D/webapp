import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import CreateConnectionForm from './CreateConnectionForm';

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data: session }: any = useSession();

  const [showDialog, setShowDialog] = useState(false);
  const [rows, setRows] = useState<Array<Array<string>>>([]);

  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  const toastContext = useContext(GlobalContext);

  // when the connection list changes
  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((connection: any, idx: number) => [
        connection.name,
        connection.sourceDest,
        connection.lastSync,
        [
          <Button
            variant="contained"
            onClick={() => syncConnection(connection)}
            key={idx}
          >
            Sync
          </Button>,
        ],
      ]);
      setRows(rows);
    }
  }, [data]);

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  // show load progress indicator
  if (isLoading) {
    return <CircularProgress />;
  }

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
          successToast("Sync started... check for logs in two minutes", [], toastContext);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  };

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
    </>
  );
};
