import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const record = await getImage(id);

        if (!record) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: record.id,
            url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/i/${record.id}`,
            direct_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/i/${record.id}.jpg`,
            views: record.views,
            created_at: record.created_at,
            metadata: record.metadata
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
