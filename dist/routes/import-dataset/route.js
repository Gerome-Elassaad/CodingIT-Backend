"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const transformers_1 = require("@xenova/transformers");
const supabase_js_1 = require("@supabase/supabase-js");
const DATASET = 'bigcode/the-stack';
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const HUGGING_FACE_API_URL = 'https://huggingface.co/api/datasets';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
    supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
}
else {
    console.warn('Supabase configuration is incomplete. Import dataset feature is disabled.');
}
async function processAndEmbedFile(content, embeddingPipeline) {
    const chunks = content.split('\n').filter(line => line.trim().length > 10);
    if (chunks.length === 0) {
        return;
    }
    const embeddings = await embeddingPipeline(chunks, {
        pooling: 'mean',
        normalize: true,
    });
    const dataToInsert = chunks.map((chunk, i) => ({
        content: chunk,
        embedding: Array.from(embeddings.data.slice(i * 384, (i + 1) * 384)),
    }));
    const { error } = await supabase.from('code_embeddings').insert(dataToInsert);
    if (error) {
        console.error('Supabase insert error:', error);
    }
}
async function importDataset(subset) {
    try {
        console.log(`Starting dataset import for subset: ${subset}...`);
        const embeddingPipeline = await (0, transformers_1.pipeline)('feature-extraction', EMBEDDING_MODEL);
        const repoInfoUrl = `${HUGGING_FACE_API_URL}/${DATASET}/tree/main/data/${subset}`;
        const repoInfoResponse = await fetch(repoInfoUrl);
        if (!repoInfoResponse.ok) {
            throw new Error(`Failed to fetch repo info: ${repoInfoResponse.statusText}`);
        }
        const files = await repoInfoResponse.json();
        for (const file of files) {
            if (file.type === 'file') {
                console.log(`Processing file: ${file.path}`);
                const downloadUrl = `https://huggingface.co/datasets/${DATASET}/resolve/main/${file.path}`;
                const fileResponse = await fetch(downloadUrl);
                if (fileResponse.ok) {
                    const content = await fileResponse.text();
                    await processAndEmbedFile(content, embeddingPipeline);
                }
                else {
                    console.warn(`Could not download file: ${file.path}`);
                }
            }
        }
        console.log(`Dataset import for subset: ${subset} completed.`);
    }
    catch (error) {
        console.error(`Error during dataset import for subset: ${subset}`, error);
    }
}
async function POST(request) {
    try {
        if (!supabase) {
            return server_1.NextResponse.json({ error: 'Supabase is not configured. Import dataset feature is disabled.' }, { status: 503 });
        }
        const { subset } = await request.json();
        if (!subset) {
            return server_1.NextResponse.json({ error: 'Missing "subset" parameter (e.g., "python")' }, { status: 400 });
        }
        importDataset(subset).catch(console.error);
        return server_1.NextResponse.json({ message: `Started importing the "${subset}" subset from "${DATASET}". This will take a while.` }, { status: 202 });
    }
    catch (error) {
        console.error('API Error:', error);
        return server_1.NextResponse.json({ error: 'Internal Server Error', detail: error.message }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map