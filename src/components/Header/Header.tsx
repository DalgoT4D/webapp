import { Box, Menu, MenuItem, Paper, Typography, IconButton } from '@mui/material';

import styles from './Header.module.css';
import ProfileIcon from '@/assets/icons/profile.svg';
import LogoutIcon from '@/assets/icons/logout.svg';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/assets/images/logo.svg';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import CreateOrgForm from '../Org/CreateOrgForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpPut } from '@/helpers/http';

// assets
import HamburgerIcon from '../../assets/icons/hamburger.svg';
import useSWR from 'swr';
import Unread_Notifications from '@/assets/icons/notifications_unread';
import Notifications from '@/assets/icons/notifications';
import { ErrorOutline, Close as CloseIcon } from '@mui/icons-material';

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
  viz_url: string | null;
  viz_login_type: string | null;
};

type OrgUser = {
  email: string;
  active: boolean;
  role: number;
  role_slug: string;
  org: Org;
  wtype: string;
};

type AutoCompleteOption = {
  id: string;
  label: string;
};

type HeaderProps = {
  openMenu: boolean;
  setOpenMenu: (...args: any) => any;
  hideMenu: boolean;
};

export const Header = ({
  openMenu = false,
  setOpenMenu = () => {},
  hideMenu = false,
}: HeaderProps | any) => {
  const { data: unread_count } = useSWR(`notifications/unread_count`, {
    refreshInterval: 20000,
  });

  const { data: urgentNotifications, mutate: mutateUrgent } = useSWR(`notifications/urgent`);

  const handleSignout = () => {
    // Hit backend api to invalidate the token
    localStorage.clear();
    signOut({ callbackUrl: `${window.location.origin}` });
  };
  const { data: session }: any = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [orgs, setOrgs] = useState<Array<AutoCompleteOption>>([]);

  const [orgusers, setOrgusers] = useState<Array<OrgUser> | undefined>([]);
  const [showOrgCreateForm, setShowOrgCreateForm] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<AutoCompleteOption | null | undefined>(null);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const open = Boolean(anchorEl);
  const handleClick = (event: HTMLElement | null) => {
    setAnchorEl(event);
  };
  const handleViewAll = () => {
    router.push('/notifications');
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReadUrgent = async (notificationId: string) => {
    try {
      await httpPut(session, `notifications/v1`, {
        notification_ids: [notificationId],
        read_status: true,
      });
      mutateUrgent(); // Refresh the list after read
    } catch (err) {
      console.error('Failed to dismiss urgent notification:', err);
    }
  };

  useEffect(() => {
    // fetch the orgs associated with the orguser
    try {
      const orgusers = globalContext?.OrgUsers.state;
      let orgs: Array<AutoCompleteOption> = [];
      if (orgusers) {
        orgs = orgusers?.map((orguser: OrgUser) => ({
          id: orguser.org.slug,
          label: orguser.org.name,
        }));
        setOrgs(orgs);
      }
      setOrgusers(orgusers);

      // see if the org is set in the local storage
      const currentOrgSlug = localStorage.getItem('org-slug');
      let org: AutoCompleteOption | null | undefined = null;
      org = orgs?.find((org: AutoCompleteOption) => org.id === currentOrgSlug);
      // If not pick the first org from the api response
      if (!org && orgs && orgs.length > 0) org = orgs[0];
      setSelectedOrg(org);
    } catch (err: any) {
      console.error(err);
    }
  }, [session, globalContext?.OrgUsers.state]);

  useEffect(() => {
    const currentOrgSlug = localStorage.getItem('org-slug');
    if (selectedOrg && selectedOrg.id && currentOrgSlug !== selectedOrg.id) {
      const orguser: OrgUser | any = orgusers?.find(
        (orguser: OrgUser) => orguser.org.slug === selectedOrg.id
      );
      if (orguser) {
        globalContext?.CurrentOrg?.dispatch({
          type: 'new',
          orgState: { ...orguser.org, wtype: orguser.wtype },
        });
      }

      handleClose();
      localStorage.setItem('org-slug', selectedOrg.id);
      router.refresh();
    }

    // always update the current org context from so that it is accessible anywhere in the app
    if (selectedOrg) {
      const selectedOrguser: OrgUser | any = orgusers?.find(
        (orguser: OrgUser) => orguser.org.slug === selectedOrg.id
      );
      if (selectedOrguser && selectedOrguser?.org) {
        globalContext?.CurrentOrg?.dispatch({
          type: 'new',
          orgState: { ...selectedOrguser.org, wtype: selectedOrguser.wtype },
        });
      }
    }
  }, [selectedOrg]);

  const handleCreateOrgClick = () => {
    setShowOrgCreateForm(true);
  };
  const handleChangePassword = () => {
    router.push('/changepassword');
  };

  return (
    <>
      <Paper className={styles.Header}>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1.8 }}>
          {!hideMenu && pathname !== '/changepassword' && (
            <IconButton
              onClick={() => setOpenMenu(!openMenu)}
              sx={{
                borderRadius: '50%',
                lineHeight: 0,
                transition: (theme) =>
                  theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shorter,
                  }),
                ...(!openMenu && {
                  transform: 'rotate(180deg)',
                }),
              }}
            >
              <Image src={HamburgerIcon} alt="Hamburger-icon" />
            </IconButton>
          )}
          <Box
            sx={{
              ml: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image src={Logo} alt="dalgo logo" />
          </Box>
        </Box>
        <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto', gap: '20px' }}>
          <IconButton
            onClick={handleViewAll}
            sx={{
              borderRadius: '50%',
            }}
          >
            {unread_count?.res > 0 ? <Unread_Notifications /> : <Notifications />}
          </IconButton>
          <Typography variant="h6">{selectedOrg?.label}</Typography>
          <Image
            style={{ marginRight: 24, cursor: 'pointer' }}
            src={ProfileIcon}
            alt="profile icon"
            onClick={(event) => handleClick(event.currentTarget)}
          />
        </Box>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          sx={{
            marginTop: 4,
            marginLeft: -2,
            paddingRight: 2,
            py: 0,
          }}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          PaperProps={{
            className: styles.Paper,
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
          <Box sx={{ my: 0, py: 1, px: 2 }} onClick={handleClose}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                borderBottom: '0.5px solid rgba(15, 36, 64, 0.5)',
              }}
            >
              {session?.user?.email || 'no user'}
            </Typography>
          </Box>
          {session?.user?.can_create_orgs && (
            <Box
              sx={{
                my: 0,
                py: 1,
                px: 2,
                ':hover': { cursor: 'pointer' },
              }}
              onClick={handleCreateOrgClick}
            >
              {permissions.includes('can_create_org') && (
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    borderBottom: '0.5px solid rgba(15, 36, 64, 0.5)',
                  }}
                  data-testid="createneworg"
                >
                  Create new org
                </Typography>
              )}
            </Box>
          )}
          <Box
            sx={{
              overflow: 'scroll',
              maxHeight: '60vh',
            }}
          >
            <Box>
              {orgs
                .sort((org1, org2) => org1['label'].localeCompare(org2['label']))
                .map((org: AutoCompleteOption, idx: number) => (
                  <MenuItem
                    key={idx}
                    value={org.id}
                    onClick={() => setSelectedOrg(org)}
                    selected={selectedOrg?.id === org.id}
                    sx={selectedOrg?.id === org.id ? { fontWeight: 600 } : {}}
                  >
                    {org.label}
                  </MenuItem>
                ))}
            </Box>
          </Box>
          <MenuItem
            sx={{
              borderTop: '0.5px solid rgba(15, 36, 64, 0.5)',
            }}
            onClick={() => handleChangePassword()}
          >
            Change Password
          </MenuItem>
          <MenuItem
            sx={{
              borderTop: '0.5px solid rgba(15, 36, 64, 0.5)',
            }}
            onClick={() => handleSignout()}
          >
            <Image style={{ marginRight: 8 }} src={LogoutIcon} alt="logout icon" />
            Logout
          </MenuItem>
        </Menu>
        <CreateOrgForm
          closeSideMenu={handleClose}
          showForm={showOrgCreateForm}
          setShowForm={setShowOrgCreateForm}
        />
      </Paper>
      {urgentNotifications?.res?.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ffffff',
            border: '1px solid #FFCDD2',
            borderRadius: '8px',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1300,
            minWidth: '300px',
            maxWidth: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 12px',
          }}
        >
          {urgentNotifications.res.map((msg: any) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFEBEE',
                border: '1px solid #FFCDD2',
                borderRadius: '6px',
                padding: '8px 12px',
                gap: '8px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <ErrorOutline sx={{ color: '#B71C1C', mt: '2px' }} />
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    wordBreak: 'break-word',
                    color: '#B71C1C', // dark teal text
                    flex: 1,
                  }}
                >
                  {msg.message}
                </Typography>
              </Box>

              <IconButton
                onClick={() => handleReadUrgent(msg.id)}
                sx={{ padding: '4px', color: '#B71C1C' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};
