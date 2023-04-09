import { Fragment, ReactNode, useState } from 'react';
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
    data-test="listButton"
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

  const handleListItemClick = (item: MenuOption) => {
    setSelectedIndex(item.index);
    router.push(item.path);
  };

  const getList = (
    <List component="div">
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
                  <List component="div" disablePadding sx={{ ml: 4 }}>
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
        },
      }}
      open
      anchor={'left'}
      variant="permanent"
    >
      {getList}
    </Drawer>
  );
};
