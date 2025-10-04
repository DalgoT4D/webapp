import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { httpGet } from '@/helpers/http';

export enum FeatureFlagKeys {
  LOG_SUMMARIZATION = 'LOG_SUMMARIZATION',
  EMBED_SUPERSET = 'EMBED_SUPERSET',
  USAGE_DASHBOARD = 'USAGE_DASHBOARD',
  DATA_QUALITY = 'DATA_QUALITY',
  AI_DATA_ANALYSIS = 'AI_DATA_ANALYSIS',
  DATA_STATISTICS = 'DATA_STATISTICS',
}

interface FeatureFlags {
  [key: string]: boolean;
}

interface UseFeatureFlagsReturn {
  flags: FeatureFlags | undefined;
  isLoading: boolean;
  error: any;
  isFeatureFlagEnabled: (flagName: FeatureFlagKeys) => boolean;
}

const fetcher = async (url: string, session: any) => {
  if (!session) return null;
  return httpGet(session, url);
};

export const useFeatureFlags = (): UseFeatureFlagsReturn => {
  const { data: session } = useSession();

  const {
    data: flags,
    error,
    isLoading,
  } = useSWR(session ? 'organizations/flags' : null, (url) => fetcher(url, session), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isFeatureFlagEnabled = (flagName: FeatureFlagKeys): boolean => {
    return Boolean(flags?.[flagName]);
  };

  return {
    flags,
    isLoading,
    error,
    isFeatureFlagEnabled,
  };
};
