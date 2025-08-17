"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fragmentSchema = void 0;
const zod_1 = require("zod");
exports.fragmentSchema = zod_1.z.object({
    commentary: zod_1.z.string().describe('Commentary about the code'),
    template: zod_1.z.string().describe('Template type for the code'),
    title: zod_1.z.string().describe('Title of the fragment'),
    description: zod_1.z.string().describe('Description of what the code does'),
    additional_dependencies: zod_1.z.array(zod_1.z.string()).describe('Additional dependencies needed'),
    has_additional_dependencies: zod_1.z.boolean().describe('Whether additional dependencies are needed'),
    install_dependencies_command: zod_1.z.string().describe('Command to install dependencies'),
    port: zod_1.z.number().nullable().describe('Port number for web applications'),
    file_path: zod_1.z.string().describe('File path for the main code file'),
    code: zod_1.z.string().describe('The actual code content'),
    is_multi_file: zod_1.z.boolean().optional().describe('Whether this is a multi-file project'),
    files: zod_1.z.array(zod_1.z.object({
        file_path: zod_1.z.string(),
        file_content: zod_1.z.string()
    })).optional().describe('Additional files for multi-file projects')
});
//# sourceMappingURL=schema.js.map