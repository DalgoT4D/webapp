import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';
import CreateSourceForm from './CreateSourceForm';

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
      ]);
      setRows(rows);
    }
  }, [data]);

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <CreateSourceForm
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
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
