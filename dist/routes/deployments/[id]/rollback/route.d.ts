import { NextRequest } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function POST(request: NextRequest, { params }: {
    params: {
        id: string;
    };
}): Promise<any>;
