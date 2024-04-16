import { ControllerRenderProps } from 'react-hook-form';
import { Autocomplete } from '../UI/Autocomplete/Autocomplete';
import { TransformTask } from '../DBT/DBTTarget';
import { useState, useRef } from 'react';
import DeleteIcon from '@/assets/icons/delete.svg';
import DragIcon from '@/assets/icons/drag.svg';

import { NodeApi, Tree } from 'react-arborist';
import { Box } from '@mui/material';
import Image from 'next/image';

interface TaskSequenceProps {
  field: ControllerRenderProps<any, any>;
  options: TransformTask[];
}

export const TaskSequence = ({
  field,
  options: initialOptions,
}: TaskSequenceProps) => {
  const treeRef = useRef();
  const [selectedOptions, setSelectedOptions] = useState<TransformTask[]>(
    initialOptions
      .filter((option) => option.generated_by === 'system')
      .map((option) => ({ ...option }))
      .sort((a, b) => a.seq - b.seq)
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState(
    initialOptions
      .filter((option) => option.generated_by !== 'system')
      .map((option) => ({ ...option }))
  );

  const handleSelect = (_event: any, value: any) => {
    if (value) {
      const runNodeIndex = selectedOptions.findIndex(
        (node) => node.slug === 'dbt-run'
      );
      selectedOptions.splice(runNodeIndex + 1, 0, value);
      const newSelectedOptions = [...selectedOptions];
      const newAutocompleteOptions = autocompleteOptions.filter(
        (option) => option !== value
      );
      setSelectedOptions(newSelectedOptions);
      setAutocompleteOptions(newAutocompleteOptions);
      field.onChange(newSelectedOptions);
    }
  };
  const removeNode = (node: NodeApi<TransformTask>) => {
    const newAutocompleteOptions = [...autocompleteOptions, node.data];

    const newSelectedOptions = selectedOptions.filter(
      (option) => option.uuid !== node.data.uuid
    );

    setSelectedOptions(newSelectedOptions);
    setAutocompleteOptions(newAutocompleteOptions);
    field.onChange(newSelectedOptions);
  };

  function Node({ node, dragHandle }: any) {
    /* This node instance can do many things. See the API reference. */
    return (
      <Box
        ref={dragHandle}
        sx={{
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
        data={selectedOptions}
        idAccessor="uuid"
        onMove={(args) => {
          const currentNodeIndex = args.dragNodes[0].rowIndex as number;

          const data = treeRef.current.props.data;

          const element = data[currentNodeIndex];

          data.splice(currentNodeIndex, 1);
          data.splice(args.index, 0, element);

          setSelectedOptions([...data]);
        }}
        disableDrag={(data) => data.generated_by === 'system'}
        width={'100%'}
        indent={32}
        className="task-tree"
        rowHeight={50}
        overscanCount={1}
        paddingTop={30}
        paddingBottom={10}
        disableDrop={(node) => {
          const tree = node.parentNode.tree;
          const nodes = tree.visibleNodes;

          let runNodeIndex = 0;
          let testNodeIndex = 0;
          const runNode = nodes.find((node) => node.data.command === 'dbt run');
          const testNode = nodes.find(
            (node) => node.data.command === 'dbt test'
          );

          if (runNode) {
            runNodeIndex = tree.idToIndex[runNode.id];
          }
          if (testNode) {
            testNodeIndex = tree.idToIndex[testNode.id];
          }
          if (node.index > runNodeIndex && node.index < testNodeIndex)
            return false;

          return true;
        }}
      >
        {Node}
      </Tree>
    </>
  );
};
