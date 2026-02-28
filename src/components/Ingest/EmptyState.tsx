import { Box, Button, Typography } from '@mui/material';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import AddIcon from '@mui/icons-material/Add';
import { colors, pulseGlowSx } from './ingestStyles';

interface EmptyStateProps {
  searchText: string;
  onAddSource: () => void;
  canCreateSource: boolean;
}

export default function EmptyState({ searchText, onAddSource, canCreateSource }: EmptyStateProps) {
  if (searchText) {
    return (
      <Box
        sx={{
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <SearchOffIcon sx={{ fontSize: 56, color: colors.borderLight }} />
        <Typography variant="body1" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
          No sources or connections match &ldquo;{searchText}&rdquo;
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textTertiary }}>
          Try a different search term
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <StorageOutlinedIcon sx={{ fontSize: 64, color: colors.borderLight }} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 700, mb: 0.5 }}>
          No data sources yet
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          Connect your first data source to start building your data pipeline
        </Typography>
      </Box>
      {canCreateSource && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddSource}
          sx={{
            borderRadius: '10px',
            px: 3,
            py: 1,
            fontWeight: 700,
            mt: 1,
            ...pulseGlowSx,
          }}
        >
          Add Data Source
        </Button>
      )}
    </Box>
  );
}
