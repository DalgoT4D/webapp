import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';

function createData(details: string, type: string) {
  return [details, type];
}

const fakeRows: Array<Array<string>> = [
  createData('Stir-SurveyCTO - 1', 'SurveyCTO'),
  createData('Stir-SurveyCTO - 2', 'SurveyCTO'),
];

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
      ]);
      setRows(rows);
    } else {
      setRows(fakeRows);
    }
  }, [data]);

  if (isLoading) {
    return <CircularProgress />;
  }

  if (data && data.length > 0) {
    data.forEach((element: any) => {
      rows.push(createData(element.name, element.sourceDest));
    });
  }

  return (
    <List openDialog={() => {}} title="Source" headers={headers} rows={rows} />
  );
};
