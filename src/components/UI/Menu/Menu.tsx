import { Box, Divider, ListItemIcon, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import EditIcon from '@/assets/icons/edit.svg';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@/assets/icons/delete.svg';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface MenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  eleType:
    | 'flow'
    | 'source'
    | 'connection'
    | 'dbtworkspace'
    | 'usermanagement'
    | 'invitation'
    | 'transformtask';
  handleClose: () => void;
  handleEdit?: () => void;
  handleRefresh?: () => void;
  handleDelete?: () => void;
  handleClearConnection?: () => void;
  handleResendInvitation?: () => void;
  handleView?: () => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasResendPermission?: boolean;
  hasResetPermission?: boolean;
  viewMode?: boolean;
}

export const ActionsMenu: React.FC<MenuProps> = ({
  anchorEl,
  open,
  eleType,
  handleClose,
  handleEdit,
  handleRefresh,
  handleDelete,
  handleClearConnection,
  handleResendInvitation,
  handleView,
  hasEditPermission = true,
  hasDeletePermission = true,
  hasResendPermission = true,
  hasResetPermission = true,
  viewMode = false,
}) => (
  <Menu
    id="basic-menu"
    data-testid="basic-menu"
    anchorEl={anchorEl}
    open={open}
    sx={{ marginTop: 2, py: 0 }}
    onClose={handleClose}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    MenuListProps={{
      sx: { p: 0 },
      'aria-labelledby': 'basic-button',
    }}
  >
    {viewMode && handleView && (
      <>
        <MenuItem sx={{ my: 0 }} onClick={() => handleView()}>
          <ListItemIcon style={{ minWidth: 28 }}>
            <VisibilityIcon sx={{ width: 16 }} />
          </ListItemIcon>
          View
        </MenuItem>
        <Divider style={{ margin: 0 }} />
      </>
    )}

    {!viewMode && handleEdit && (
      <MenuItem sx={{ my: 0 }} onClick={() => handleEdit()} disabled={!hasEditPermission}>
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Edit
      </MenuItem>
    )}
    <Divider style={{ margin: 0 }} />
    {!viewMode && handleRefresh && (
      <MenuItem sx={{ my: 0 }} onClick={() => handleRefresh()} disabled={!hasEditPermission}>
        <ListItemIcon style={{ minWidth: 28 }}>
          <RefreshIcon sx={{ width: 14 }} />
        </ListItemIcon>
        Refresh schema
      </MenuItem>
    )}
    {handleResendInvitation && (
      <MenuItem
        sx={{ my: 0 }}
        onClick={() => handleResendInvitation()}
        disabled={!hasResendPermission || !viewMode}
      >
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Resend
      </MenuItem>
    )}

    {!viewMode && handleDelete && (
      <Box key="fake-key">
        <Divider style={{ margin: 0 }} />
        <MenuItem
          onClick={() => handleDelete()}
          disabled={!hasDeletePermission}
          data-testid="deletetestid"
        >
          <ListItemIcon style={{ minWidth: 28 }}>
            <Image src={DeleteIcon} alt="delete icon" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Box>
    )}
    <Divider style={{ margin: 0 }} />
    {!viewMode && eleType === 'connection' && handleClearConnection && (
      <MenuItem onClick={() => handleClearConnection()} disabled={!hasResetPermission}>
        <ListItemIcon style={{ minWidth: 28 }}>
          <RestartAltIcon sx={{ width: 16 }} />
        </ListItemIcon>
        Clear
      </MenuItem>
    )}
  </Menu>
);
