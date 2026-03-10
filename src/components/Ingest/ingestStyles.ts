// Shared color tokens, keyframes, and sx objects for the Ingest page redesign

export const colors = {
  primary: '#00897B',
  primaryDark: '#00695C',
  tealLight: '#E0F2F1',
  tealVeryLight: '#F1F8F7',
  textPrimary: '#1A2332',
  textSecondary: '#5F6B7A',
  textTertiary: '#8E99A4',
  borderLight: '#E8ECF0',
  successGreen: '#2E7D32',
  errorRed: '#C62828',
  warningAmber: '#F9A825',
  schemaBreaking: '#D35D5D',
  white: '#FFFFFF',
  warmGrey: '#F8F9FA',
};

export const warehouseGradient = 'linear-gradient(135deg, #00897B 0%, #00695C 100%)';

// Row hover sx — simplified (no transform/box-shadow since groups use border-based hover)
export const rowHoverSx = {
  cursor: 'default',
  transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .hover-actions': {
    opacity: 0,
    transition: 'opacity 0.25s ease',
  },
  '&:hover .hover-actions': {
    opacity: 1,
  },
};

// New-item highlight animation (fades over 3s)
export const newItemRowSx = {
  ...rowHoverSx,
  '@keyframes fadeHighlight': {
    '0%': { backgroundColor: 'rgba(0, 137, 123, 0.12)' },
    '100%': { backgroundColor: 'transparent' },
  },
  animation: 'fadeHighlight 3s ease-out forwards',
};

// Pulse glow for CTA buttons on new items
export const pulseGlowSx = {
  '@keyframes pulseGlow': {
    '0%': { boxShadow: '0 0 0 0 rgba(0, 137, 123, 0.5)' },
    '70%': { boxShadow: '0 0 0 10px rgba(0, 137, 123, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(0, 137, 123, 0)' },
  },
  animation: 'pulseGlow 1.5s ease-in-out 3',
};

// Small icon-only button (kept for backward compat if needed)
export const actionIconButtonSx = {
  minWidth: 'unset',
  width: 32,
  height: 32,
  borderRadius: '8px',
  padding: 0,
  color: colors.textSecondary,
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: colors.tealVeryLight,
    borderColor: colors.borderLight,
    color: colors.primary,
  },
};

// Labeled action button (icon + text label)
export const labeledActionButtonSx = {
  minWidth: 'unset',
  height: 28,
  borderRadius: '6px',
  padding: '2px 10px 2px 6px',
  color: colors.textSecondary,
  backgroundColor: 'transparent',
  border: '1px solid transparent',
  transition: 'all 0.2s ease',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'none' as const,
  '& .MuiButton-startIcon': {
    marginRight: '2px',
    '& > *:nth-of-type(1)': {
      fontSize: 16,
    },
  },
  '&:hover': {
    backgroundColor: colors.tealVeryLight,
    borderColor: colors.borderLight,
    color: colors.primary,
  },
};

// Delete variant of labeled action button
export const deleteActionButtonSx = {
  ...labeledActionButtonSx,
  '&:hover': {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    borderColor: colors.borderLight,
    color: colors.errorRed,
  },
};

// Warehouse outer container
export const warehouseContainerSx = {
  border: `1.5px solid ${colors.borderLight}`,
  borderRadius: '16px',
  backgroundColor: colors.white,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 6px 24px rgba(0, 0, 0, 0.03)',
  overflow: 'hidden',
};

// Source-group-level hover: background tint for all rows in a group
export const sourceGroupHoverSx = {
  backgroundColor: 'rgba(0, 137, 123, 0.04)',
  transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .hover-actions': {
    opacity: 1,
  },
};

// Status chip backgrounds
export const statusChipSx = {
  success: {
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    color: colors.successGreen,
  },
  failed: {
    backgroundColor: 'rgba(198, 40, 40, 0.08)',
    color: colors.errorRed,
  },
  cancelled: {
    backgroundColor: 'rgba(249, 168, 37, 0.08)',
    color: colors.warningAmber,
  },
  running: {
    backgroundColor: 'rgba(0, 137, 123, 0.08)',
    color: colors.primary,
  },
  queued: {
    backgroundColor: 'rgba(0, 137, 123, 0.08)',
    color: colors.primary,
  },
  locked: {
    backgroundColor: 'rgba(142, 153, 164, 0.08)',
    color: colors.textTertiary,
  },
};
