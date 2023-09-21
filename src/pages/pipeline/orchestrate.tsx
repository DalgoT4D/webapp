import styles from '@/styles/Home.module.css';
import useSWR from 'swr';
import { PageHead } from '@/components/PageHead';
import { Flows } from '@/components/Flows/Flows';
import { useEffect, useState } from 'react';
import FlowCreate from '@/components/Flows/FlowCreate';
import { CircularProgress } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { delay } from '@/utils/common';

export default function Orchestrate() {
  const [crudVal, setCrudVal] = useState<string>('index'); // can be index or create
  const [flows, setFlows] = useState<Array<any>>([]);
  const [selectedFlow, setSelectedFlow] = useState('');
  const { data: session }: any = useSession();

  const updateCrudVal = (crudState: string) => {
    setCrudVal(crudState);
  };

  const { data, mutate, isLoading } = useSWR(`prefect/flows/`);

  const pollFlowsLock = async () => {
    let isLocked = true;
    try {
      while (isLocked) {
        await delay(3000);
        const flows = await httpGet(session, 'prefect/flows/');
        isLocked = flows?.some((flow: any) => (flow.lock ? true : false));
        setFlows(flows);
      }
    } catch (error) {
      isLocked = false;
    }
  };

  // when the flows list changes
  useEffect(() => {
    const isLocked: boolean = flows?.some((flow: any) =>
      flow.lock ? true : false
    );

    if (data && data.length >= 0) {
      setFlows(data);
    }

    if (isLocked) pollFlowsLock();
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
