export interface FileSystemNode {
  name: string
  isDirectory: boolean
  path?: string
  children?: FileSystemNode[]
}