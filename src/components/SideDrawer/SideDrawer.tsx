import { Fragment, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Collapse,
  Drawer,
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
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { MenuOption, drawerWidth, sideMenu } from '@/config/menu';

export interface ItemButtonProps {
  item: MenuOption;
  isSelected: boolean;
  onClick: (item: MenuOption) => void;
  children?: ReactNode;
}

const ItemButton: React.FC<ItemButtonProps> = ({
  item,
  isSelected,
  onClick,
  children,
}: ItemButtonProps) => (
  <ListItemButton
    disableRipple
    data-testid="listButton"
    onClick={() => onClick(item)}
    selected={isSelected}
  >
    <ListItemIcon>{item.icon(isSelected)}</ListItemIcon>
    <ListItemText
      primaryTypographyProps={{
        color: isSelected ? 'primary' : 'inherit',
      }}
      primary={item.title}
    />
    {children}
  </ListItemButton>
);

export const SideDrawer = () => {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(
    sideMenu.find((item) => item.path === router.pathname)?.index
  );

  useEffect(() => {
    setSelectedIndex(
      sideMenu.find((item) => item.path === router.pathname)?.index
    );
  }, [router.pathname]);

  const handleListItemClick = (item: MenuOption) => {
    setSelectedIndex(item.index);
    router.push(item.path);
  };

  const getList = (
    <List component="div" data-testid="side-menu">
      {sideMenu.map((item) => {
        const hasChildren = sideMenu.filter(
          (sideItem) => sideItem.parent === item.index
        );
        const itemColor = selectedIndex === item.index ? 'primary' : 'inherit';
        return (
          !item.parent && (
            <Fragment key={item.title}>
              <ListItem>
                <ItemButton
                  item={item}
                  isSelected={selectedIndex === item.index}
                  onClick={() => handleListItemClick(item)}
                >
                  {hasChildren.length > 0 && (
                    <IconButton
                      sx={{ padding: 0 }}
                      onClick={() => setOpen(!open)}
                    >
                      {open ? (
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
                  in={open}
                  key={item.index}
                  timeout="auto"
                  unmountOnExit
                >
                  <List
                    component="div"
                    disablePadding
                    sx={{ ml: 4 }}
                    data-testid={`child-menu-${item.index}`}
                  >
                    {hasChildren.map((subitem) => (
                      <ListItem key={subitem.title}>
                        <ItemButton
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
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          paddingTop: 8,
        },
      }}
      open
      anchor={'left'}
      variant="permanent"
    >
      {getList}
      <Box
        sx={{
          position: 'fixed',
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
      </Box>
    </Drawer>
  );
};
