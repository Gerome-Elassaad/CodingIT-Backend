import { z } from 'zod'

export const fragmentSchema = z.object({
  commentary: z.string().describe('Commentary about the code'),
  template: z.string().describe('Template type for the code'),
  title: z.string().describe('Title of the fragment'),
  description: z.string().describe('Description of what the code does'),
  additional_dependencies: z.array(z.string()).describe('Additional dependencies needed'),
  has_additional_dependencies: z.boolean().describe('Whether additional dependencies are needed'),
  install_dependencies_command: z.string().describe('Command to install dependencies'),
  port: z.number().nullable().describe('Port number for web applications'),
  file_path: z.string().describe('File path for the main code file'),
  code: z.string().describe('The actual code content'),
  is_multi_file: z.boolean().optional().describe('Whether this is a multi-file project'),
  files: z.array(z.object({
    file_path: z.string(),
    file_content: z.string()
  })).optional().describe('Additional files for multi-file projects')
})

export type FragmentSchema = z.infer<typeof fragmentSchema>