import { useState, useEffect, useContext } from 'react';
import useSWR from 'swr';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import CreateDestinationForm from './CreateDestinationForm';
import EditDestinationForm from './EditDestinationForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast } from '../ToastMessage/ToastHelper';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';

interface ConnectionConfiguration {
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  project_id?: string;
  dataset_id?: string;
  dataset_location?: string;
  transformation_priority?: string;
  loading_method?: any;
}

interface Warehouse {
  destinationId: string;
  destinationDefinitionId: string;
  name: string;
  wtype: string;
  icon: string;
  connectionConfiguration: ConnectionConfiguration;
}

export const Destinations = () => {
  const { data, isLoading, mutate } = useSWR(`organizations/warehouses`, {
    revalidateOnFocus: false,
  });
  const { data: session }: any = useSession();
  const [warehouse, setWarehouse] = useState<Warehouse>();
  const globalContext = useContext(GlobalContext);
  const [showCreateWarehouseDialog, setShowCreateWarehouseDialog] =
    useState(false);
  const [showEditWarehouseDialog, setShowEditWarehouseDialog] = useState(false);
  const [showDeleteWarehouseDialog, setShowDeleteWarehouseDialog] =
    useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (data && data.warehouses && data.warehouses.length > 0) {
      const w_house = data.warehouses[0];
      setWarehouse({
        destinationId: w_house.airbyte_destination.destinationId,
        destinationDefinitionId:
          w_house.airbyte_destination.destinationDefinitionId,
        name: w_house.name,
        wtype: w_house.wtype,
        icon: w_house.airbyte_destination.icon,
        connectionConfiguration:
          w_house.airbyte_destination.connectionConfiguration,
      } as Warehouse);
    }
  }, [data]);

  if (isLoading) {
    return <CircularProgress />;
  }

  const deleteDestination = async () => {
    (async () => {
      setDeleteLoading(true);
      try {
        await httpDelete(session, 'organizations/warehouses/');
        setWarehouse(undefined);
        mutate();
        setShowDeleteWarehouseDialog(false);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
      setDeleteLoading(false);
    })();
  };

  return (
    <>
      {warehouse && warehouse.wtype === 'postgres' && (
        <>
          <Typography data-testid="wtype" variant="h3">
            {warehouse.name}
          </Typography>
          <Box dangerouslySetInnerHTML={{ __html: warehouse.icon }} />
          <Table sx={{ maxWidth: '600px' }}>
            <TableBody>
              <TableRow>
                <TableCell>Host</TableCell>
                <TableCell align="right" data-testid="host">
                  {warehouse.connectionConfiguration.host}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Port</TableCell>
                <TableCell align="right" data-testid="port">
                  {warehouse.connectionConfiguration.port}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Database</TableCell>
                <TableCell align="right" data-testid="database">
                  {warehouse.connectionConfiguration.database}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell align="right" data-testid="username">
                  {warehouse.connectionConfiguration.username}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}
      {warehouse && warehouse.wtype === 'bigquery' && (
        <>
          <Typography data-testid="wtype" variant="h3">
            {warehouse.wtype}
          </Typography>
          <Box dangerouslySetInnerHTML={{ __html: warehouse.icon }} />
          <Table sx={{ maxWidth: '600px' }}>
            <TableBody>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell align="right" data-testid="project_id">
                  {warehouse.connectionConfiguration.project_id}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Dataset</TableCell>
                <TableCell align="right" data-testid="dataset_id">
                  {warehouse.connectionConfiguration.dataset_id} /{' '}
                  {warehouse.connectionConfiguration.dataset_location}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Loading Method</TableCell>
                <TableCell align="right" data-testid="loading_method">
                  {warehouse.connectionConfiguration.loading_method.method}
                </TableCell>
              </TableRow>
              {warehouse.connectionConfiguration.loading_method.method ===
                'GCS Staging' && (
                <>
                  <TableRow>
                    <TableCell>GCS Bucket &amp; Path</TableCell>
                    <TableCell
                      align="right"
                      data-testid="gcs_bucket_name_and_path"
                    >
                      {
                        warehouse.connectionConfiguration.loading_method
                          .gcs_bucket_name
                      }{' '}
                      /{' '}
                      {
                        warehouse.connectionConfiguration.loading_method
                          .gcs_bucket_path
                      }
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GCS Temp Files</TableCell>
                    <TableCell align="right">
                      {
                        warehouse.connectionConfiguration.loading_method[
                          'keep_files_in_gcs-bucket'
                        ]
                      }
                    </TableCell>
                  </TableRow>
                </>
              )}
              <TableRow>
                <TableCell>Transformation Priority</TableCell>
                <TableCell align="right">
                  {warehouse.connectionConfiguration.transformation_priority}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
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
            onClick={() => setShowDeleteWarehouseDialog(true)}
            data-testid="delete-destination"
          >
            Delete warehouse
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
      <ConfirmationDialog
        show={showDeleteWarehouseDialog}
        handleClose={() => setShowDeleteWarehouseDialog(false)}
        handleConfirm={() => deleteDestination()}
        message="Deleting the warehouse will also delete all the connnections, flows and the dbt repo."
        loading={deleteLoading}
      />
    </>
  );
};
