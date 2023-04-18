import * as React from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { Pager } from '../Pager/Pager';
import { backendUrl } from '@/config/constant';

function createData(name: string, type: string, host: string) {
  return [name, type, host];
}

const rows: Array<Array<string>> = [
  createData('AWS-Postgres', 'Postgres', 'host.docker.internal'),
];

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
