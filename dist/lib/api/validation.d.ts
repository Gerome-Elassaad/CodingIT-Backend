import { z } from 'zod';
export declare function validateSearchParams(url: URL, schema: z.ZodSchema): any;
export declare function validateJsonBody(request: any, schema: z.ZodSchema): any;
export declare const commonSchemas: {
    sandboxRequest: z.ZodObject<{
        fragment: z.ZodObject<{
            template: z.ZodString;
            code: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodAny, "many">]>;
            file_path: z.ZodOptional<z.ZodString>;
            has_additional_dependencies: z.ZodOptional<z.ZodBoolean>;
            install_dependencies_command: z.ZodOptional<z.ZodString>;
            port: z.ZodOptional<z.ZodNumber>;
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
            code: string | any[];
            template: string;
            port?: number | undefined;
            file_path?: string | undefined;
            has_additional_dependencies?: boolean | undefined;
            install_dependencies_command?: string | undefined;
            is_multi_file?: boolean | undefined;
            files?: {
                file_path: string;
                file_content: string;
            }[] | undefined;
        }, {
            code: string | any[];
            template: string;
            port?: number | undefined;
            file_path?: string | undefined;
            has_additional_dependencies?: boolean | undefined;
            install_dependencies_command?: string | undefined;
            is_multi_file?: boolean | undefined;
            files?: {
                file_path: string;
                file_content: string;
            }[] | undefined;
        }>;
        userID: z.ZodOptional<z.ZodString>;
        teamID: z.ZodOptional<z.ZodString>;
        accessToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fragment: {
            code: string | any[];
            template: string;
            port?: number | undefined;
            file_path?: string | undefined;
            has_additional_dependencies?: boolean | undefined;
            install_dependencies_command?: string | undefined;
            is_multi_file?: boolean | undefined;
            files?: {
                file_path: string;
                file_content: string;
            }[] | undefined;
        };
        userID?: string | undefined;
        teamID?: string | undefined;
        accessToken?: string | undefined;
    }, {
        fragment: {
            code: string | any[];
            template: string;
            port?: number | undefined;
            file_path?: string | undefined;
            has_additional_dependencies?: boolean | undefined;
            install_dependencies_command?: string | undefined;
            is_multi_file?: boolean | undefined;
            files?: {
                file_path: string;
                file_content: string;
            }[] | undefined;
        };
        userID?: string | undefined;
        teamID?: string | undefined;
        accessToken?: string | undefined;
    }>;
};
