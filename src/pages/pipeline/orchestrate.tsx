import styles from '@/styles/Home.module.css';
import useSWR from 'swr';
import { PageHead } from '@/components/PageHead';
import { Flows } from '@/components/Flows/Flows';
import { useEffect, useState } from 'react';
import FlowCreate from '@/components/Flows/FlowCreate';
import { backendUrl } from '@/config/constant';
import { CircularProgress } from '@mui/material';

export default function Orchestrate() {
  const [crudVal, setCrudVal] = useState<string>('index'); // can be index or create
  const [flows, setFlows] = useState<Array<any>>([]);
  const [selectedFlow, setSelectedFlow] = useState('');

  const updateCrudVal = (crudState: string) => {
    setCrudVal(crudState);
  };

  const { data, mutate, isLoading } = useSWR(
    `${backendUrl}/api/prefect/flows/`
  );

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
        {crudVal === 'index' &&
          (isLoading ? (
            <CircularProgress />
          ) : (
            <Flows
              flows={flows}
              updateCrudVal={updateCrudVal}
              mutate={mutate}
              setSelectedFlow={setSelectedFlow}
            />
          ))}
        {crudVal === 'create' && (
          <FlowCreate updateCrudVal={updateCrudVal} mutate={mutate} />
        )}
        {crudVal === 'update' && (
          <FlowCreate
            setSelectedFlow={setSelectedFlow}
            flowId={selectedFlow}
            updateCrudVal={updateCrudVal}
            mutate={mutate}
          />
        )}
      </main>
    </>
  );
}
