import { Box } from '@mui/material';
import React from 'react';
import { Tree } from 'react-arborist';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TocIcon from '@mui/icons-material/Toc';

const Node = ({ node, style, dragHandle }: any) => {
  /* This node instance can do many things. See the API reference. */
  return (
    <Box
      style={style}
      ref={dragHandle}
      sx={{
        alignItems: 'center',
        display: 'flex',
        marginLeft: `${node.depth * 20}px`,
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
      {node.data.name}
    </Box>
  );
};

const ProjectTree = ({}) => {
  const projectTreeData = [
    {
      id: '1',
      name: 'Store',
      children: [
        {
          id: '2',
          name: 'staging',
          children: [
            { id: 'c1', name: 'table1' },
            { id: 'c2', name: 'table2' },
            { id: 'c3', name: 'table3' },
          ],
        },
        {
          id: '3',
          name: 'intermediate',
          children: [
            { id: 'd1', name: 'table4' },
            { id: 'd2', name: 'table5' },
            { id: 'd3', name: 'table6' },
          ],
        },
      ],
    },
  ];

  return (
    <Box sx={{ padding: '10px' }}>
      <Tree
        childrenAccessor={(d: any) => d.children}
        openByDefault={true}
        data={projectTreeData}
        height={1000}
        rowHeight={30}
      >
        {Node}
      </Tree>
    </Box>
  );
};

export default ProjectTree;
