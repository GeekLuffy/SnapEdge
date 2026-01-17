import { NextRequest, NextResponse } from 'next/server';
import { uploadToTelegram } from '@/lib/telegram';
import { saveImage, generateId } from '@/lib/db';

/**
 * @api {post} /api/v1/upload Upload an image
 * @apiName Upload
 * @apiGroup Image
 * 
 * @apiParam {File} file Image file to upload (required)
 * @apiParam {String} [customId] Optional custom vanity slug
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        const customId = formData.get('customId') as string;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: { code: 'MISSING_FILE', message: 'No file provided in request' }
            }, { status: 400 });
        }

        // 1. Upload to Telegram
        const telegramResult = await uploadToTelegram(file, 'upload.jpg');

        // 2. Generate ID
        const id = customId ? customId.toLowerCase().replace(/[^a-z0-9-]/g, '-') : generateId();

        const record = {
            id,
            telegram_file_id: telegramResult.file_id,
            created_at: Date.now(),
            metadata: {
                size: file.size,
                type: file.type,
                version: 'v1'
            }
        };

        // Save to DB
        await saveImage(record);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (req.headers.get('host') ? `http://${req.headers.get('host')}` : '');

        return NextResponse.json({
            success: true,
            data: {
                id,
                url: `${baseUrl}/i/${id}`,
                direct_url: `${baseUrl}/i/${id}.jpg`,
                timestamp: record.created_at
            }
        });

    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Server processed request failed' }
        }, { status: 500 });
    }
}
