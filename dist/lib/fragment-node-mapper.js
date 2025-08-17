"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fragmentNodeMapper = exports.FragmentNodeMapper = void 0;
class FragmentNodeMapper {
    fragmentToNode(fragment, position) {
        return {
            id: `fragment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'fragment',
            position,
            data: {
                title: fragment.title,
                description: fragment.description,
                template: fragment.template,
                code: fragment.code,
                filePath: fragment.file_path,
                port: fragment.port,
                dependencies: fragment.additional_dependencies,
                hasAdditionalDependencies: fragment.has_additional_dependencies,
                installCommand: fragment.install_dependencies_command
            },
            dependencies: []
        };
    }
    nodeToFragment(node) {
        return {
            commentary: node.data.description || '',
            template: node.data.template || 'code-interpreter-v1',
            title: node.data.title || 'Untitled Fragment',
            description: node.data.description || '',
            additional_dependencies: node.data.dependencies || [],
            has_additional_dependencies: node.data.hasAdditionalDependencies || false,
            install_dependencies_command: node.data.installCommand || '',
            port: node.data.port || null,
            file_path: node.data.filePath || 'main.py',
            code: node.data.code || ''
        };
    }
}
exports.FragmentNodeMapper = FragmentNodeMapper;
exports.fragmentNodeMapper = new FragmentNodeMapper();
//# sourceMappingURL=fragment-node-mapper.js.map