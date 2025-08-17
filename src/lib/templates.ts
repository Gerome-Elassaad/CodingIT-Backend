export type Templates = 'code-interpreter-v1' | 'web-app' | 'data-analysis' | 'api-server'
export type TemplateId = Templates

export const templates: Record<Templates, string> = {
  'code-interpreter-v1': 'Python Code Interpreter',
  'web-app': 'Web Application',
  'data-analysis': 'Data Analysis',
  'api-server': 'API Server'
}

export default templates