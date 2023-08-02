// import AnalysisIcon from '@/assets/icons/analysis';
import IngestIcon from '@/assets/icons/ingest';
import TransformIcon from '@/assets/icons/transform';
import PipelineIcon from '@/assets/icons/pipeline';
import OrchestrateIcon from '@/assets/icons/orchestrate';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

import { primaryColor } from './theme';

export const drawerWidth = 250;

const getColor = (selected: boolean) => (selected ? primaryColor : '');

export interface MenuOption {
  index: number;
  title: string;
  path: string;
  icon: (selected: boolean) => JSX.Element;
  parent?: number;
}

export const sideMenu: MenuOption[] = [
  // This will be added at a later stage
  // {
  //   index: 1,
  //   title: 'Analysis',
  //   path: '/analysis',
  //   icon: (selected: boolean) => <AnalysisIcon fill={getColor(selected)} />,
  // },
  {
    index: 2,
    title: 'Pipeline overview',
    path: '/pipeline',
    icon: (selected: boolean) => <PipelineIcon fill={getColor(selected)} />,
  },

  {
    index: 2.1,
    title: 'Ingest',
    icon: (selected: boolean) => <IngestIcon fill={getColor(selected)} />,
    path: '/pipeline/ingest',
    parent: 2,
  },
  {
    index: 2.2,
    title: 'Transform',
    icon: (selected: boolean) => <TransformIcon fill={getColor(selected)} />,
    parent: 2,
    path: '/pipeline/transform',
  },
  {
    index: 2.3,
    title: 'Orchestrate',
    icon: (selected: boolean) => <OrchestrateIcon fill={getColor(selected)} />,
    path: '/pipeline/orchestrate',
    parent: 2,
  },

  {
    index: 3,
    title: 'User management',
    path: '/user-management',
    icon: () => <SupervisorAccountIcon />,
  },
];
