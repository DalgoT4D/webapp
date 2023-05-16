import styles from '@/styles/Home.module.css';
import { Box, Button, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import Flows from '@/components/Flows/Flows';
import { useState } from 'react';
import FlowCreate from '@/components/Flows/FlowCreate';

export default function Orchestrate() {
  const [crudVal, setCrudVal] = useState<string>('index'); // can be index or create

  const updateCrudVal = (crudState: string) => {
    setCrudVal(crudState);
  };

  const fakeData = [
    {
      name: 'flow1',
      schedule: 'daily',
      status: 'active',
    },
    {
      name: 'flow2',
      schedule: 'monthly',
      status: 'active',
    },
  ];

  return (
    <>
      <PageHead title="Orchestrate" />
      <main className={styles.main}>
        {crudVal === 'index' ? (
          <Flows flows={fakeData} updateCrudVal={updateCrudVal} />
        ) : (
          <FlowCreate updateCrudVal={updateCrudVal} />
        )}
      </main>
    </>
  );
}
