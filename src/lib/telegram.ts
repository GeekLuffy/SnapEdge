export interface TelegramFileResult {
  file_id: string;
  file_unique_id: string;
  file_path?: string;
}

export async function uploadToTelegram(file: Blob, fileName: string): Promise<TelegramFileResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Telegram credentials not configured');
  }

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', file, fileName);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  // Telegram returns an array of sizes, we take the largest one
  const photos = data.result.photo;
  const largestPhoto = photos[photos.length - 1];

  return {
    file_id: largestPhoto.file_id,
    file_unique_id: largestPhoto.file_unique_id,
  };
}

export async function getTelegramFileUrl(fileId: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error('Telegram token not configured');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  const filePath = data.result.file_path;
  return `https://api.telegram.org/file/bot${token}/${filePath}`;
}
