import styles from '@/styles/Home.module.css';
import useSWR from 'swr';
import { PageHead } from '@/components/PageHead';
import Flows from '@/components/Flows/Flows';
import { useEffect, useState } from 'react';
import FlowCreate from '@/components/Flows/FlowCreate';
import { backendUrl } from '@/config/constant';

export default function Orchestrate() {
  const [crudVal, setCrudVal] = useState<string>('index'); // can be index or create
  const [flows, setFlows] = useState<Array<any>>([]);

  const updateCrudVal = (crudState: string) => {
    setCrudVal(crudState);
  };

  const { data, mutate } = useSWR(`${backendUrl}/api/prefect/flows/`);

  // when the flows list changes
  useEffect(() => {
    if (data && data.length > 0) {
      setFlows(data);
    }
  }, [data]);

  return (
    <>
      <PageHead title="Orchestrate" />
      <main className={styles.main}>
        {crudVal === 'index' ? (
          <Flows flows={flows} updateCrudVal={updateCrudVal} mutate={mutate} />
        ) : (
          <FlowCreate updateCrudVal={updateCrudVal} />
        )}
      </main>
    </>
  );
}
