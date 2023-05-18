import styles from '@/styles/Home.module.css';
import { Box, Button, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import Flows from '@/components/Flows/Flows';
import { useEffect, useState } from 'react';
import FlowCreate from '@/components/Flows/FlowCreate';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';

export default function Orchestrate() {
  const [crudVal, setCrudVal] = useState<string>('index'); // can be index or create
  const [flows, setFlows] = useState<Array<any>>([]);

  const updateCrudVal = (crudState: string) => {
    setCrudVal(crudState);
  };

  const { data: session }: any = useSession();

  useEffect(() => {
    (async () => {
      await fetch(`${backendUrl}/api/prefect/flows/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session?.user.token}`,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          setFlows(data);
        })
        .catch((err) => {
          console.log('something went wrong', err);
        });
    })();
  }, []);

  return (
    <>
      <PageHead title="Orchestrate" />
      <main className={styles.main}>
        {crudVal === 'index' ? (
          <Flows flows={flows} updateCrudVal={updateCrudVal} />
        ) : (
          <FlowCreate updateCrudVal={updateCrudVal} />
        )}
      </main>
    </>
  );
}
