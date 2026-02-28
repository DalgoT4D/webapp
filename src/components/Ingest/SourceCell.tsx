import { Box, Button, Tooltip, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Image from 'next/image';
import connectionIcon from '@/assets/icons/connection.svg';
import { colors, labeledActionButtonSx, deleteActionButtonSx } from './ingestStyles';

interface SourceCellProps {
  name: string;
  sourceType: string;
  dockerTag: string;
  sourceIcon?: string;
  showMenu?: boolean;
  onEditSource?: () => void;
  onDeleteSource?: () => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
}

export default function SourceCell({
  name,
  sourceType,
  dockerTag,
  sourceIcon,
  showMenu = true,
  onEditSource,
  onDeleteSource,
  hasEditPermission = true,
  hasDeletePermission = true,
}: SourceCellProps) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Source icon in rounded container */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            backgroundColor: colors.tealLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          <Image
            src={sourceIcon || connectionIcon}
            width={20}
            height={20}
            alt="source icon"
            style={{ objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: colors.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: colors.textSecondary,
              lineHeight: 1.3,
            }}
          >
            {sourceType}
          </Typography>
          {dockerTag && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 400,
                color: colors.textTertiary,
                lineHeight: 1.3,
                display: 'block',
              }}
            >
              {dockerTag}
            </Typography>
          )}
        </Box>
      </Box>
      {/* Edit / Delete action buttons with labels (hover-only) */}
      {showMenu && (
        <Box className="hover-actions" sx={{ mt: 0.75, ml: 6.5, display: 'flex', gap: 0.5 }}>
          {onEditSource && (
            <Tooltip title="Edit this data source's configuration" arrow>
              <span>
                <Button
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  sx={labeledActionButtonSx}
                  disabled={!hasEditPermission}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSource();
                  }}
                >
                  Edit
                </Button>
              </span>
            </Tooltip>
          )}
          {onDeleteSource && (
            <Tooltip title="Permanently delete this source and all its connections" arrow>
              <span>
                <Button
                  size="small"
                  startIcon={<DeleteOutlineIcon />}
                  sx={deleteActionButtonSx}
                  disabled={!hasDeletePermission}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSource();
                  }}
                >
                  Delete
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
}
