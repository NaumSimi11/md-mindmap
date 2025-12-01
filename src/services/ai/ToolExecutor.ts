import { workspaceService } from '@/services/workspace/WorkspaceService';

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
    execute: (args: any) => Promise<any>;
}

export class ToolExecutor {
    private tools: Record<string, ToolDefinition> = {};

    constructor() {
        this.registerDefaultTools();
    }

    registerTool(tool: ToolDefinition) {
        this.tools[tool.name] = tool;
    }

    getTools(): ToolDefinition[] {
        return Object.values(this.tools);
    }

    getToolSystemPrompt(): string {
        const toolDescriptions = this.getTools().map(tool => {
            return `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters)}`;
        }).join('\n');

        return `
You have access to the following tools to help you manage the project.
To use a tool, you MUST output a JSON block in the following format:

\`\`\`json
{
  "tool": "tool_name",
  "args": {
    "arg1": "value1"
  }
}
\`\`\`

Available Tools:
${toolDescriptions}

IMPORTANT:
- Only use one tool per response if possible.
- Wait for the tool result before proceeding.
- If you need to create a file, use 'create_file'.
- If you need to see file contents, use 'read_file'.
`;
    }

    async executeTool(name: string, args: any): Promise<any> {
        const tool = this.tools[name];
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }
        console.log(`🛠️ Executing tool: ${name}`, args);
        try {
            const result = await tool.execute(args);
            console.log(`✅ Tool execution successful:`, result);
            return result;
        } catch (error) {
            console.error(`❌ Tool execution failed:`, error);
            throw error;
        }
    }

    private registerDefaultTools() {
        // Tool: create_file
        this.registerTool({
            name: 'create_file',
            description: 'Create a new file with the specified content. If file exists, it will be overwritten.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Relative path to the file (e.g., "src/components/Button.tsx")' },
                    content: { type: 'string', description: 'The content of the file' },
                },
                required: ['path', 'content'],
            },
            execute: async ({ path, content }) => {
                // In a real app, this would use a file system API.
                // For this demo/PWA, we'll use the WorkspaceService to simulate file creation
                // or just log it if we don't have a real FS.
                // Since we are in a browser environment, we might need to mock this or use the workspaceService.

                // Check if workspaceService has file creation capabilities
                // workspaceService.createDocument usually takes (type, title, content)
                // We might need to map 'path' to 'title' or 'id'.

                // For now, let's try to map it to workspace documents
                const title = path.split('/').pop() || path;
                const type = path.endsWith('.md') ? 'markdown' : 'code'; // simplified

                // We'll store the full path in metadata if possible
                const doc = await workspaceService.createDocument(type as any, title, content);
                return { success: true, message: `File created: ${path} (ID: ${doc.id})`, fileId: doc.id };
            },
        });

        // Tool: read_file
        this.registerTool({
            name: 'read_file',
            description: 'Read the contents of a file.',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'Path to the file' },
                },
                required: ['path'],
            },
            execute: async ({ path }) => {
                // Mock implementation for now
                // In a real scenario, we'd look up the document by path/title
                const docs = workspaceService.getDocuments();
                const title = path.split('/').pop();
                const doc = docs.find(d => d.title === title);

                if (doc) {
                    return { content: doc.content };
                }
                return { error: 'File not found' };
            },
        });

        // Tool: list_files
        this.registerTool({
            name: 'list_files',
            description: 'List all files in the project.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
            execute: async () => {
                const docs = workspaceService.getDocuments();
                return { files: docs.map(d => d.title) };
            },
        });
    }
}

export const toolExecutor = new ToolExecutor();
