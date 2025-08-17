export interface FragmentNode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: any;
    dependencies: string[];
}
export interface WorkflowConnection {
    id: string;
    source: {
        nodeId: string;
        portId: string;
    };
    target: {
        nodeId: string;
        portId: string;
    };
    dataType: 'string' | 'number' | 'object' | 'array';
}
export interface WorkflowTrigger {
    id: string;
    type: 'manual' | 'scheduled' | 'webhook';
    config: any;
}
export interface WorkflowSchema {
    id: string;
    name: string;
    description: string;
    fragments: FragmentNode[];
    connections: WorkflowConnection[];
    variables: any[];
    triggers: WorkflowTrigger[];
    version: number;
    created_at: Date;
    updated_at: Date;
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    inputData: any;
    outputData: any;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}
export declare class WorkflowEngine {
    executeWorkflow(workflow: WorkflowSchema, inputData: any, triggerType: string): Promise<WorkflowExecution>;
}
export declare const workflowEngine: WorkflowEngine;
