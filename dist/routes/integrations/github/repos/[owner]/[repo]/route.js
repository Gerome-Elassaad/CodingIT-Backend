"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const supabase_server_1 = require("@/lib/supabase-server");
async function GET(request, { params }) {
    try {
        const supabase = (0, supabase_server_1.createServerClient)();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: integration } = await supabase
            .from('user_integrations')
            .select('connection_data')
            .eq('user_id', session.user.id)
            .eq('service_name', 'github')
            .eq('is_connected', true)
            .single();
        if (!integration?.connection_data?.access_token) {
            return server_1.NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
        }
        const { owner, repo } = params;
        const searchParams = request.nextUrl.searchParams;
        const path = searchParams.get('path') || '';
        const ref = searchParams.get('ref') || 'main';
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`, {
            headers: {
                'Authorization': `Bearer ${integration.connection_data.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CodingIT-App/1.0',
            },
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API error:', errorData);
            if (response.status === 401) {
                await supabase
                    .from('user_integrations')
                    .update({
                    is_connected: false,
                    connection_data: {},
                    updated_at: new Date().toISOString(),
                })
                    .eq('user_id', session.user.id)
                    .eq('service_name', 'github');
                return server_1.NextResponse.json({ error: 'GitHub token expired' }, { status: 401 });
            }
            if (response.status === 404) {
                return server_1.NextResponse.json({ error: 'Repository or path not found' }, { status: 404 });
            }
            return server_1.NextResponse.json({ error: 'Failed to fetch repository contents' }, { status: 500 });
        }
        const contents = await response.json();
        if (Array.isArray(contents)) {
            const formattedContents = contents.map((item) => ({
                name: item.name,
                path: item.path,
                type: item.type,
                size: item.size,
                sha: item.sha,
                download_url: item.download_url,
                html_url: item.html_url,
            }));
            return server_1.NextResponse.json({ contents: formattedContents, type: 'directory' });
        }
        else {
            const formattedContent = {
                name: contents.name,
                path: contents.path,
                type: contents.type,
                size: contents.size,
                sha: contents.sha,
                content: contents.content,
                encoding: contents.encoding,
                download_url: contents.download_url,
                html_url: contents.html_url,
            };
            return server_1.NextResponse.json({ content: formattedContent, type: 'file' });
        }
    }
    catch (error) {
        console.error('Error fetching repository contents:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map