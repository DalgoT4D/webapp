import {
  InboxOutlined,
  DraftsOutlined,
  TransformOutlined,
  EqualizerOutlined,
  HubOutlined,
} from '@mui/icons-material';

export const drawerWidth = 250;

const getColor = (selected: boolean) => (selected ? 'primary' : 'inherit');

export interface MenuOption {
  index: number;
  title: string;
  path: string;
  icon: (selected: boolean) => JSX.Element;
  parent?: number;
}

export const sideMenu: MenuOption[] = [
  {
    index: 1,
    title: 'Analysis',
    path: '/analysis',
    icon: (selected: boolean) => (
      <EqualizerOutlined color={getColor(selected)} />
    ),
  },
  {
    index: 2,
    title: 'Data pipeline',
    path: '/pipeline',
    icon: (selected: boolean) => <InboxOutlined color={getColor(selected)} />,
  },

  {
    index: 2.1,
    title: 'Ingest',
    icon: (selected: boolean) => <HubOutlined color={getColor(selected)} />,
    path: '/pipeline/ingest',
    parent: 2,
  },
  {
    index: 2.2,
    title: 'Transform',
    icon: (selected: boolean) => (
      <TransformOutlined color={getColor(selected)} />
    ),
    parent: 2,
    path: '/pipeline/transform',
  },
  {
    index: 2.3,
    title: 'Orchestrate',
    icon: (selected: boolean) => <DraftsOutlined color={getColor(selected)} />,
    path: '/pipeline/orchestrate',
    parent: 2,
  },
];
