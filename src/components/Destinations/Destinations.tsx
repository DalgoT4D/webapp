import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import { backendUrl } from '@/config/constant';
import CreateDestinationForm from './CreateDestinationForm';
import EditDestinationForm from './EditDestinationForm';

export const Destinations = () => {
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );
  const [warehouse, setWarehouse] = useState<any>(null);
  const [showCreateWarehouseDialog, setShowCreateWarehouseDialog] =
    useState(false);
  const [showEditWarehouseDialog, setShowEditWarehouseDialog] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      setWarehouse({
        destinationId: data[0].destinationId,
        destinationDefinitionId: data[0].destinationDefinitionId,
        name: data[0].destinationName,
        wtype: data[0].destinationName,
        icon: data[0].icon,
        connectionConfiguration: data[0].connectionConfiguration,
      });
    }
  }, [data]);

  if (isLoading) {
    return <CircularProgress />;
  }

  const deleteDestination = async () => {
    // TODO
  };

  return (
    <>
      {warehouse && warehouse.wtype === 'Postgres' && (
        <>
          <Typography variant="h3">{warehouse.name}</Typography>
          <Box dangerouslySetInnerHTML={{ __html: warehouse.icon }} />
          <Table sx={{ maxWidth: '600px' }}>
            <TableBody>
              <TableRow>
                <TableCell>Host</TableCell>
                <TableCell align="right">
                  {warehouse.connectionConfiguration.host}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Port</TableCell>
                <TableCell align="right">
                  {warehouse.connectionConfiguration.port}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Database</TableCell>
                <TableCell align="right">
                  {warehouse.connectionConfiguration.database}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell align="right">
                  {warehouse.connectionConfiguration.username}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}
      {warehouse && warehouse.wtype === 'BigQuery' && (
        <>
          <Typography variant="h3">{warehouse.name}</Typography>
          <Box dangerouslySetInnerHTML={{ __html: warehouse.icon }} />
        </>
      )}
      {warehouse && (
        <Box sx={{ display: 'flex', gap: '5px' }}>
          <Button
            variant="contained"
            onClick={() => setShowEditWarehouseDialog(true)}
            data-testid="edit-destination"
          >
            Edit
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#d84141' }}
            onClick={() => deleteDestination()}
          >
            Delete connection to warehouse (TODO)
          </Button>
        </Box>
      )}
      {!warehouse && !showCreateWarehouseDialog && (
        <Button
          color="primary"
          variant="outlined"
          onClick={() => setShowCreateWarehouseDialog(true)}
          data-testid="add-new-destination"
        >
          Add a new warehouse
        </Button>
      )}
      {!warehouse && (
        <CreateDestinationForm
          showForm={showCreateWarehouseDialog}
          setShowForm={setShowCreateWarehouseDialog}
          mutate={mutate}
        />
      )}
      <EditDestinationForm
        showForm={showEditWarehouseDialog}
        setShowForm={setShowEditWarehouseDialog}
        warehouse={warehouse}
      />
    </>
  );
};
