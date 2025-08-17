import { NextRequest } from 'next/server';
export declare function GET(request: NextRequest, { params }: {
    params: {
        owner: string;
        repo: string;
    };
}): Promise<any>;
