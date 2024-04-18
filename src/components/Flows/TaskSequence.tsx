import { ControllerRenderProps } from 'react-hook-form';
import { Autocomplete } from '../UI/Autocomplete/Autocomplete';
import { TransformTask } from '../DBT/DBTTarget';
import { useState, useRef, useEffect } from 'react';
import DeleteIcon from '@/assets/icons/delete.svg';
import DragIcon from '@/assets/icons/drag.svg';

import { NodeApi, Tree } from 'react-arborist';
import { Box } from '@mui/material';
import Image from 'next/image';

interface TaskSequenceProps {
  field: ControllerRenderProps<any, any>;
  options: TransformTask[];
}

const dbtCommands = ['git-pull', 'dbt-clean', 'dbt-deps'];

const getInsertIndex = (array: any) => {
  const slugArray = array.map((value: TransformTask) => value.slug);
  let insertIndex = slugArray.indexOf('dbt-run');
  if (insertIndex === -1) insertIndex = slugArray.indexOf('dbt-deps');
  if (insertIndex === -1) insertIndex = slugArray.indexOf('dbt-clean');
  if (insertIndex === -1) insertIndex = slugArray.indexOf('git-pull');
  if (insertIndex === -1) insertIndex = 0;

  return insertIndex;
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

    const selectedOptions = field.value;

    const insertIndex = getInsertIndex(field.value);

    if (dbtCommands.includes(value.slug)) {
      selectedOptions.splice(dbtCommands.indexOf(value.slug), 0, value);
    } else {
      selectedOptions.splice(insertIndex + 1, 0, value); // Insert after insert point
    }

    field.onChange(selectedOptions);
  };

  const removeNode = (node: NodeApi<TransformTask>) => {
    const selectedOptions = field.value;

    const newSelectedOptions = selectedOptions.filter(
      (option) => option.uuid !== node.data.uuid
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
    const finalIndex = args.index - 1;

    const currentNodeIndex = args.dragNodes[0].rowIndex as number;
    const data = treeRef.current.props.data;

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
        inputValue=""
        getOptionLabel={(task: any) => task.command}
        placeholder="Select"
        options={autocompleteOptions}
        onChange={handleSelect}
      />
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
        paddingTop={30}
        paddingBottom={30}
        disableDrag={(node: any) => node.generated_by === 'system'}
        disableDrop={(node) => {
          // only allow drop between run and test line item
          const tree = node.parentNode.tree;
          const nodes = tree.visibleNodes;

          let testNodeIndex = 0;
          const runNodeIndex = getInsertIndex(nodes.map((node) => node.data));
          const testNode = nodes.find(
            (node) => node.data.command === 'dbt test'
          );

          if (testNode) {
            testNodeIndex = tree.idToIndex[testNode.id];
          }
          if (node.index > runNodeIndex && node.index <= testNodeIndex)
            return false;

          return true;
        }}
      >
        {Node}
      </Tree>
    </>
  );
};
