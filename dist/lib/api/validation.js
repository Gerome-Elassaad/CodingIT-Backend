"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = void 0;
exports.validateSearchParams = validateSearchParams;
exports.validateJsonBody = validateJsonBody;
const zod_1 = require("zod");
function validateSearchParams(url, schema) {
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return schema.parse(params);
}
function validateJsonBody(request, schema) {
    return schema.parse(request.body || request.json());
}
exports.commonSchemas = {
    sandboxRequest: zod_1.z.object({
        fragment: zod_1.z.object({
            template: zod_1.z.string(),
            code: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.any())]),
            file_path: zod_1.z.string().optional(),
            has_additional_dependencies: zod_1.z.boolean().optional(),
            install_dependencies_command: zod_1.z.string().optional(),
            port: zod_1.z.number().optional(),
            is_multi_file: zod_1.z.boolean().optional(),
            files: zod_1.z.array(zod_1.z.object({
                file_path: zod_1.z.string(),
                file_content: zod_1.z.string()
            })).optional()
        }),
        userID: zod_1.z.string().optional(),
        teamID: zod_1.z.string().optional(),
        accessToken: zod_1.z.string().optional()
    })
};
//# sourceMappingURL=validation.js.map