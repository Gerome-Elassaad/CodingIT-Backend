import { z } from 'zod'

export function validateSearchParams(url: URL, schema: z.ZodSchema) {
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return schema.parse(params)
}

export function validateJsonBody(request: any, schema: z.ZodSchema) {
  return schema.parse(request.body || request.json())
}

export const commonSchemas = {
  sandboxRequest: z.object({
    fragment: z.object({
      template: z.string(),
      code: z.union([z.string(), z.array(z.any())]),
      file_path: z.string().optional(),
      has_additional_dependencies: z.boolean().optional(),
      install_dependencies_command: z.string().optional(),
      port: z.number().optional(),
      is_multi_file: z.boolean().optional(),
      files: z.array(z.object({
        file_path: z.string(),
        file_content: z.string()
      })).optional()
    }),
    userID: z.string().optional(),
    teamID: z.string().optional(),
    accessToken: z.string().optional()
  })
}