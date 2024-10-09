import { Box, Menu, MenuItem, Paper, Typography, IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import styles from './Header.module.css';
import ProfileIcon from '@/assets/icons/profile.svg';
import LogoutIcon from '@/assets/icons/logout.svg';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/assets/images/logo.svg';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateOrgForm from '../Org/CreateOrgForm';
import { GlobalContext } from '@/contexts/ContextProvider';

// assets
import HamburgerIcon from '../../assets/icons/hamburger.svg';
import useSWR from 'swr';

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
  const handleSignout = () => {
    // Hit backend api to invalidate the token
    localStorage.clear();
    signOut({ callbackUrl: `${window.location.origin}` });
  };
  const { data: session }: any = useSession();
  const router = useRouter();
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

  return (
    <Paper className={styles.Header}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, ml: 1.8 }}>
        {!hideMenu && (
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
        <Image src={Logo} alt="dalgo logo" />
      </Box>
      <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto', gap: '20px' }}>
        <IconButton
          onClick={handleViewAll}
          sx={{
            borderRadius: '50%',
          }}
        >
          <Badge color="primary" badgeContent={unread_count?.res}>
            <NotificationsIcon style={{ color: '#312c2cde' }} />
          </Badge>
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
  );
};
