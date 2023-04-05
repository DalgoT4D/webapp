import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Collapse,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  InboxOutlined,
  DraftsOutlined,
  Inbox,
  ExpandLess,
  ExpandMore,
  TransformOutlined,
  EqualizerOutlined,
  HubOutlined,
} from '@mui/icons-material';

const drawerWidth = 250;
const list = [
  {
    name: 'Analysis',
    icon: (selected: boolean) => (
      <EqualizerOutlined color={selected ? 'primary' : 'inherit'} />
    ),
  },
  {
    name: 'Data pipeline',
    icon: (selected: boolean) => (
      <InboxOutlined color={selected ? 'primary' : 'inherit'} />
    ),
    sublist: [
      { name: 'Ingest', icon: <HubOutlined /> },
      { name: 'Transform', icon: <TransformOutlined /> },
      { name: 'Orchestrate', icon: <DraftsOutlined /> },
    ],
  },
];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  console.log(selectedIndex);

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    router.push(index === 0 ? '/' : '/pipeline');
    setSelectedIndex(index);
  };

  const getList = () => (
    <List component="div">
      {list.map((item, index) =>
        item.sublist ? (
          <>
            <ListItem>
              <ListItemButton
                disableRipple
                onClick={(event) => handleListItemClick(event, index)}
                selected={selectedIndex === index}
              >
                <ListItemIcon>
                  {item.icon(selectedIndex === index)}
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{
                    color: selectedIndex === index ? 'primary' : 'default',
                  }}
                  primary={item.name}
                />
                <IconButton onClick={() => setOpen(!open)}>
                  {open ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </ListItemButton>
            </ListItem>
            <Collapse in={open} key={index} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.sublist.map((subitem) => (
                  <ListItem key={subitem.name}>
                    <ListItemButton sx={{ pl: 4 }}>
                      <ListItemIcon>{subitem.icon}</ListItemIcon>
                      <ListItemText primary={subitem.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </>
        ) : (
          <ListItem key={index}>
            <ListItemButton
              selected={selectedIndex === index}
              onClick={(event) => handleListItemClick(event, index)}
            >
              <ListItemIcon>{item.icon(selectedIndex === index)}</ListItemIcon>
              <ListItemText
                primaryTypographyProps={{
                  color: selectedIndex === index ? 'primary' : 'default',
                }}
                primary={item.name}
              />
            </ListItemButton>
          </ListItem>
        )
      )}
    </List>
  );

  return (
    <main className={rajdhani.className}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <Drawer
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
            {getList()}
          </Drawer>
          <CssBaseline />
          <Component {...pageProps} />
        </Box>
      </ThemeProvider>
    </main>
  );
}
