import { Box, Button, Typography, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import Image from 'next/image';
import { colors, warehouseGradient, pulseGlowSx } from './ingestStyles';
import { WarehouseInfo } from './useIngestData';

interface WarehouseHeaderProps {
  warehouse: WarehouseInfo | null;
  warehouseLoading: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
  onAddWarehouse: () => void;
  permissions: string[];
  isDemo: boolean | undefined;
}

export default function WarehouseHeader({
  warehouse,
  warehouseLoading,
  showDetails,
  onToggleDetails,
  onAddWarehouse,
  permissions,
  isDemo,
}: WarehouseHeaderProps) {
  if (warehouseLoading) {
    return (
      <Box
        sx={{
          background: warehouseGradient,
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Loading warehouse...
        </Typography>
      </Box>
    );
  }

  if (!warehouse) {
    return (
      <Box
        sx={{
          px: 4,
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: colors.warmGrey,
          borderBottom: `2px dashed ${colors.borderLight}`,
        }}
      >
        <StorageOutlinedIcon sx={{ fontSize: 48, color: colors.textTertiary }} />
        <Typography
          variant="body1"
          sx={{ color: colors.textSecondary, fontWeight: 600, textAlign: 'center' }}
        >
          Set up your data warehouse
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: colors.textTertiary, textAlign: 'center', maxWidth: 420 }}
        >
          A warehouse is the central place where all your data from different sources will be
          collected and stored
        </Typography>
        {permissions.includes('can_create_warehouse') && !isDemo && (
          <Button
            variant="contained"
            onClick={onAddWarehouse}
            sx={{
              borderRadius: '10px',
              px: 3,
              py: 1,
              fontWeight: 700,
              ...pulseGlowSx,
            }}
          >
            + Set Up Warehouse
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: warehouseGradient,
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '& .warehouse-view-btn': {
          opacity: 0,
          transition: 'opacity 0.25s ease',
        },
        '&:hover .warehouse-view-btn': {
          opacity: 1,
        },
      }}
      onClick={onToggleDetails}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Warehouse icon in white circular container */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {warehouse.icon ? (
            <Image
              src={warehouse.icon}
              width={24}
              height={24}
              alt="warehouse icon"
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <StorageOutlinedIcon sx={{ fontSize: 22, color: colors.white }} />
          )}
        </Box>
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: colors.white,
              lineHeight: 1.3,
            }}
          >
            {warehouse.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.75)',
              lineHeight: 1.2,
              textTransform: 'capitalize',
            }}
          >
            {warehouse.wtype}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.55)',
              lineHeight: 1.2,
              mt: 0.25,
              display: 'block',
            }}
          >
            Your central data warehouse — where all your data is collected and stored
          </Typography>
        </Box>
      </Box>

      {/* View/collapse button */}
      <Box className="warehouse-view-btn">
        <IconButton
          size="small"
          sx={{
            color: colors.white,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            px: 1.5,
            py: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.white, mr: 0.5 }}>
            {showDetails ? 'Hide' : 'View'}
          </Typography>
          {showDetails ? (
            <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
          ) : (
            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}
