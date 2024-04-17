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
    if (value) {
      const selectedOptions = field.value;
      const newSelectedOptions = [...selectedOptions, value];

      field.onChange(newSelectedOptions);
    }
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
          maxWidth: '500px',
          display: 'flex',
          alignItems: 'center',

          fontWeight: 600,
        }}
      >
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
        data={field.value}
        idAccessor="uuid"
        onMove={(args) => {
          const currentNodeIndex = args.dragNodes[0].rowIndex as number;
          const data = treeRef.current.props.data;
          const element = data[currentNodeIndex];

          if (currentNodeIndex < args.index) {
            for (let i = currentNodeIndex; i < args.index; i++) {
              data[i] = data[i + 1];
            }
          } else {
            for (let i = currentNodeIndex; i > args.index; i--) {
              data[i] = data[i - 1];
            }
          }

          data[args.index] = element;

          field.onChange(data);
        }}
        width={'100%'}
        indent={32}
        className="task-tree"
        rowHeight={50}
        overscanCount={1}
        paddingTop={30}
        paddingBottom={10}
      >
        {Node}
      </Tree>
    </>
  );
};
