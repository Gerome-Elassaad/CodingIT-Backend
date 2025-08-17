export interface WorkflowDetectionResult {
    isWorkflow: boolean;
    confidence: number;
    suggestedName: string;
    suggestedDescription: string;
    reason: string;
}
export declare class WorkflowDetector {
    detectWorkflow(messages: any[]): WorkflowDetectionResult;
    private generateWorkflowName;
    private generateWorkflowDescription;
}
export declare const workflowDetector: WorkflowDetector;
