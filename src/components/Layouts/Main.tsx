import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';

import { SideDrawer } from '../SideDrawer/SideDrawer';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  return session?.user.token ? (
    <SWRConfig
      value={{
        fetcher: (resource, init) =>
          fetch(resource, {
            headers: {
              Authorization: `Bearer ${session?.user.token}`,
            },
          }).then((res) => res.json()),
      }}
    >
      <SideDrawer /> {children}
    </SWRConfig>
  ) : (
    children
  );
};
