import { useSession } from 'next-auth/react';

import { SideDrawer } from '../SideDrawer/SideDrawer';

export const Main = ({ children }: any) => {
  const { data: session, status } = useSession();

  return (
    <>
      {session ? <SideDrawer /> : ''}
      {children}
    </>
  );
};
