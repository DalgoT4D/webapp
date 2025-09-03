import { Fragment, ReactNode, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Link,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import MuiDrawer from '@mui/material/Drawer';
import { styled, Theme, CSSObject } from '@mui/material/styles';

import { drawerWidth, getSideMenu } from '@/config/menu';

// assets
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { ProductWalk } from '../ProductWalk/ProductWalk';
import { GlobalContext } from '@/contexts/ContextProvider';
import { demoProductWalkthrough } from '@/config/constant';
import { fetchTransformType, TransformType } from '@/pages/pipeline/transform';
import { useSession } from 'next-auth/react';

export interface ItemButtonProps {
  openMenu: boolean;
  item: MenuOption;
  isSelected: boolean;
  onClick: (item: MenuOption) => void;
  children?: ReactNode;
  disabled?: boolean;
}

interface MenuOption {
  index: number;
  title: string;
  path: string;
  icon: (selected: boolean) => JSX.Element;
  parent?: number;
  className?: string;
  permission?: string;
  hide?: boolean;
  minimize?: boolean;
}

const ItemButton: React.FC<ItemButtonProps> = ({
  item,
  isSelected,
  onClick,
  openMenu,
  children,
  disabled = false,
}: ItemButtonProps) => {
  const renderButtonContent = () => (
    <ListItemButton
      sx={openMenu ? {} : { pl: '8px' }}
      disableRipple
      data-testid="listButton"
      onClick={() => !disabled && onClick(item)}
      selected={isSelected}
    >
      <ListItemIcon sx={!openMenu ? { pr: 10 } : {}}>{item.icon(isSelected)}</ListItemIcon>
      {openMenu && (
        <ListItemText
          primaryTypographyProps={{
            color: isSelected ? 'primary' : 'inherit',
          }}
          primary={item.title}
        />
      )}
      {children}
    </ListItemButton>
  );

  return openMenu ? (
    renderButtonContent()
  ) : (
    <Tooltip title={item.title} placement="right">
      {renderButtonContent()}
    </Tooltip>
  );
};

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

export const SideDrawer = ({ openMenu, setOpenMenu }: any) => {
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const { data: session } = useSession();
  const [transformType, setTransformType] = useState<any>('');
  const sideMenu: MenuOption[] = getSideMenu({ transformType });
  const { state } = globalContext?.UnsavedChanges ?? {};
  const [open, setOpen] = useState(
    new Array(sideMenu.filter((item) => !item.parent).length).fill(false)
  );
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    sideMenu.find((item) => item.path === router.pathname)?.index
  );
  const [runWalkThrough, setRunWalkThrough] = useState(false);
  const permissions = globalContext?.Permissions.state || [];
  // handle drawer expand and collapse

  const [hideSideDrawer, setHideSideDrawer] = useState(false);
  useEffect(() => {
    if (window.self !== window.top) {
      setHideSideDrawer(true);
    }
  }, []);

  const handleCollpaseArrowClick = (idx: number) => {
    const newOpen = [...open];
    newOpen[idx] = !newOpen[idx];
    setOpen(newOpen);
  };
  //This redirects the page when we try to got to some tab without saving a session in AI Data summary.
  useEffect(() => {
    if (state) return;
    setSelectedIndex(sideMenu.find((item) => item.path === router.pathname)?.index);
  }, [router.pathname, state]);

  const handleListItemClick = (item: MenuOption) => {
    if (item.minimize) {
      setOpenMenu(false);
    }
    setSelectedIndex(item.index);

    router.push(item.path);
  };

  useEffect(() => {
    const menuLength = sideMenu.filter((item) => !item.parent).length;
    const isOpen = !openMenu;
    const newArr = new Array(menuLength).fill(isOpen);

    // ** When the sidedrawer is minimized ** //
    if (!openMenu) {
      setOpen(newArr);
    } else {
      // ** When the sidedrawer is expanded ** //
      //Find the selected menuItem and check if its a parent or not.
      const selectedSideMenuItem: any = sideMenu.find((item) => item.path === router.pathname);
      const parentMenuIndexes = [1];

      if (
        selectedSideMenuItem?.parent === undefined &&
        parentMenuIndexes.includes(selectedSideMenuItem?.index)
      ) {
        newArr[selectedSideMenuItem?.index] = true;
        setOpen(newArr);
      } else {
        const parentIndex = selectedSideMenuItem?.parent;
        newArr[parentIndex] = true;
        setOpen(newArr);
      }
    }
  }, [openMenu]);

  useEffect(() => {
    if (!session) return;
    const getTransformType = async () => {
      setLoading(true);
      const { transform_type } = await fetchTransformType(session);
      setTransformType(transform_type);
      setLoading(false);
    };
    getTransformType();
  }, [session]);

  useEffect(() => {
    setRunWalkThrough(true);
  }, []);

  const getList = (
    <List component="div" data-testid="side-menu">
      {sideMenu.map((item) => {
        const hasUnhiddenChildren = sideMenu.filter(
          (sideItem) => sideItem.parent === item.index && !sideItem.hide
        );
        const itemColor = selectedIndex === item.index ? 'primary' : 'inherit';
        if (item.hide) return null;
        return (
          item.parent === undefined && (
            <Fragment key={item.title}>
              <ListItem
                sx={{ px: 1.5, py: 0.5 }}
                className={item.className}
                data-testid={`menu-item-${item.index}`}
              >
                <ItemButton
                  openMenu={openMenu}
                  item={item}
                  disabled={item.permission !== undefined && !permissions.includes(item.permission)}
                  isSelected={selectedIndex === item.index}
                  onClick={() => {
                    handleListItemClick(item);
                  }}
                >
                  {hasUnhiddenChildren.length > 0 && openMenu && (
                    <IconButton
                      sx={{ padding: 0 }}
                      data-testid={`expand-toggle-${item.index}`}
                      onClick={() => handleCollpaseArrowClick(item.index)}
                    >
                      {open[item.index] ? (
                        <ExpandLess color={itemColor} />
                      ) : (
                        <ExpandMore color={itemColor} />
                      )}
                    </IconButton>
                  )}
                </ItemButton>
              </ListItem>
              {hasUnhiddenChildren.length > 0 && (
                <Collapse
                  in={open[item.index]}
                  key={item.index}
                  timeout="auto"
                  data-testid={`collapse-box-${item.index}`}
                  unmountOnExit
                >
                  <List component="div" disablePadding sx={{ ml: openMenu ? 4 : 0 }}>
                    {hasUnhiddenChildren.map((subitem) => {
                      if (subitem.hide) {
                        return null;
                      }
                      return (
                        <ListItem
                          key={subitem.title}
                          sx={{ px: 1.5 }}
                          className={subitem.className}
                          data-testid={`menu-item-${subitem.index}`}
                        >
                          <ItemButton
                            openMenu={openMenu}
                            item={subitem}
                            isSelected={selectedIndex === subitem.index}
                            onClick={() => handleListItemClick(subitem)}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Fragment>
          )
        );
      })}
    </List>
  );
  return (
    !hideSideDrawer && (
      <Drawer
        PaperProps={{
          sx: { border: 'none' },
        }}
        sx={{
          '& .MuiDrawer-paper': {
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 7,
          },
        }}
        open={openMenu}
        variant="permanent"
      >
        {loading ? <CircularProgress /> : getList}
        {openMenu && (
          <Box
            sx={{
              position: 'relative',
              bottom: 0,
              paddingBottom: 4,
              width: drawerWidth,
            }}
          >
            <Link href="https://dalgot4d.github.io/dalgo_docs/" target="_blank">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography data-testid="documentation" sx={{ paddingRight: 1 }}>
                  Documentation
                </Typography>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                  fill="currentColor"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                </svg>
              </Box>
            </Link>
            <Link href="https://dalgo.org/privacy-policy/" target="_blank">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                <Typography data-testid="privacypolicy" sx={{ paddingRight: 1 }}>
                  Privacy Policy
                </Typography>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                  fill="currentColor"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                </svg>
              </Box>
            </Link>
          </Box>
        )}
        {globalContext?.CurrentOrg.state.is_demo && demoProductWalkthrough && (
          <ProductWalk
            run={runWalkThrough}
            setRun={setRunWalkThrough}
            steps={[
              {
                target: '.ingest_walkthrough',
                body: 'Start by clicking here',
              },
              {
                target: '.warehouse_walkthrough',
                body: 'Your Postgres Warehouse is already set up here',
              },
              {
                target: '.sources_walkthrough',
                body: 'You will not be able to add new sources here. You will be able to choose from the available sources only',
              },
              {
                target: '.connections_walkthrough',
                body: 'Click the add button to create a new Connection',
              },
              {
                target: '.transform_walkthrough',
                body: 'Proceed to the transform page where we have set up your transformations that will help you build your dashboards',
              },
              {
                target: '.orchestrate_walkthrough',
                body: 'Proceed to the orchestrate page to setup your pipelines',
              },
              {
                target: '.pipelineadd_walkthrough',
                body: 'Click here to add a new pipeline',
              },
              {
                target: '.analysis_walkthrough',
                body: 'Click here to view your dashboard(s) and create new ones',
              },
            ]}
          />
        )}
      </Drawer>
    )
  );
};
