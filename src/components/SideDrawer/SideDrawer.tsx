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
} from '@mui/material';
import MuiDrawer from '@mui/material/Drawer';
import { styled, Theme, CSSObject } from '@mui/material/styles';

import { MenuOption, drawerWidth, sideMenu } from '@/config/menu';

// assets
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { ProductWalk } from '../ProductWalk/ProductWalk';
import { GlobalContext } from '@/contexts/ContextProvider';

export interface ItemButtonProps {
  openMenu: boolean;
  item: MenuOption;
  isSelected: boolean;
  onClick: (item: MenuOption) => void;
  children?: ReactNode;
}

const ItemButton: React.FC<ItemButtonProps> = ({
  item,
  isSelected,
  onClick,
  openMenu,
  children,
}: ItemButtonProps) => (
  <ListItemButton
    sx={openMenu ? {} : { pl: '8px' }}
    disableRipple
    data-testid="listButton"
    onClick={() => onClick(item)}
    selected={isSelected}
  >
    <ListItemIcon sx={!openMenu ? { pr: 10 } : {}}>
      {item.icon(isSelected)}
    </ListItemIcon>
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

// const DrawerHeader = styled('div')(({ theme }) => ({
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'flex-end',
//   padding: theme.spacing(0, 1),
//   minHeight: '20px',
//   // necessary for content to be below app bar
//   ...theme.mixins.toolbar,
// }));

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

export const SideDrawer = ({ openMenu }: any) => {
  const router = useRouter();
  const [open, setOpen] = useState(
    new Array(sideMenu.filter((item) => !item.parent).length).fill(true)
  );
  const [selectedIndex, setSelectedIndex] = useState(
    sideMenu.find((item) => item.path === router.pathname)?.index
  );
  const [runWalkThrough, setRunWalkThrough] = useState(false);
  const globalContext = useContext(GlobalContext);

  // handle drawer expand and collapse

  const handleCollpaseArrowClick = (idx: number) => {
    const newOpen = [...open];
    newOpen[idx] = !newOpen[idx];
    setOpen(newOpen);
  };

  useEffect(() => {
    setSelectedIndex(
      sideMenu.find((item) => item.path === router.pathname)?.index
    );
  }, [router.pathname]);

  const handleListItemClick = (item: MenuOption) => {
    setSelectedIndex(item.index);
    router.push(item.path);
  };

  useEffect(() => {
    setOpen(
      new Array(sideMenu.filter((item) => !item.parent).length).fill(true)
    );
  }, [openMenu]);

  useEffect(() => {
    setRunWalkThrough(true);
  }, []);

  const getList = (
    <List component="div" data-testid="side-menu">
      {sideMenu.map((item, idx: number) => {
        const hasChildren = sideMenu.filter(
          (sideItem) => sideItem.parent === item.index
        );
        const itemColor = selectedIndex === item.index ? 'primary' : 'inherit';
        return (
          !item.parent && (
            <Fragment key={item.title}>
              <ListItem sx={{ px: 1.5 }} className={item.className}>
                <ItemButton
                  openMenu={openMenu}
                  item={item}
                  isSelected={selectedIndex === item.index}
                  onClick={() => handleListItemClick(item)}
                >
                  {hasChildren.length > 0 && (
                    <IconButton
                      sx={{ padding: 0 }}
                      onClick={() => handleCollpaseArrowClick(idx)}
                    >
                      {open[idx] ? (
                        <ExpandLess color={itemColor} />
                      ) : (
                        <ExpandMore color={itemColor} />
                      )}
                    </IconButton>
                  )}
                </ItemButton>
              </ListItem>
              {hasChildren.length > 0 && (
                <Collapse
                  in={open[idx]}
                  key={item.index}
                  timeout="auto"
                  unmountOnExit
                >
                  <List
                    component="div"
                    disablePadding
                    sx={{ ml: openMenu ? 4 : 0 }}
                    data-testid={`child-menu-${item.index}`}
                  >
                    {hasChildren.map((subitem) => (
                      <ListItem
                        key={subitem.title}
                        sx={{ px: 1.5 }}
                        className={subitem.className}
                      >
                        <ItemButton
                          openMenu={openMenu}
                          item={subitem}
                          isSelected={selectedIndex === subitem.index}
                          onClick={() => handleListItemClick(subitem)}
                        />
                      </ListItem>
                    ))}
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
    <Drawer
      PaperProps={{
        sx: { border: 'none' },
      }}
      sx={{
        // width: drawerWidth,
        // flexShrink: 0,
        '& .MuiDrawer-paper': {
          display: 'flex',
          justifyContent: 'space-between',
          // width: drawerWidth,
          // boxSizing: 'border-box',
          paddingTop: 7,
        },
      }}
      open={openMenu}
      // anchor={'left'}
      variant="permanent"
    >
      {getList}
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
            <Typography sx={{ paddingRight: 1 }}>Documentation</Typography>
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
        <Link href="https://dalgo.in/privacy-policy/" target="_blank">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            <Typography sx={{ paddingRight: 1 }}>Privacy Policy</Typography>
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
      {globalContext?.CurrentOrg.state.is_demo && (
        <ProductWalk
          run={runWalkThrough}
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
          ]}
        />
      )}
    </Drawer>
  );
};
