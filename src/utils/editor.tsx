const nodeGap = 30;
const defaultNodeHeight = 100;
const defaultNodeWidth = 200;

export const getNextNodePosition = (nodes: any) => {
  if (!nodes || nodes.length === 0) {
    return { x: 50, y: 50 };
  }

  let rightMostX = 0;
  let rightMostY = 0;
  let rightMostHeight = defaultNodeHeight;

  for (const node of nodes) {
    // Ensure position exists and has valid values
    const nodeX = node?.position?.x || 0;
    const nodeY = node?.position?.y || 0;
    const nodeHeight = node?.height || defaultNodeHeight;

    // Skip nodes with invalid positions
    if (isNaN(nodeX) || isNaN(nodeY)) {
      continue;
    }

    if (nodeX > rightMostX) {
      rightMostX = nodeX;
      rightMostY = nodeY;
      rightMostHeight = nodeHeight;
    }
  }

  // Ensure we have valid numbers for calculation
  const x = isNaN(rightMostX) ? 50 : rightMostX;
  const y =
    isNaN(rightMostY) || isNaN(rightMostHeight) ? 50 : rightMostY + rightMostHeight + nodeGap;

  return { x, y };
};
