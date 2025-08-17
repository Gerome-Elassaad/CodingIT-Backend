import 'server-only';
export declare function evaluateCode(sessionID: string, code: string): Promise<{
    results: import("@e2b/code-interpreter").Result[];
    stdout: string[];
    stderr: string[];
    error: import("@e2b/code-interpreter").ExecutionError | undefined;
}>;
export declare function nonEmpty<T>(value: T | null | undefined): value is T;
