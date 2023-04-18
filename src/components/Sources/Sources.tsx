import * as React from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { Pager } from '../Pager/Pager';
import { backendUrl } from '@/config/constant';

function createData(details: string, type: string) {
  return [details, type];
}

const rows: Array<Array<string>> = [
  createData('Stir-SurveyCTO - 1', 'SurveyCTO'),
  createData('Stir-SurveyCTO - 2', 'SurveyCTO'),
];

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );

  if (isLoading) {
    return <CircularProgress />;
  }

  if (data && data.length > 0) {
    data.forEach((element: any) => {
      rows.push(createData(element.name, element.sourceDest));
    });
  }

  return <Pager headers={headers} rows={rows} />;
};
