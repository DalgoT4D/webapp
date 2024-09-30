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
import { TransformTask } from '@/components/DBT/DBTTarget';

const command: any = {
  systemCommands: {
    'git-pull': 1,
    'dbt-clean': 2,
    'dbt-deps': 3,
    'dbt-run': 4,
    'dbt-test': 7,
    'dbt-docs-generate': 8,
  },
  customCommands: {
    'dbt-run': 5,
    'dbt-test': 6,
  },
};

const getOrder = (task: TransformTask) => {
  if (task.generated_by === 'system') {
    return command.systemCommands[task.slug];
  } else {
    return command.customCommands[task.slug] || 5;
  }
};

export default function Orchestrate() {
  const [crudVal, setCrudVal] = useState<string>('index'); // can be index or create
  const [flows, setFlows] = useState<Array<any>>([]);
  const [selectedFlowId, setSelectedFlowId] = useState('');
  const { data: session }: any = useSession();
  const [tasks, setTasks] = useState<Array<TransformTask>>([]);

  const updateCrudVal = (crudState: string) => {
    setCrudVal(crudState);
  };

  const { data, mutate, isLoading } = useSWR(`prefect/v1/flows/`);

  const pollFlowsLock = async () => {
    let isLocked = true;
    try {
      while (isLocked) {
        await delay(3000);
        const flows = await httpGet(session, 'prefect/v1/flows/');
        isLocked = flows?.some((flow: any) => (flow.lock ? true : false));
        setFlows(flows);
      }
    } catch (error) {
      isLocked = false;
    }
  };

  // when the flows list changes
  useEffect(() => {
    const isLocked: boolean = data?.some((flow: any) => (flow.lock ? true : false));

    if (data && data.length >= 0) {
      setFlows(data);
    }

    if (isLocked) pollFlowsLock();
  }, [data]);

  useEffect(() => {
    if (session) {
      (async () => {
        try {
          const response = await httpGet(session, 'prefect/tasks/transform/');
          setTasks(
            response.map((task: TransformTask) => ({
              ...task,
              order: getOrder(task),
            }))
          );
        } catch (error) {
          console.error(error);
        }
      })();
    }
  }, [session]);

  return (
    <>
      <PageHead title="Dalgo | Orchestrate" />
      <main className={styles.main}>
        {crudVal === 'index' &&
          (isLoading ? (
            <CircularProgress />
          ) : (
            <Flows
              flows={flows}
              updateCrudVal={updateCrudVal}
              mutate={mutate}
              setSelectedFlowId={setSelectedFlowId}
            />
          ))}
        {crudVal === 'create' && (
          <FlowCreate updateCrudVal={updateCrudVal} mutate={mutate} tasks={tasks} />
        )}
        {crudVal === 'update' && (
          <FlowCreate
            setSelectedFlowId={setSelectedFlowId}
            flowId={selectedFlowId}
            updateCrudVal={updateCrudVal}
            mutate={mutate}
            tasks={tasks}
          />
        )}
      </main>
    </>
  );
}
