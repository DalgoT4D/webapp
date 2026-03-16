import { Box, Typography } from '@mui/material';
import { colors } from './ingestStyles';

interface SchemaChangeBadgeProps {
  changeType: string;
  onReview: () => void;
  disabled: boolean;
}

export default function SchemaChangeBadge({
  changeType,
  onReview,
  disabled,
}: SchemaChangeBadgeProps) {
  const isBreaking = changeType === 'breaking';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1,
          py: 0.25,
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          ...(isBreaking
            ? { backgroundColor: colors.schemaBreaking, color: '#fff' }
            : {
                border: `1px solid ${colors.schemaBreaking}`,
                color: colors.schemaBreaking,
                backgroundColor: 'transparent',
              }),
        }}
      >
        {isBreaking ? 'Breaking change' : 'Schema updated'}
      </Box>
      <Typography
        variant="body2"
        onClick={disabled ? undefined : onReview}
        sx={{
          color: disabled ? colors.textTertiary : colors.primary,
          cursor: disabled ? 'default' : 'pointer',
          fontWeight: 600,
          '&:hover': disabled ? {} : { textDecoration: 'underline' },
        }}
      >
        Review
      </Typography>
    </Box>
  );
}
