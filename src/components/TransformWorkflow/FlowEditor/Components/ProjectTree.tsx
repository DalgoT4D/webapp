import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Tree } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@/assets/icons/datatable.svg';
import { DbtSourceModel } from './Canvas';
import { NodeApi } from 'react-arborist';
import AddIcon from '@mui/icons-material/Add';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import useResizeObserver from 'use-resize-observer';
import { trimString } from '@/utils/common';
import Image from 'next/image';

const Node = ({ node, style, dragHandle }: any) => {
  /* This node instance can do many things. See the API reference. */
  const data: DbtSourceModel = node.data;
  let name: string | JSX.Element = !node.isLeaf ? data.schema : data.input_name;
  name = trimString(name, 25);

  return (
    <Box
      style={style}
      ref={dragHandle}
      sx={{
        alignItems: 'center',
        display: 'flex',
        mr: 2,
      }}
      onClick={() => (node.isLeaf ? undefined : node.toggle())}
    >
      {node.isLeaf ? (
        <Image src={TocIcon} alt="delete icon" />
      ) : node.isOpen ? (
        <FolderOpenIcon />
      ) : (
        <FolderIcon />
      )}
      <Box sx={{ display: 'flex', width: '1000px' }}>
        <Typography sx={{ ml: 1, minWidth: 0, fontWeight: 600 }}>
          {name}
        </Typography>
        {node.isLeaf && (
          <AddIcon
            sx={{ ml: 'auto', cursor: 'pointer' }}
            onClick={() => node.toggle()}
          />
        )}
      </Box>
    </Box>
  );
};

interface ProjectTreeProps {
  dbtSourceModels: DbtSourceModel[];
}

// type TreeData = Partial<DbtSourceModel> & { children: TreeData[] };

const ProjectTree = ({ dbtSourceModels }: ProjectTreeProps) => {
  const { canvasAction, setCanvasAction } = useCanvasAction();
  const { ref, width, height } = useResizeObserver();
  const [projectTreeData, setProjectTreeData] = useState<any[]>([]);

  const constructAndSetProjectTreeData = (
    dbtSourceModels: DbtSourceModel[]
  ) => {
    // group by schema and push dbtSourceModels under the children key
    const leafNodesBySchema = dbtSourceModels.reduce((acc, dbtSourceModel) => {
      const schema = dbtSourceModel.schema;
      if (schema in acc) {
        acc[schema].push(dbtSourceModel);
      } else {
        acc[schema] = [dbtSourceModel];
      }
      return acc;
    }, {} as { [key: string]: DbtSourceModel[] });

    // construct the tree data
    const treeData = Object.keys(leafNodesBySchema).map(
      (schema: string, idx: number) => {
        return {
          id: String(idx + 1),
          schema: schema,
          children: leafNodesBySchema[schema],
        };
      }
    );

    console.log('tree data', treeData);

    setProjectTreeData([{ id: '0', schema: 'Store', children: treeData }]);
  };

  useEffect(() => {
    if (dbtSourceModels) {
      console.log('rerendeirng project tree');
      constructAndSetProjectTreeData(dbtSourceModels);
    }
  }, [dbtSourceModels]);

  const handleNodeClick = (nodes: NodeApi<any>[]) => {
    if (nodes.length > 0 && nodes[0].isLeaf) {
      console.log(
        'adding a node to canvas from project tree component',
        nodes[0].data
      );
      setCanvasAction({ type: 'add-srcmodel-node', data: nodes[0].data });
    }
  };

  // const projectTreeData = [
  //   {
  //     id: '1',
  //     schema: 'Store',
  //     children: [
  //       {
  //         id: '2',
  //         schema: 'staging',
  //         children: [
  //           {
  //             id: 'c1',
  //             schema: 'staging',
  //             input_name: 'table1',
  //             source_name: 'source',
  //             input_type: 'source',
  //           },
  //           {
  //             id: 'c2',
  //             schema: 'staging',
  //             input_name: 'table2',
  //             source_name: 'source',
  //             input_type: 'source',
  //           },
  //           {
  //             id: 'c3',
  //             schema: 'staging',
  //             input_name: 'table3',
  //             source_name: 'source',
  //             input_type: 'source',
  //           },
  //         ],
  //       },
  //       {
  //         id: '3',
  //         schema: 'intermediate',
  //         children: [
  //           {
  //             id: 'd1',
  //             schema: 'staging',
  //             input_name: 'table4',
  //             source_name: 'source',
  //             input_type: 'source',
  //           },
  //           {
  //             id: 'd2',
  //             schema: 'staging',
  //             input_name: 'table5',
  //             source_name: 'source',
  //             input_type: 'source',
  //           },
  //           {
  //             id: 'd3',
  //             schema: 'staging',
  //             input_name: 'table6',
  //             source_name: 'source',
  //             input_type: 'source',
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // ];

  return (
    <Box
      sx={{
        height: '100%',
      }}
    >
      <Box
        sx={{
          height: '44px',
          background: '#F5FAFA',
          border: '1px #CCD6E2 solid',
          borderLeft: 0,
          borderRight: 0,
        }}
      ></Box>
      <Box
        sx={{
          p: '10px',
          pr: 0,
          pb: 0,
          height: 'calc(100% - 44px)',
        }}
        ref={ref}
      >
        <Tree
          childrenAccessor={(d: any) => d.children}
          openByDefault={true}
          data={projectTreeData}
          height={height}
          width={width}
          rowHeight={30}
          onSelect={handleNodeClick}
        >
          {Node}
        </Tree>
      </Box>
    </Box>
  );
};

export default ProjectTree;
