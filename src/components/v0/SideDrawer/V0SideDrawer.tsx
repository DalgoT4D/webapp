import React from 'react';
import { Drawer, List, ListItem, ListItemText } from '@mui/material';

const V0SideDrawer: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 200,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 200, boxSizing: 'border-box', background: '#e8eaf6' },
      }}
    >
      <List>
        <ListItem button key="home">
          <ListItemText primary="New Home" />
        </ListItem>
        <ListItem button key="about">
          <ListItemText primary="About (new)" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default V0SideDrawer;
