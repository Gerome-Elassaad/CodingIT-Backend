"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowDetector = exports.WorkflowDetector = void 0;
class WorkflowDetector {
    detectWorkflow(messages) {
        const lastMessage = messages[messages.length - 1];
        const content = typeof lastMessage?.content === 'string'
            ? lastMessage.content
            : lastMessage?.content?.[0]?.text || '';
        // Keywords that suggest multi-step workflows
        const workflowKeywords = [
            'step by step',
            'multiple steps',
            'workflow',
            'pipeline',
            'sequence',
            'then',
            'after that',
            'next',
            'followed by',
            'process',
            'stages'
        ];
        // Check for workflow indicators
        const hasWorkflowKeywords = workflowKeywords.some(keyword => content.toLowerCase().includes(keyword));
        // Check for numbered lists or bullet points
        const hasNumberedSteps = /\d+\.\s/.test(content) || /[-*]\s/.test(content);
        // Check for multiple actions or verbs
        const actionWords = ['create', 'build', 'setup', 'configure', 'deploy', 'test', 'validate'];
        const actionCount = actionWords.filter(action => content.toLowerCase().includes(action)).length;
        let confidence = 0;
        let isWorkflow = false;
        let reason = 'Single action request';
        if (hasWorkflowKeywords) {
            confidence += 0.4;
            reason = 'Contains workflow-related keywords';
        }
        if (hasNumberedSteps) {
            confidence += 0.3;
            reason = 'Contains numbered steps or bullet points';
        }
        if (actionCount >= 3) {
            confidence += 0.3;
            reason = 'Multiple actions detected';
        }
        if (confidence >= 0.6) {
            isWorkflow = true;
        }
        // Generate suggested workflow name and description
        const suggestedName = this.generateWorkflowName(content);
        const suggestedDescription = this.generateWorkflowDescription(content);
        return {
            isWorkflow,
            confidence,
            suggestedName,
            suggestedDescription,
            reason
        };
    }
    generateWorkflowName(content) {
        // Extract potential name from content
        const words = content.split(' ').slice(0, 5);
        const cleanWords = words
            .filter(word => word.length > 2)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        return cleanWords.length > 0
            ? `${cleanWords.join(' ')} Workflow`
            : 'Multi-Step Workflow';
    }
    generateWorkflowDescription(content) {
        const firstSentence = content.split('.')[0];
        return firstSentence.length > 10 && firstSentence.length < 100
            ? `${firstSentence}.`
            : 'A multi-step workflow generated from user requirements';
    }
}
exports.WorkflowDetector = WorkflowDetector;
exports.workflowDetector = new WorkflowDetector();
//# sourceMappingURL=workflow-detector.js.map