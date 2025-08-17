export interface WorkflowPersistence {
    createWorkflow(workflow: any, teamId: string): Promise<any>;
    getWorkflow(id: string): Promise<any>;
    updateWorkflow(id: string, updates: any): Promise<any>;
    deleteWorkflow(id: string): Promise<void>;
    listWorkflows(teamId: string, limit: number, offset: number): Promise<any>;
    createExecution(execution: any): Promise<any>;
    getExecution(id: string): Promise<any>;
    listExecutions(workflowId: string, limit: number, offset: number): Promise<any>;
}
declare class WorkflowPersistenceImpl implements WorkflowPersistence {
    createWorkflow(workflow: any, teamId: string): Promise<any>;
    getWorkflow(id: string): Promise<any>;
    updateWorkflow(id: string, updates: any): Promise<any>;
    deleteWorkflow(id: string): Promise<void>;
    listWorkflows(teamId: string, limit: number, offset: number): Promise<any>;
    createExecution(execution: any): Promise<any>;
    getExecution(id: string): Promise<any>;
    listExecutions(workflowId: string, limit: number, offset: number): Promise<any>;
}
export declare const workflowPersistence: WorkflowPersistenceImpl;
export {};
