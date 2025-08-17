import { NextRequest } from 'next/server';
export declare const dynamic = "force-dynamic";
export declare function GET(request: NextRequest, { params }: {
    params: {
        id: string;
    };
}): Promise<any>;
export declare function DELETE(request: NextRequest, { params }: {
    params: {
        id: string;
    };
}): Promise<any>;
