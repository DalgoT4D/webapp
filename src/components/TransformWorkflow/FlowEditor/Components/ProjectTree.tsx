import { Box, Typography } from '@mui/material';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Tree, NodeRendererProps } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@mui/icons-material/Toc';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';
import { flow } from 'cypress/types/lodash';
import { useSession } from 'next-auth/react';
import { DbtSourceModel } from '../FlowEditor';
import { event } from 'cypress/types/jquery';
import { NodeApi } from 'react-arborist';

const Node = ({ node, style, dragHandle }: any) => {
  /* This node instance can do many things. See the API reference. */
  const data: DbtSourceModel = node.data;

  return (
    <Box
      style={style}
      ref={dragHandle}
      sx={{
        alignItems: 'center',
        display: 'flex',
        background: node.isSelected ? 'grey' : '',
        maxWidth: '70%',
      }}
      onClick={() => node.toggle()}
    >
      {node.isLeaf ? (
        <TocIcon />
      ) : node.isOpen ? (
        <FolderOpenIcon />
      ) : (
        <FolderIcon />
      )}
      <Typography sx={{ wordWrap: 'break-word', minWidth: 0 }}>
        {!node.isLeaf ? data.schema : data.input_name}
      </Typography>
    </Box>
  );
};

interface ProjectTreeProps {
  dbtSourceModels: DbtSourceModel[];
}

// type TreeData = Partial<DbtSourceModel> & { children: TreeData[] };

const ProjectTree = ({ dbtSourceModels }: ProjectTreeProps) => {
  const { data: session } = useSession();
  const flowEditorContext = useContext(FlowEditorContext);
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

    setProjectTreeData([{ id: '0', schema: 'Store', children: treeData }]);
  };

  useMemo(() => {
    if (dbtSourceModels) {
      constructAndSetProjectTreeData(dbtSourceModels);
    }
  }, [dbtSourceModels]);

  const handleNodeClick = (nodes: NodeApi<any>[]) => {
    console.log('node clicked', nodes);
    if (nodes.length > 0 && nodes[0].isLeaf) {
      flowEditorContext?.NodeActionTodo.dispatch({
        type: 'new',
        actionState: {
          node: nodes[0].data,
          toDo: 'new',
        },
      });
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
    <Box sx={{ padding: '10px' }}>
      <Tree
        childrenAccessor={(d: any) => d.children}
        openByDefault={true}
        data={projectTreeData}
        rowHeight={30}
        height={1000}
        onSelect={handleNodeClick}
      >
        {Node}
      </Tree>
    </Box>
  );
};

export default ProjectTree;
