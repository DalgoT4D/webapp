import { Box, Divider, ListItemIcon, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import EditIcon from '@/assets/icons/edit.svg';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteIcon from '@/assets/icons/delete.svg';

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
  handleDetails?: () => void;
  handleDelete?: () => void;
  handleResetConnection?: () => void;
  handleResendInvitation?: () => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasResendPermission?: boolean;
  hasResetPermission?: boolean;
}

export const ActionsMenu: React.FC<MenuProps> = ({
  anchorEl,
  open,
  eleType,
  handleClose,
  handleEdit,
  handleDetails,
  handleDelete,
  handleResetConnection,
  handleResendInvitation,
  hasEditPermission = true,
  hasDeletePermission = true,
  hasResendPermission = true,
  hasResetPermission = true,
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
    {handleEdit && (
      <MenuItem
        sx={{ my: 0 }}
        onClick={() => handleEdit()}
        disabled={!hasEditPermission}
      >
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Edit
      </MenuItem>
    )}
    {handleDetails && (
      <MenuItem
        sx={{ my: 0 }}
        onClick={() => handleDetails()}
        disabled={!hasEditPermission}
      >
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Details
      </MenuItem>
    )}
    {handleResendInvitation && (
      <MenuItem
        sx={{ my: 0 }}
        onClick={() => handleResendInvitation()}
        disabled={!hasResendPermission}
      >
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Resend
      </MenuItem>
    )}

    {handleDelete && (
      <Box key="fake-key">
        <Divider style={{ margin: 0 }} />
        <MenuItem
          onClick={() => handleDelete()}
          disabled={!hasDeletePermission}
        >
          <ListItemIcon style={{ minWidth: 28 }}>
            <Image src={DeleteIcon} alt="delete icon" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Box>
    )}
    <Divider style={{ margin: 0 }} />
    {eleType === 'connection' && handleResetConnection && (
      <MenuItem
        onClick={() => handleResetConnection()}
        disabled={!hasResetPermission}
      >
        <ListItemIcon style={{ minWidth: 28 }}>
          <RestartAltIcon sx={{ width: 16 }} />
        </ListItemIcon>
        Reset
      </MenuItem>
    )}
  </Menu>
);
