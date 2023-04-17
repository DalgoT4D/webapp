import { SideDrawer } from '../SideDrawer/SideDrawer';

export const Main = ({ children }: any) => {
  return (
    <>
      <SideDrawer />
      {children}
    </>
  );
};
