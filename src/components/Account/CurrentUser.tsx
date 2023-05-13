/**
 * CurrentUser component
 * Shows the logged-in user
 * Currently used during development, we may put it into the navbar at some point
 * Invoked via
 *    <CurrentUser />
 */

import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export const CurrentUser = () => {

  const { data: session }: any = useSession();
  const [currentUser, setCurrentUser] = useState({ email: null, org: { name: null } });

  async function fetchCurrentUser() {

    if (!session) {
      return;
    }

    await fetch(`${backendUrl}/api/currentuser`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {

      if (response.ok) {
        response.json().then((message) => {
          // console.log(message);
          setCurrentUser(message);
        });
      } else {

        response.json().then((message) => {
          console.error(message);
        })
      }
    });
  }

  if (!currentUser.email) {
    fetchCurrentUser();
  }

  return (
    <>
      {currentUser &&
        <>
          <div>{currentUser.email} | {(currentUser.org && currentUser.org.name) || "no-org"}</div>
        </>
      }
    </>
  );
};

