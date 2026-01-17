module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateId",
    ()=>generateId,
    "getImage",
    ()=>getImage,
    "saveImage",
    ()=>saveImage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@upstash/redis/nodejs.mjs [app-route] (ecmascript) <locals>");
;
;
;
const DB_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'db.json');
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Redis"]({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
}) : null;
const useCloud = ()=>!!redis;
async function ensureLocalDb() {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].access(DB_PATH);
    } catch  {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(DB_PATH, JSON.stringify({
            images: []
        }));
    }
}
async function saveImage(record) {
    if (useCloud() && redis) {
        // Use HSET to store as a single Hash object in Redis
        await redis.hset(`snap:${record.id}`, {
            ...record,
            views: 0,
            metadata: JSON.stringify(record.metadata)
        });
        return;
    }
    await ensureLocalDb();
    const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(DB_PATH, 'utf-8');
    const db = JSON.parse(content);
    db.images.push({
        ...record,
        views: 0
    });
    await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(DB_PATH, JSON.stringify(db, null, 2));
}
async function getImage(id) {
    if (useCloud() && redis) {
        // Increment views and get data from the SAME hash object
        await redis.hincrby(`snap:${id}`, 'views', 1);
        const data = await redis.hgetall(`snap:${id}`);
        if (!data || Object.keys(data).length === 0) return null;
        return {
            ...data,
            id,
            views: parseInt(data.views || '0'),
            created_at: parseInt(data.created_at),
            metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata
        };
    }
    try {
        await ensureLocalDb();
        const content = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].readFile(DB_PATH, 'utf-8');
        const db = JSON.parse(content);
        const index = db.images.findIndex((img)=>img.id === id);
        if (index !== -1) {
            db.images[index].views = (db.images[index].views || 0) + 1;
            await __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(DB_PATH, JSON.stringify(db, null, 2));
            return db.images[index];
        }
        return null;
    } catch  {
        return null;
    }
}
function generateId() {
    return Math.random().toString(36).substring(2, 10);
}
}),
"[project]/src/lib/telegram.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTelegramFileUrl",
    ()=>getTelegramFileUrl,
    "uploadToTelegram",
    ()=>uploadToTelegram
]);
async function uploadToTelegram(file, fileName) {
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
        body: formData
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
        file_unique_id: largestPhoto.file_unique_id
    };
}
async function getTelegramFileUrl(fileId) {
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
}),
"[project]/src/app/i/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/telegram.ts [app-route] (ecmascript)");
;
;
;
const runtime = 'nodejs';
async function GET(req, { params }) {
    const { id: rawId } = await params;
    const hasExtension = rawId.includes('.');
    const id = hasExtension ? rawId.split('.')[0] : rawId;
    try {
        const record = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getImage"])(id);
        if (!record) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]('Image not found', {
                status: 404
            });
        }
        const fileUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$telegram$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTelegramFileUrl"])(record.telegram_file_id);
        const proxyImage = async ()=>{
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const headers = new Headers();
            headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](blob, {
                headers
            });
        };
        const accept = req.headers.get('accept') || '';
        if (hasExtension || !accept.includes('text/html')) {
            return proxyImage();
        }
        const proxiedImgSrc = `/i/${id}.jpg`;
        const views = record.views || 0;
        const formattedDate = new Date(record.created_at).toLocaleDateString();
        const formattedSize = record.metadata?.size ? (record.metadata.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown';
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SnapEdge | ${id}</title>
                <meta property="og:title" content="SnapEdge Image">
                <meta property="og:image" content="${proxiedImgSrc}">
                <meta name="twitter:card" content="summary_large_image">
                <style>
                    body { margin: 0; background: #050505; color: white; font-family: 'Inter', system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
                    .container { position: relative; max-width: 90vw; max-height: 80vh; display: flex; align-items: center; justify-content: center; }
                    img { max-width: 100%; max-height: 80vh; border-radius: 12px; box-shadow: 0 30px 60px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); }
                    .toolbar { 
                        position: fixed; 
                        top: 20px; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        display: flex; 
                        gap: 15px; 
                        background: rgba(20, 20, 20, 0.7); 
                        backdrop-filter: blur(10px); 
                        -webkit-backdrop-filter: blur(10px);
                        padding: 10px 20px; 
                        border-radius: 100px; 
                        border: 1px solid rgba(255,255,255,0.1);
                        z-index: 100;
                    }
                    .info-bar {
                        position: fixed;
                        bottom: 30px;
                        background: rgba(255, 255, 255, 0.05);
                        backdrop-filter: blur(10px);
                        padding: 12px 24px;
                        border-radius: 16px;
                        display: flex;
                        gap: 30px;
                        font-size: 13px;
                        color: #a1a1aa;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    .info-item b { color: white; margin-right: 5px; }
                    a { 
                        color: #ffffff; 
                        text-decoration: none; 
                        font-size: 14px; 
                        font-weight: 500;
                        padding: 8px 16px; 
                        border-radius: 50px; 
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    a.primary { background: #8b5cf6; color: white; }
                    a.primary:hover { background: #7c3aed; }
                    a.secondary { background: rgba(255,255,255,0.1); color: #a1a1aa; }
                    a.secondary:hover { background: rgba(255,255,255,0.2); color: white; }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <a href="/" class="secondary">Upload New</a>
                    <a href="${proxiedImgSrc}" download class="primary">Download Raw</a>
                </div>
                <div class="container">
                    <img src="${proxiedImgSrc}" alt="SnapEdge Image">
                </div>
                <div class="info-bar">
                    <div class="info-item"><b>Views</b> ${views}</div>
                    <div class="info-item"><b>Size</b> ${formattedSize}</div>
                    <div class="info-item"><b>Date</b> ${formattedDate}</div>
                </div>
            </body>
            </html>`, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    } catch (error) {
        console.error('Redirection error:', error);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]('Internal server error', {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a970e978._.js.map