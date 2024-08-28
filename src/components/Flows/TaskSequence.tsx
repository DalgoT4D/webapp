import { ControllerRenderProps } from 'react-hook-form';
import { Autocomplete } from '../UI/Autocomplete/Autocomplete';
import { TransformTask } from '../DBT/DBTTarget';
import { useState, useRef, useEffect } from 'react';
import DeleteIcon from '@/assets/icons/delete.svg';
import DragIcon from '@/assets/icons/drag.svg';

import { NodeApi, Tree } from 'react-arborist';
import { Box, Button, Typography } from '@mui/material';
import Image from 'next/image';
import { ValidateDefaultTasksToApplyInPipeline } from './FlowCreate';

interface TaskSequenceProps {
  field: ControllerRenderProps<any, any>;
  options: TransformTask[];
}

const findNearest = (arr: number[], target = 5 /*order for custom tasks*/) => {
  // bounded order for all dbt tasks

  let nearestGreater = 8;

  for (const num of arr) {
    if (num > target && num < nearestGreater) {
      nearestGreater = num;
    }
  }

  return nearestGreater;
};
export const TaskSequence = ({
  field,
  options: initialOptions,
}: TaskSequenceProps) => {
  const treeRef = useRef();

  const [autocompleteOptions, setAutocompleteOptions] = useState<
    TransformTask[]
  >([]);

  useEffect(() => {
    const selectedUuids = field.value.map((task: TransformTask) => task.uuid);
    setAutocompleteOptions(
      initialOptions.filter((option) => !selectedUuids.includes(option.uuid))
    );
  }, [field.value, initialOptions]);

  const handleSelect = (value: any) => {
    if (!value) {
      return;
    }

    const selectedOptions = [...field.value, value];

    selectedOptions.sort((a, b) => a.order - b.order);

    field.onChange([...selectedOptions]);
  };

  const removeNode = (node: NodeApi<TransformTask>) => {
    const selectedOptions = field.value;

    const newSelectedOptions = selectedOptions.filter(
      (option: any) => option.uuid !== node.data.uuid
    );

    field.onChange(newSelectedOptions);
  };

  function Node({ node, dragHandle }: any) {
    /* This node instance can do many things. See the API reference. */
    return (
      <Box
        ref={dragHandle}
        sx={{
          marginTop: '10px',
          maxWidth: '500px',
          display: 'flex',
          alignItems: 'center',

          fontWeight: 600,
        }}
      >
        {node.data.generated_by !== 'system' && (
          <Image
            src={DragIcon}
            style={{
              margin: '4px',
              position: 'absolute',
              left: '-20px',
              cursor: 'grab',
            }}
            alt="drop icon"
            data-testid="dropicon"
          />
        )}

        <Box
          sx={{
            borderRadius: '6px 0px 0px 6px',
            p: '4px 12px',
            width: '30px',
            background: '#33A195',
            color: 'white',
          }}
        >
          {node.rowIndex + 1}
        </Box>
        <Box sx={{ p: '4px 12px', background: '#F5FAFA', width: '100%' }}>
          {node.data.command}
        </Box>
        <Box
          sx={{
            p: '4px 12px',
            marginLeft: 'auto',
            minWidth: '70px',
            width: '80px',
            background: '#33A195',
            color: 'white',
            borderRadius: '0px 6px 6px 0px',
          }}
        >
          {node.data.generated_by}
        </Box>
        <Box
          sx={{ cursor: 'pointer', p: '2px' }}
          onClick={() => removeNode(node)}
        >
          <Image
            src={DeleteIcon}
            style={{ height: '18px', width: '18px', marginLeft: '4px' }}
            alt="delete icon"
          />
        </Box>
      </Box>
    );
  }

  const onMove = (args: any) => {
    if (!treeRef.current) {
      return;
    }
    const ref: any = treeRef.current;
    const finalIndex = args.index - 1;

    const currentNodeIndex = args.dragNodes[0].rowIndex as number;

    const data = ref.props.data;

    const element = data[currentNodeIndex];

    if (currentNodeIndex <= finalIndex) {
      for (let i = currentNodeIndex; i < finalIndex; i++) {
        data[i] = data[i + 1];
      }
      data[finalIndex] = element;
    } else {
      for (let i = currentNodeIndex; i > finalIndex; i--) {
        data[i] = data[i - 1];
      }
      data[finalIndex + 1] = element;
    }

    field.onChange(data);
  };

  return (
    <>
      <Autocomplete
        data-testid="tasksequence"
        inputValue=""
        getOptionLabel={(task: any) => task.command}
        placeholder="Select"
        options={autocompleteOptions}
        onChange={handleSelect}
      />
      <Box sx={{ width: '100%', display: 'flex', mt: 2 }}>
        <Button
          sx={{ ml: 'auto' }}
          variant="contained"
          size="small"
          onClick={() =>
            field.onChange(
              initialOptions.filter(ValidateDefaultTasksToApplyInPipeline)
            )
          }
        >
          Reset to default
        </Button>
      </Box>
      <Typography sx={{ mt: 1 }} variant="body2" gutterBottom>
        These are your default transformation tasks. Most users don&apos;t need
        to change this list
      </Typography>

      <Tree
        ref={treeRef}
        data={field.value}
        idAccessor="uuid"
        onMove={onMove}
        width={'100%'}
        indent={32}
        className="task-tree"
        rowHeight={50}
        height={field.value.length * 40}
        overscanCount={1}
        paddingBottom={30}
        disableDrag={(node: any) => node.generated_by === 'system'}
        disableDrop={(node) => {
          // only allow drop between run and test line item
          const tree = node.parentNode.tree;
          const nodes = tree.visibleNodes;
          const draggedNode = node.dragNodes[0];

          const smallestOrder = draggedNode.data.slug === 'dbt-run' ? 5 : 6;

          const largestOrder = findNearest(
            nodes.map((node) => node.data.order),
            smallestOrder
          );
          let runNodeIndex = 0;
          let testNodeIndex = nodes.length;
          const runNode = nodes.find(
            (node) => node.data.order === smallestOrder
          );
          const testNode = nodes.find(
            (node) => node.data.order === largestOrder
          );

          if (runNode) {
            runNodeIndex = tree.idToIndex[runNode.id];
          }

          if (testNode) {
            testNodeIndex = tree.idToIndex[testNode.id];
          }
          if (node.index >= runNodeIndex && node.index <= testNodeIndex)
            return false;

          return true;
        }}
      >
        {Node}
      </Tree>
    </>
  );
};
