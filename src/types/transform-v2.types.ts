/**
 * UI4T v2 API Type Definitions
 * New unified architecture using CanvasNode and CanvasEdge
 */

import { Edge, Node, NodeProps } from 'reactflow';

// Canvas Node Types
export enum CanvasNodeTypeEnum {
  Source = 'source',
  Model = 'model',
  Operation = 'operation',
}

// Input payload for multi-input operations
export interface ModelSrcOtherInputPayload {
  input_model_uuid: string; // Changed from 'uuid' in v1
  columns: string[];
  seq: number;
}

// Create operation node payload
export interface CreateOperationNodePayload {
  op_type: string;
  config: any;
  input_node_uuid: string; // Required - the input canvas node
  source_columns: string[];
  other_inputs: ModelSrcOtherInputPayload[]; // For multi-input operations like join/union
}

// Edit operation node payload
export interface EditOperationNodePayload {
  op_type: string;
  config: any;
  source_columns: string[];
  other_inputs: ModelSrcOtherInputPayload[];
}

// Terminate chain and create model payload
export interface TerminateChainAndCreateModelPayload {
  name: string;
  display_name: string;
  dest_schema: string;
}

export interface DbtModelResponse {
  name: string;
  display_name: string;
  schema: string;
  sql_path: string;
  type: 'source' | 'model';
  source_name: string;
  output_cols: string[];
  uuid: string;
}

interface OperationConfigBaseResponseJson {
  type: string;
  config: any;
}

export interface OperationConfigResponseJson extends OperationConfigBaseResponseJson {
  [key: string]: any;
}

// Canvas Node (unified node type in v2)
export interface CanvasNodeDataResponse {
  uuid: string;
  name: string;
  output_columns: string[]; // Backend returns 'output_columns' not 'output_cols'
  node_type: CanvasNodeTypeEnum;

  // For SOURCE/MODEL nodes
  dbtmodel: DbtModelResponse | null;

  // For OPERATION nodes
  operation_config: OperationConfigResponseJson;

  // other_inputs; in case of multi-input operations
  input_nodes?: CanvasNodeDataResponse[];

  is_last_in_chain: boolean;

  seq?: number; // sequence number; to be used in case of multi-input operations
}

// Canvas Edge
export interface CanvasEdgeDataResponse {
  source: string;
  target: string;
  id: string;
}

// Graph API Response
export interface DbtProjectGraphV2Response {
  nodes: CanvasNodeDataResponse[];
  edges: CanvasEdgeDataResponse[];
}

// Operation form props (updated for v2)
// export interface OperationFormPropsV2 {
//   node: any;  // Canvas flow node
//   operation: {
//     slug: string;
//     label: string;
//   };
//   sx: any;
//   continueOperationChain: (operationNode: any) => void;
//   action: 'create' | 'edit';
//   setLoading: (loading: boolean) => void;
//   parentNodeId?: string;  // Required for v2 - the input canvas node UUID
// }

/**
 * Types to be used in the frontend components can be added here as needed
 *
 */
export interface CanvasNodeRenderData extends CanvasNodeDataResponse {
  isDummy: boolean;
}

export interface CanvasNodeRender {
  id: string;
  type: CanvasNodeTypeEnum;
  data: CanvasNodeRenderData;
  position: any;
}

export type DbtProjectGraphApiResponse = {
  nodes: CanvasNodeDataResponse[];
  edges: CanvasEdgeDataResponse[];
};

export type GenericNode = Node<CanvasNodeRenderData>;
export type GenericNodeProps = NodeProps<CanvasNodeRenderData>;
export type GenericEdge = Edge<CanvasEdgeDataResponse>;

export interface PreviewTableData {
  table: string;
  schema: string;
}
