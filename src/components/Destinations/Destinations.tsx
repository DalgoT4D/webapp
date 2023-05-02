import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';

function createData(name: string, type: string, host: string) {
  return [name, type, host];
}

const fakeRows: Array<Array<string>> = [
  createData('AWS-Postgres', 'Postgres', 'host.docker.internal'),
];

const headers = ['Name', 'Type', 'Host'];

export const Destinations = () => {
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
        element.lastSync,
      ]);
      setRows(rows);
    } else {
      setRows(fakeRows);
    }
  }, [data]);

  const handleClickOpen = () => {
    const a = 1;
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <List
      openDialog={handleClickOpen}
      title="Destination"
      headers={headers}
      rows={rows}
    />
  );
};
