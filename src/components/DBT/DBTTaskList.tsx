import {
  Box,
  Text,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import React, { useContext } from 'react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import {TransformTask} from './DBTTarget';

type params = {
  tasks: TransformTask[];
}

export const DBTTaskList = ({tasks}: params) => {

  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const executeDbtJob = async function (task: TransformTask) {

    try {
      let message = null;
      message = await httpPost(session, `prefect/tasks/${task.id}/run/`, {});
      if (message?.status === 'success') {
        successToast('Job ran successfully', [], toastContext);
      } else {
        errorToast('Job failed', [], toastContext);
      }

    } catch (err: any) {
      console.error(err.cause);
      errorToast(err.message, [], toastContext);
    }

  };

  const contructRow = (task: TransformTask) => {
    return (
      <TableRow key={task.id}>
        <TableCell>{task.label}</TableCell>
        <TableCell>{task.command}</TableCell>
        <TableCell>
          { task.lock ? (
            <Text>Running</Text>
          ) : (
            <Button onClick={() => executeDbtJob(task)}>Run</Button>
          )
          }
        </TableCell>
      </TableRow>
    );
  }


  return (
    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
    <Table sx={{maxWidth: '600px'}}>
      <TableHead className="bg-gray-50">
        <TableRow>
          <TableCell>Task</TableCell>
          <TableCell>Command</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tasks.map((task) => (
          contructRow(task)
        ))}
      </TableBody>
    </Table>
    </Box>
  )
};