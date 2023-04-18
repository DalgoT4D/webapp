import * as React from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { Pager } from '../Pager/Pager';

function createData(name: string, type: string, host: string) {
  return [name, type, host];
}

const rows: Array<Array<string>> = [
  createData('AWS-Postgres', 'Postgres', 'host.docker.internal'),
];

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const headers = ['Name', 'Type', 'Host'];

export const Destinations = () => {
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );

  if (isLoading) {
    return <CircularProgress />;
  }

  if (data && data.length > 0) {
    data.forEach((element: any) => {
      rows.push(createData(element.name, element.sourceDest, element.lastSync));
    });
  }

  return <Pager headers={headers} rows={rows} />;
};
