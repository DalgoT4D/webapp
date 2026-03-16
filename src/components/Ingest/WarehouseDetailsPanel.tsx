import { Box, Button, Link, Typography } from '@mui/material';
import { colors } from './ingestStyles';
import { WarehouseInfo } from './useIngestData';
import { getTableData } from '@/components/Destinations/helpers';
import { Warehouse, WarehouseTableRow } from '@/components/Destinations/Destinations';

interface WarehouseDetailsPanelProps {
  warehouse: WarehouseInfo;
  showDetails: boolean;
  permissions: string[];
  isDemo: boolean | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

export default function WarehouseDetailsPanel({
  warehouse,
  showDetails,
  permissions,
  isDemo,
  onEdit,
  onDelete,
}: WarehouseDetailsPanelProps) {
  // Build the Warehouse object expected by getTableData
  const warehouseForHelper: Warehouse = {
    airbyteWorkspaceId: warehouse.airbyteWorkspaceId,
    destinationId: warehouse.destinationId,
    destinationDefinitionId: warehouse.destinationDefinitionId,
    name: warehouse.name,
    wtype: warehouse.wtype,
    icon: warehouse.icon,
    connectionConfiguration: warehouse.connectionConfiguration,
    airbyteDockerRepository: warehouse.airbyteDockerRepository,
    tag: warehouse.tag,
  };

  const isSuperAdmin = permissions.includes('can_create_org');
  let tableData: WarehouseTableRow[] = [];
  if (['postgres', 'bigquery', 'snowflake'].includes(warehouse.wtype)) {
    tableData = getTableData(warehouseForHelper, isSuperAdmin);
  }

  return (
    <Box
      sx={{
        maxHeight: showDetails ? '500px' : '0px',
        opacity: showDetails ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s ease, opacity 0.3s ease',
      }}
    >
      <Box
        sx={{
          backgroundColor: colors.tealLight,
          px: 4,
          py: 3,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        {/* Key-value grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.5,
            mb: 3,
          }}
        >
          {tableData.map((row) => (
            <Box key={row.label}>
              <Typography
                variant="body2"
                sx={{
                  color: colors.textSecondary,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 0.25,
                }}
              >
                {row.label}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textPrimary, fontWeight: 500 }}>
                {row.link ? (
                  <Link
                    href={row.link}
                    target="_blank"
                    sx={{
                      color: colors.primary,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {row.value}
                  </Link>
                ) : (
                  row.value || '—'
                )}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Action buttons */}
        {!isDemo && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {permissions.includes('can_edit_warehouse') && (
              <Button
                variant="outlined"
                size="small"
                onClick={onEdit}
                sx={{
                  borderColor: colors.primary,
                  color: colors.primary,
                  borderRadius: '8px',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 137, 123, 0.08)',
                    borderColor: colors.primaryDark,
                  },
                }}
              >
                Edit Warehouse
              </Button>
            )}
            {permissions.includes('can_delete_warehouses') && (
              <Button
                variant="outlined"
                size="small"
                onClick={onDelete}
                sx={{
                  borderColor: colors.errorRed,
                  color: colors.errorRed,
                  borderRadius: '8px',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: 'rgba(198, 40, 40, 0.08)',
                    borderColor: colors.errorRed,
                  },
                }}
              >
                Delete Warehouse
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
