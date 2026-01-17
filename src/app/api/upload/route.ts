import { NextRequest, NextResponse } from 'next/server';
import { uploadToTelegram } from '@/lib/telegram';
import { saveImage, generateId } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        const customId = formData.get('customId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 1. Upload to Telegram
        const telegramResult = await uploadToTelegram(file, 'upload.jpg');

        // 2. Generate ID (use custom if provided)
        const id = customId ? customId.toLowerCase().replace(/[^a-z0-9-]/g, '-') : generateId();

        // Save to DB
        await saveImage({
            id,
            telegram_file_id: telegramResult.file_id,
            created_at: Date.now(),
            metadata: {
                size: file.size,
                type: file.type
            }
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
            (req.headers.get('host') ? `http://${req.headers.get('host')}` : '');

        return NextResponse.json({
            id,
            url: `${baseUrl}/i/${id}`
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
