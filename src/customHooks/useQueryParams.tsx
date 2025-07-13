import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const useQueryParams = ({
  tabsObj,
  basePath,
  defaultTab,
}: {
  tabsObj: { [key: string]: number };
  basePath: string;
  defaultTab: string;
}) => {
  const router = useRouter();

  const { tab }: any = router.query;
  const currentTab =
    tab && typeof tab === 'string' && tab in tabsObj ? +tabsObj[tab] : +tabsObj[defaultTab];

  const reverseTabsObj = Object.entries(tabsObj).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key }),
    {} as { [key: number]: string }
  );

  const [value, setValue] = useState(currentTab);

  // Helper function to preserve existing query parameters
  const buildQueryString = (newTab: string) => {
    const { tab, ...otherParams } = router.query;
    const params = new URLSearchParams();

    // Add the new tab parameter
    params.set('tab', newTab);

    // Preserve other existing query parameters
    Object.entries(otherParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value as string);
        }
      }
    });

    return params.toString();
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (!tab || !(tab in tabsObj)) {
      //check for the first render and also if user put wrong query params
      const queryString = buildQueryString(defaultTab);
      router.replace(`${basePath}?${queryString}`, undefined, { shallow: true });
    } else {
      setValue(currentTab);
    }
  }, [router.isReady, tab, tabsObj, currentTab, basePath, defaultTab]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const tabName = reverseTabsObj[newValue];
    if (tabName) {
      setValue(newValue);
      const queryString = buildQueryString(tabName);
      router.push(`${basePath}?${queryString}`, undefined, { shallow: true });
    }
  };
  return { value, handleChange };
};
