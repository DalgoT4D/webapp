const nodeGap = 30;

export const getNextNodePosition = (nodes: any) => {
  let rightMostX = nodes && nodes.length > 0 ? Number.NEGATIVE_INFINITY : 0;
  let rightMostY = 0;
  let rightMostHeight = 0;

  for (const node of nodes) {
    if (node.position.x > rightMostX) {
      rightMostX = node.position.x;
      rightMostY = node.position.y;
      rightMostHeight = node.height;
    }
  }

  // Position the new node below the right-most element with a gap
  const x = rightMostX;
  const y = rightMostY + rightMostHeight + nodeGap;

  return { x, y };
};
