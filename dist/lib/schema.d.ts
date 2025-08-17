import { z } from 'zod';
export declare const fragmentSchema: z.ZodObject<{
    commentary: z.ZodString;
    template: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    additional_dependencies: z.ZodArray<z.ZodString, "many">;
    has_additional_dependencies: z.ZodBoolean;
    install_dependencies_command: z.ZodString;
    port: z.ZodNullable<z.ZodNumber>;
    file_path: z.ZodString;
    code: z.ZodString;
    is_multi_file: z.ZodOptional<z.ZodBoolean>;
    files: z.ZodOptional<z.ZodArray<z.ZodObject<{
        file_path: z.ZodString;
        file_content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        file_path: string;
        file_content: string;
    }, {
        file_path: string;
        file_content: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    port: number | null;
    description: string;
    code: string;
    template: string;
    file_path: string;
    has_additional_dependencies: boolean;
    install_dependencies_command: string;
    commentary: string;
    title: string;
    additional_dependencies: string[];
    is_multi_file?: boolean | undefined;
    files?: {
        file_path: string;
        file_content: string;
    }[] | undefined;
}, {
    port: number | null;
    description: string;
    code: string;
    template: string;
    file_path: string;
    has_additional_dependencies: boolean;
    install_dependencies_command: string;
    commentary: string;
    title: string;
    additional_dependencies: string[];
    is_multi_file?: boolean | undefined;
    files?: {
        file_path: string;
        file_content: string;
    }[] | undefined;
}>;
export type FragmentSchema = z.infer<typeof fragmentSchema>;
