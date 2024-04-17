import AnalysisIcon from '@/assets/icons/analysis';
import UsageIcon from '@/assets/icons/UsageIcon';
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
  className?: string;
}

export const sideMenu: MenuOption[] = [
  // This will be added at a later stage
  {
    index: 1,
    title: 'Analysis',
    path: '/analysis',
    icon: (selected: boolean) => <AnalysisIcon fill={getColor(selected)} />,
    className: 'analysis_walkthrough',
  },
  {
    index: 1.1,
    title: 'Usage',
    path: '/analysis/usage',
    icon: (selected: boolean) => <UsageIcon fill={getColor(selected)} />,
    parent: 1,
    className: 'usage_walkthrough',
  },
  {
    index: 2,
    title: 'Pipeline overview',
    path: '/pipeline',
    icon: (selected: boolean) => <PipelineIcon fill={getColor(selected)} />,
    className: 'pipeline_walkthrough',
  },

  {
    index: 2.1,
    title: 'Ingest',
    icon: (selected: boolean) => <IngestIcon fill={getColor(selected)} />,
    path: '/pipeline/ingest',
    parent: 2,
    className: 'ingest_walkthrough',
  },
  {
    index: 2.2,
    title: 'Transform',
    icon: (selected: boolean) => <TransformIcon fill={getColor(selected)} />,
    parent: 2,
    path: '/pipeline/transform',
    className: 'transform_walkthrough',
  },
  {
    index: 2.3,
    title: 'Orchestrate',
    icon: (selected: boolean) => <OrchestrateIcon fill={getColor(selected)} />,
    path: '/pipeline/orchestrate',
    parent: 2,
    className: 'orchestrate_walkthrough',
  },

  {
    index: 3,
    title: 'User management',
    path: '/user-management',
    icon: () => <SupervisorAccountIcon />,
    className: 'usermanagement_walkthrough',
  },
];
