import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export const DBTCreateProfile = () => {

  const { data: session }: any = useSession();
  const [failureMessage, setFailureMessage] = useState<string>('');
  const [blockNames, setBlockNames] = useState<string[]>([]);

  type dbtBlock = {
    blockType: string,
    blockId: string,
    blockName: string,
  };

  const fetchDbtBlocks = async function () {

    const response = await fetch(`${backendUrl}/api/prefect/blocks/dbt/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    });

    if (response.ok) {
      const message = await response.json();
      console.log(message);
      setBlockNames(message.map((block: dbtBlock) => block.blockName))
    } else {
      const error = await response.json();
      setFailureMessage(JSON.stringify(error));
    }
  };

  useEffect(() => { fetchDbtBlocks() }, []);

  return (
    <>
      {failureMessage &&
        <div style={{ color: 'red', padding: '5px', borderRadius: '2px', marginTop: '5px' }}>{failureMessage}</div>
      }

      {blockNames &&
        blockNames.map((blockName) =>
          <div>{blockName}</div>
        )
      }
    </>
  );
}
