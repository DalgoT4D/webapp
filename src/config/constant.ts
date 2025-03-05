export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
export const showElementaryMenu = process.env.NEXT_PUBLIC_SHOW_ELEMENTARY_MENU === 'true'; // Data quality
export const showDataInsightsTab = process.env.NEXT_PUBLIC_SHOW_DATA_INSIGHTS_TAB === 'true'; //Data insights in UI4T lower pane.
export const showDataAnalysisTab = process.env.NEXT_PUBLIC_SHOW_DATA_ANALYSIS_TAB === 'true'; // Data Analysis
export const showSupersetUsageTab = process.env.NEXT_PUBLIC_SHOW_SUPERSET_USAGE_TAB === 'true'; // Usage
export const showSupersetAnalysisTab =
  process.env.NEXT_PUBLIC_SHOW_SUPERSET_ANALYSIS_TAB === 'true'; // Analysis.
export const defaultLoadMoreLimit = parseInt(
  process.env.NEXT_PUBLIC_DEFAULT_LOAD_MORE_LIMIT || '3'
);
export const orgSlugsWithAccessToV2DataAnalysisTab =
  process.env.NEXT_PUBLIC_SHOW_V2DATAANALYSIS_ORGS_SLUG?.split(',') || [];
export const dalgoWhitelistIps = process.env.NEXT_PUBLIC_DALGO_WHITELIST_IPS?.split(',') || [];

export const flowRunLogsOffsetLimit = 200;

export const usageDashboardId = process.env.NEXT_PUBLIC_USAGE_DASHBOARD_ID;

export const usageDashboardDomain = process.env.NEXT_PUBLIC_USAGE_DASHBOARD_DOMAIN;

// Master task slugs
export const TASK_DBTRUN = 'dbt-run';
export const TASK_DBTTEST = 'dbt-test';
export const TASK_DBTCLEAN = 'dbt-clean';
export const TASK_DBTDEPS = 'dbt-deps';
export const TASK_GITPULL = 'git-pull';
export const TASK_DOCSGENERATE = 'dbt-docs-generate';
export const TASK_DBTCLOUD_JOB = 'dbt-cloud-job';

// Demo account
export const demoAccDestSchema = process.env.NEXT_PUBLIC_DEMO_ACCOUNT_DEST_SCHEMA;

// Product walkthrough for demo account
export const demoProductWalkthrough = process.env.NEXT_PUBLIC_DEMO_WALKTRHOUGH_ENABLED || false;

// alpha features
export const enableLogSummaries = process.env.NEXT_PUBLIC_ENABLE_LOG_SUMMARIES;
