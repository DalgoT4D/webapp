import { useState, useEffect, useContext } from 'react';
import useSWR from 'swr';
import { Box, Button, CircularProgress, Typography, Link } from '@mui/material';
import { Table, TableBody, TableCell, TableRow } from '@mui/material';
import DestinationForm from './DestinationForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast } from '../ToastMessage/ToastHelper';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import Image from 'next/image';
import { getTableData } from './helpers';
import { toCamelCase } from '@/utils/common';

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
  warehouse?: any;
  schema?: any;
  role?: any;
}

export interface Warehouse {
  airbyteWorkspaceId: string;
  destinationId: string;
  destinationDefinitionId: string;
  name: string;
  wtype: string;
  icon: string;
  connectionConfiguration: ConnectionConfiguration;
  airbyteDockerRepository: string;
  tag: string;
}

export interface WarehouseTableRow {
  label: string;
  value: string | undefined;
  link?: string;
}

const DataTable = ({
  data,
  warehouse,
}: {
  data: WarehouseTableRow[];
  warehouse: Warehouse | undefined;
}) => {
  return (
    <>
      {warehouse && (
        <>
          <Typography data-testid="wname" variant="h3">
            {warehouse.name}
          </Typography>
          <Image src={warehouse.icon} width={100} height={100} alt="warehouse icon" />
        </>
      )}
      <Table sx={{ maxWidth: '600px' }}>
        <TableBody>
          {data.map((row) => (
            <TableRow sx={{ minWidth: 300 }} key={row.label}>
              <TableCell>{row.label}</TableCell>
              <TableCell align="right" data-testid={toCamelCase(row.label)}>
                {row.link ? (
                  <Link href={row.link} target="_blank">
                    {row.value}
                  </Link>
                ) : (
                  row.value
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export const Destinations = () => {
  const { data, isLoading, mutate } = useSWR(`organizations/warehouses`, {
    revalidateOnFocus: false,
  });
  const { data: session }: any = useSession();
  const [warehouse, setWarehouse] = useState<Warehouse>();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const [showWarehouseDialog, setShowWarehouseDialog] = useState(false);
  const [showDeleteWarehouseDialog, setShowDeleteWarehouseDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (data && data.warehouses && data.warehouses.length > 0) {
      const w_house = data.warehouses[0];
      setWarehouse({
        airbyteWorkspaceId: w_house.airbyte_destination.workspaceId,
        airbyteDockerRepository: w_house.airbyte_docker_repository,
        tag: w_house.airbyte_docker_image_tag,
        destinationId: w_house.airbyte_destination.destinationId,
        destinationDefinitionId: w_house.airbyte_destination.destinationDefinitionId,
        name: w_house.name,
        wtype: w_house.wtype,
        icon: w_house.airbyte_destination.icon,
        connectionConfiguration: w_house.airbyte_destination.connectionConfiguration,
        ssl: w_house.ssl,
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
        await httpDelete(session, 'v1/organizations/warehouses/');
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

  let tableData: WarehouseTableRow[] = [];

  if (warehouse && ['postgres', 'bigquery', 'snowflake'].includes(warehouse.wtype)) {
    tableData = getTableData(warehouse, permissions.includes('can_create_org'));
  }

  return (
    <>
      {tableData.length > 0 && <DataTable data={tableData} warehouse={warehouse} />}

      {warehouse && !globalContext?.CurrentOrg.state.is_demo && (
        <Box sx={{ display: 'flex', gap: '5px' }}>
          <Button
            variant="contained"
            disabled={!permissions.includes('can_edit_warehouse')}
            onClick={() => setShowWarehouseDialog(true)}
            data-testid="edit-destination"
          >
            Edit
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#d84141' }}
            disabled={!permissions.includes('can_delete_warehouses')}
            onClick={() => setShowDeleteWarehouseDialog(true)}
            data-testid="delete-destination"
          >
            Delete warehouse
          </Button>
        </Box>
      )}
      {!warehouse && !showWarehouseDialog && (
        <Button
          color="primary"
          variant="outlined"
          disabled={!permissions.includes('can_create_warehouse')}
          onClick={() => setShowWarehouseDialog(true)}
          data-testid="add-new-destination"
        >
          Add a new warehouse
        </Button>
      )}

      <DestinationForm
        showForm={showWarehouseDialog}
        setShowForm={setShowWarehouseDialog}
        warehouse={warehouse}
        mutate={mutate}
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
