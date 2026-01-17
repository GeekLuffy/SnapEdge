import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/db';

/**
 * @api {get} /api/v1/info/:id Get image metadata
 * @apiName GetInfo
 * @apiGroup Image
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const record = await getImage(id);

        if (!record) {
            return NextResponse.json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Image record not found' }
            }, { status: 404 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (req.headers.get('host') ? `http://${req.headers.get('host')}` : '');

        return NextResponse.json({
            success: true,
            data: {
                id: record.id,
                url: `${baseUrl}/i/${record.id}`,
                direct_url: `${baseUrl}/i/${record.id}.jpg`,
                views: record.views,
                created_at: record.created_at,
                metadata: record.metadata
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message }
        }, { status: 500 });
    }
}
