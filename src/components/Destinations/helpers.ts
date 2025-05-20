import { Warehouse, WarehouseTableRow } from './Destinations';
import { airbyteUrl } from '@/config/constant';
export const getTableData = (warehouse: Warehouse, isSuperAdmin: boolean) => {
  let tableData: WarehouseTableRow[] = [];

  switch (warehouse.wtype) {
    case 'postgres':
      tableData = [
        {
          label: 'Host',
          value: warehouse.connectionConfiguration.host,
        },
        {
          label: 'Port',
          value: warehouse.connectionConfiguration.port,
        },
        {
          label: 'Database',
          value: warehouse.connectionConfiguration.database,
        },
        {
          label: 'User',
          value: warehouse.connectionConfiguration.username,
        },
      ];
      break;

    case 'bigquery':
      tableData = [
        {
          label: 'Project',
          value: warehouse.connectionConfiguration.project_id,
        },
        {
          label: 'Dataset',
          value:
            warehouse.connectionConfiguration.dataset_id +
            ' / ' +
            warehouse.connectionConfiguration.dataset_location,
        },
        {
          label: 'Loading Method',
          value: warehouse.connectionConfiguration.loading_method.method,
        },
      ];

      if (warehouse.connectionConfiguration.loading_method.method === 'GCS Staging') {
        tableData.push(
          {
            label: 'GCS Bucket &amp; Path',
            value:
              warehouse.connectionConfiguration.loading_method.gcs_bucket_name +
              ' / ' +
              warehouse.connectionConfiguration.loading_method.gcs_bucket_path,
          },
          {
            label: 'GCS Temp Files',
            value: warehouse.connectionConfiguration.loading_method['keep_files_in_gcs-bucket'],
          }
        );
      }

      tableData.push({
        label: 'Transformation Priority',
        value: warehouse.connectionConfiguration.transformation_priority,
      });
      break;

    case 'snowflake':
      tableData = [
        {
          label: 'Host',
          value: warehouse.connectionConfiguration.host,
        },
        {
          label: 'Compute Warehouse',
          value: warehouse.connectionConfiguration.warehouse,
        },
        {
          label: 'Database',
          value: warehouse.connectionConfiguration.database,
        },

        {
          label: 'Schema',
          value: warehouse.connectionConfiguration.schema,
        },
        {
          label: 'User',
          value: warehouse.connectionConfiguration.username,
        },
        {
          label: 'Role',
          value: warehouse.connectionConfiguration.role,
        },
        {
          label: 'Loading Method',
          value: warehouse.connectionConfiguration.loading_method,
        },
      ];
      break;
  }

  const common = [
    {
      label: 'Airbyte Workspace ID',
      value: warehouse.airbyteWorkspaceId,
      link:
        isSuperAdmin && airbyteUrl ? `${airbyteUrl}/${warehouse.airbyteWorkspaceId}` : undefined,
    },
    {
      label: 'Docker Image Tag',
      value: warehouse.airbyteDockerRepository,
    },
    {
      label: 'Docker Image Version',
      value: warehouse.tag,
    },
  ];

  tableData.push(...common);

  return tableData;
};
