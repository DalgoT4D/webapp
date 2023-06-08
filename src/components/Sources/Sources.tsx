import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Button } from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { httpDelete } from '@/helpers/http';
import CreateSourceForm from './CreateSourceForm';
import EditSourceForm from './EditSourceForm';

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data: session }: any = useSession();
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showCreateSourceDialog, setShowCreateSourceDialog] =
    useState<boolean>(false);
  const [showEditSourceDialog, setShowEditSourceDialog] =
    useState<boolean>(false);
  const [sourceIdToEdit, setSourceIdToEdit] = useState<string>('');

  const handleEditSource = (sourceId: string) => {
    setSourceIdToEdit(sourceId);
    setShowEditSourceDialog(true);
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((source: any, idx: number) => [
        source.name,
        source.sourceDest,
        [
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
              onClick={() => deleteSource(source)}
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
    setShowCreateSourceDialog(true);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  const deleteSource = async (source: any) => {
    await httpDelete(session, `airbyte/sources/${source.sourceId}`);
    mutate();
  };

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
    </>
  );
};
