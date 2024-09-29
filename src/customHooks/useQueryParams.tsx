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
    tab && typeof tab === 'string' && tab in tabsObj
      ? +tabsObj[tab]
      : +tabsObj[defaultTab];

  const reverseTabsObj = Object.entries(tabsObj).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key }),
    {} as { [key: number]: string }
  );

  const [value, setValue] = useState(currentTab);

  useEffect(() => {
    if (!router.isReady) return;

    if (!tab || !(tab in tabsObj)) {
      //check for the first render and also if user put wrong query params
      router.replace(`${basePath}?tab=${defaultTab}`, undefined, {
        shallow: true,
      });
    } else {
      setValue(currentTab);
    }
  }, [router.isReady, tab, tabsObj, currentTab, basePath, defaultTab]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const tabName = reverseTabsObj[newValue];
    if (tabName) {
      setValue(newValue);
      router.push(`${basePath}?tab=${tabName}`, undefined, { shallow: true });
    }
  };
  return { value, handleChange };
};
