import * as React from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { Pager } from '../Pager/Pager';

function createData(name: string, sourceDest: string, lastSync: string) {
  return [name, sourceDest, lastSync];
}

const rows: Array<Array<string>> = [
  createData('Connection 1', 'SWS -> PED', '28th March 2020'),
  createData('Connection 2', 'WER -> PED', '30th March 2020'),
];

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/connections`
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
