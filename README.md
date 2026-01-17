# SnapEdge

A lightweight, scalable image hosting platform that offloads storage to messaging infrastructure (Telegram) and uses edge redirection for efficient content delivery.

## Features

- **Messaging-based Storage**: Uses Telegram Bot API as a free, scalable storage backend.
- **Edge Redirection**: Client requests are redirected directly to the file delivery network, minimizing server bandwidth.
- **Clean URLs**: Provides clean, CDN-style links (e.g., `/i/[id]`).
- **Premium UI**: Glassmorphic, dark-themed interface with smooth animations.

## Getting Started

### 1. Prerequisites
- A Telegram Bot (Create one via [@BotFather](https://t.me/botfather)).
- A Telegram Chat/Channel ID (You can use [@userinfobot](https://t.me/userinfobot) to find your ID).

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Installation
```bash
yarn install
```

### 4. Development
```bash
yarn dev
```

## How it Works
1. **Upload**: User sends an image to the SnapEdge API.
2. **Storage**: The API forwards the image to a Telegram chat. Telegram returns a `file_id`.
3. **Database**: SnapEdge stores a mapping between a unique ID and the Telegram `file_id`.
4. **Delivery**: When someone visits `/i/[id]`, the server looks up the `file_id`, fetches the current direct path from Telegram, and redirects the user's browser directly to Telegram's storage servers.
