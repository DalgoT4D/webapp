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
  handleDelete?: () => void;
  handleResetConnection?: () => void;
  handleResendInvitation?: () => void;
  handleMakeAccountManager?: () => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
}

export const ActionsMenu: React.FC<MenuProps> = ({
  anchorEl,
  open,
  eleType,
  handleClose,
  handleEdit,
  handleDelete,
  handleResetConnection,
  handleResendInvitation,
  handleMakeAccountManager,
  hasEditPermission = true,
  hasDeletePermission = true,
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
    {handleResendInvitation && (
      <MenuItem sx={{ my: 0 }} onClick={() => handleResendInvitation()}>
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Resend
      </MenuItem>
    )}
    {handleMakeAccountManager && (
      <MenuItem sx={{ my: 0 }} onClick={() => handleMakeAccountManager()}>
        <ListItemIcon style={{ minWidth: 28 }}>
          <Image src={EditIcon} alt="edit icon" />
        </ListItemIcon>
        Make Account Manager
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
      <MenuItem onClick={() => handleResetConnection()}>
        <ListItemIcon style={{ minWidth: 28 }}>
          <RestartAltIcon sx={{ width: 16 }} />
        </ListItemIcon>
        Reset
      </MenuItem>
    )}
  </Menu>
);
