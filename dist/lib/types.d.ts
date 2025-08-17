export interface ExecutionResultInterpreter {
    sbxId: string;
    template: string;
    stdout: string[];
    stderr: string[];
    runtimeError?: any;
    cellResults: any[];
}
export interface ExecutionResultWeb {
    sbxId: string;
    template: string;
    url: string;
}
export type ExecutionResult = ExecutionResultInterpreter | ExecutionResultWeb;
