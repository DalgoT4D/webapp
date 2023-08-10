import { Box, Menu, MenuItem, Paper, Typography } from '@mui/material';
import styles from './Header.module.css';
import ProfileIcon from '@/assets/icons/profile.svg';
import LogoutIcon from '@/assets/icons/logout.svg';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/assets/images/logo.svg';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { httpGet } from '@/helpers/http';
import { useRouter } from 'next/navigation';
import CreateOrgForm from '../Org/CreateOrgForm';

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
};

type OrgUser = {
  email: string;
  active: boolean;
  role: number;
  role_slug: string;
  org: Org;
};

type AutoCompleteOption = {
  id: string;
  label: string;
};

export const Header = () => {
  const handleSignout = () => {
    // Hit backend api to invalidate the token
    localStorage.clear();
    signOut({ callbackUrl: `${window.location.origin}` });
  };
  const { data: session }: any = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [orgs, setOrgs] = useState<Array<AutoCompleteOption>>([]);
  const [showOrgCreateForm, setShowOrgCreateForm] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<
    AutoCompleteOption | null | undefined
  >(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: HTMLElement | null) => {
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    // fetch the orgs associated with the orguser
    (async () => {
      try {
        const orgusers = await httpGet(session, `currentuserv2`);
        const orgs: Array<AutoCompleteOption> = orgusers.map(
          (orguser: OrgUser) => ({
            id: orguser.org.slug,
            label: orguser.org.name,
          })
        );
        setOrgs(orgs);
        // see if the org is set in the local storage
        const currentOrgSlug = localStorage.getItem('org-slug');
        let org: AutoCompleteOption | null | undefined = null;
        org = orgs?.find(
          (org: AutoCompleteOption) => org.id === currentOrgSlug
        );
        // If not pick the first org from the api response
        if (!org && orgs && orgs.length > 0) org = orgs[0];
        setSelectedOrg(org);
      } catch (err: any) {
        console.error(err);
      }
    })();
  }, [session]);

  useEffect(() => {
    const currentOrgSlug = localStorage.getItem('org-slug');
    if (selectedOrg && selectedOrg.id && currentOrgSlug !== selectedOrg.id) {
      handleClose();
      localStorage.setItem('org-slug', selectedOrg.id);
      router.refresh();
    }
  }, [selectedOrg]);

  const handleCreateOrgClick = () => {
    setShowOrgCreateForm(true);
  };

  return (
    <Paper className={styles.Header}>
      <Image src={Logo} style={{ margin: 4, marginLeft: 12 }} alt="ddp logo" />
      <Box
        display="flex"
        alignItems="center"
        sx={{ marginLeft: 'auto', gap: '20px' }}
      >
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
        sx={{ marginTop: 4, marginLeft: -2, paddingRight: 2, py: 0 }}
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
        <Box
          sx={{
            my: 0,
            py: 1,
            px: 2,
            ':hover': { cursor: 'pointer' },
          }}
          onClick={handleCreateOrgClick}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              borderBottom: '0.5px solid rgba(15, 36, 64, 0.5)',
            }}
          >
            Create new org
          </Typography>
        </Box>
        {orgs.map((org: AutoCompleteOption, idx: number) => (
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
        <MenuItem onClick={() => handleSignout()}>
          <Image
            style={{ marginRight: 8 }}
            src={LogoutIcon}
            alt="logout icon"
          />
          Logout
        </MenuItem>
        <CreateOrgForm
          closeSideMenu={handleClose}
          showForm={showOrgCreateForm}
          setShowForm={setShowOrgCreateForm}
        />
      </Menu>
    </Paper>
  );
};
