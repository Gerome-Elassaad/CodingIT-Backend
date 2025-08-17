import { FragmentNode } from './workflow-engine';
export interface FragmentSchema {
    commentary: string;
    template: string;
    title: string;
    description: string;
    additional_dependencies: string[];
    has_additional_dependencies: boolean;
    install_dependencies_command: string;
    port: number | null;
    file_path: string;
    code: string;
}
export declare class FragmentNodeMapper {
    fragmentToNode(fragment: FragmentSchema, position: {
        x: number;
        y: number;
    }): FragmentNode;
    nodeToFragment(node: FragmentNode): FragmentSchema;
}
export declare const fragmentNodeMapper: FragmentNodeMapper;
