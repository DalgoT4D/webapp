import AnalysisIcon from '@/assets/icons/analysis';
import UsageIcon from '@/assets/icons/UsageIcon';
import AiAnalysisIcon from '@/assets/icons/aianalysis';
import IngestIcon from '@/assets/icons/ingest';
import TransformIcon from '@/assets/icons/transform';
import PipelineIcon from '@/assets/icons/pipeline';
import OrchestrateIcon from '@/assets/icons/orchestrate';
import DataQualityIcon from '@/assets/icons/dataQuality';
import ExploreIcon from '@/assets/icons/explore';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';

import { primaryColor } from './theme';
import Settings from '@/assets/icons/settings';
import User from '@/assets/icons/manage_accounts';
import AiSettings from '@/assets/icons/aisettings';

export const drawerWidth = 250;

const getColor = (selected: boolean) => (selected ? primaryColor : '');

export interface MenuOption {
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

export const sideMenu: MenuOption[] = [
  // This will be added at a later stage
  {
    index: 1,
    title: 'Analysis',
    path: '/analysis',
    icon: (selected: boolean) => <AnalysisIcon fill={getColor(selected)} />,
    className: 'analysis_walkthrough',
    minimize: true,
  },
  {
    index: 1.1,
    title: 'Usage',
    path: '/analysis/usage',
    icon: (selected: boolean) => <UsageIcon fill={getColor(selected)} />,
    parent: 1,
    className: 'usage_walkthrough',
    minimize: true,
  },
  {
    index: 1.2,
    title: 'Data Analysis',
    path: '/analysis/data-analysis',
    icon: (selected: boolean) => <AiAnalysisIcon fill={getColor(selected)} />,
    parent: 1,
    className: 'data_analysis',
    minimize: false,
  },
  {
    index: 2,
    title: 'Pipeline overview',
    path: '/pipeline',
    icon: (selected: boolean) => <PipelineIcon fill={getColor(selected)} />,
    className: 'pipeline_walkthrough',
    permission: 'can_view_dashboard',
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
    title: 'Explore',
    path: '/explore',
    icon: (selected: boolean) => <ExploreIcon fill={getColor(selected)} />,
  },
  {
    index: 4,
    title: 'Data Quality',
    path: '/data-quality',
    icon: (selected: boolean) => <DataQualityIcon fill={getColor(selected)} />,
    className: 'data_quality_walkthrough',
    // hide: !showElementaryMenu,
    minimize: true,
  },
  {
    index: 5,
    title: 'Notifications',
    path: '/notifications',
    icon: () => <MarkEmailUnreadIcon />,
    className: 'notification_walkthrough',
  },
  {
    index: 6,
    title: 'Settings',
    path: '/settings',
    icon: (selected: boolean) => <Settings fill={getColor(selected)} />,
    className: 'settings_walkthrough',
  },
  {
    index: 6.1,
    title: 'User',
    path: '/settings/user-management',
    parent: 6,
    icon: (selected: boolean) => <User fill={getColor(selected)} />,
    className: 'usermanagement_walkthrough',
  },
  {
    index: 6.2,
    title: 'AI settings',
    icon: (selected: boolean) => <AiSettings fill={getColor(selected)} />,
    parent: 6,
    path: '/settings/ai-settings',
    className: 'aisettings_walkthrough',
  },
];
