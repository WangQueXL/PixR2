// 简易路由器类
class Router {
    constructor() {
        // 存储所有路由规则的数组
        this.routes = [];
    }

    /**
     * 添加一个新的路由规则
     * @param {string} method - HTTP方法 (e.g., 'GET', 'POST')
     * @param {string} path - URL路径 (e.g., '/', '/upload')
     * @param {function} handler - 处理该路由的函数
     */
    add(method, path, handler) {
        this.routes.push({ method, path, handler });
    }

    /**
     * 添加一个GET方法的路由
     * @param {string} path - URL路径
     * @param {function} handler - 处理函数
     */
    get(path, handler) {
        this.add('GET', path, handler);
    }

    /**
     * 添加一个POST方法的路由
     * @param {string} path - URL路径
     * @param {function} handler - 处理函数
     */
    post(path, handler) {
        this.add('POST', path, handler);
    }

    /**
     * 处理传入的请求，并匹配到对应的路由
     * @param {Request} request - Cloudflare Worker接收到的请求对象
     * @param {...any} args - 其他传递给处理函数的参数 (例如 env)
     * @returns {Promise<Response>} - 返回一个响应对象
     */
    async handle(request, ...args) {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname;

        // 遍历所有已注册的路由
        for (const route of this.routes) {
            // 如果方法和路径都匹配，则调用对应的处理函数
            if (route.method === method && route.path === path) {
                return route.handler(request, ...args);
            }
        }
        // 如果没有找到匹配的路由，返回404
        return new Response('Not found', { status: 404 });
    }
}

// 用于身份验证的中间件
const requireAuth = (handler) => async (request, env, ...args) => {
    // 检查用户是否已通过身份验证
    if (!await isAuthenticated(request, env.SECRET_KEY)) {
        const url = new URL(request.url);
        // 如果是API请求，返回401 Unauthorized
        if (url.pathname.startsWith('/api/')) {
            return new Response('Unauthorized', { status: 401 });
        }
        // 如果是页面请求，重定向到登录页面
        return Response.redirect(new URL('/', request.url).toString(), 302);
    }
    // 如果验证通过，则执行原始的处理函数
    return handler(request, env, ...args);
};


// Cloudflare Worker 的主入口点
export default {
	async fetch(request, env) {
		// --- 环境变量检查 ---
		// 定义所有必需的环境变量
		const requiredEnvVars = ['SECRET_KEY', 'TELEGRAM_BOT_TOKEN', 'CHAT_ID', 'BUCKET_NAME', 'BASE_URL'];
		// 筛选出缺失的环境变量
		const missingEnvVars = requiredEnvVars.filter(key => !env[key]);

		// 如果有任何环境变量缺失，则返回一个错误页面
		if (missingEnvVars.length > 0) {
			return serveErrorPage(missingEnvVars);
		}

		// --- 路由器设置 ---
		const router = new Router();

		// 网页界面路由
		router.get('/', () => serveLoginPage()); // 根路径，提供登录页面
		router.get('/index.html', () => serveLoginPage()); // index.html，也提供登录页面
		router.post('/login', (req) => handleLogin(req, env.SECRET_KEY)); // 处理登录请求

		// 需要身份验证的网页界面路由
		router.get('/upload', requireAuth(serveUploadPage)); // 上传页面
		router.get('/gallery', requireAuth(serveGalleryPage)); // 图库页面

		// 需要身份验证的API路由
		router.post('/api/upload', requireAuth((req) => handleWebUpload(req, env[env.BUCKET_NAME], env.BASE_URL))); // 处理网页上传
		router.get('/api/list', requireAuth((req) => handleListFiles(req, env[env.BUCKET_NAME], env.BASE_URL))); // 列出文件
		router.post('/api/delete', requireAuth((req) => handleDeleteFiles(req, env[env.BUCKET_NAME]))); // 删除文件
		router.post('/api/create-folder', requireAuth((req) => handleCreateFolder(req, env[env.BUCKET_NAME]))); // 创建文件夹

		// Telegram机器人路由
		router.post('/webhook', (req) => handleTelegramWebhook(req, env)); // 处理Telegram的webhook更新
		// 设置Telegram webhook的辅助路由
		router.get('/setWebhook', async (req) => {
			const url = new URL(req.url);
			const webhookUrl = `${url.protocol}//${url.host}/webhook`;
			const TELEGRAM_API_URL = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
			const webhookResponse = await setWebhook(webhookUrl, TELEGRAM_API_URL);
			if (webhookResponse.ok) {
				return new Response(`Webhook set successfully to ${webhookUrl}`);
			}
			return new Response('Failed to set webhook', { status: 500 });
		});


		// --- 处理请求 ---
		try {
			// 使用路由器处理请求
			return await router.handle(request, env);
		} catch (err) {
			console.error(err);
			// 在生产环境中，你可能希望提供一个更友好的错误页面
			return new Response('Server error: ' + err.message, { status: 500 });
		}
	}
};

/**
 * 提供一个显示环境变量配置错误的HTML页面
 * @param {string[]} missingEnvVars - 缺失的环境变量键名数组
 * @returns {Response} - 包含错误信息的HTML响应
 */
function serveErrorPage(missingEnvVars) {
    const missingVarsHtml = missingEnvVars.map(key => `<li class="list-group-item font-monospace">${key}</li>`).join('');
    const errorMessage = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>配置错误 - R2管理</title>
            <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f8f9fa; }
                .container { max-width: 600px; }
            </style>
            <script>
                const svgIcon = \`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g fill="none"><path fill="url(#fluentColorSettings480)" d="M19.494 43.468c1.479.353 2.993.531 4.513.531a19.4 19.4 0 0 0 4.503-.534a1.94 1.94 0 0 0 1.474-1.672l.338-3.071a2.32 2.32 0 0 1 2.183-2.075c.367-.016.732.053 1.068.2l2.807 1.231a1.92 1.92 0 0 0 1.554.01c.247-.105.468-.261.65-.458a20.4 20.4 0 0 0 4.51-7.779a1.94 1.94 0 0 0-.7-2.133l-2.494-1.84a2.326 2.326 0 0 1 0-3.764l2.486-1.836a1.94 1.94 0 0 0 .7-2.138a20.3 20.3 0 0 0-4.515-7.777a1.94 1.94 0 0 0-2.192-.45l-2.806 1.236c-.29.131-.606.2-.926.2a2.34 2.34 0 0 1-2.32-2.088l-.34-3.06a1.94 1.94 0 0 0-1.5-1.681a21.7 21.7 0 0 0-4.469-.519a22 22 0 0 0-4.5.52a1.935 1.935 0 0 0-1.5 1.677l-.34 3.062a2.35 2.35 0 0 1-.768 1.488a2.53 2.53 0 0 1-1.569.6a2.3 2.3 0 0 1-.923-.194l-2.8-1.236a1.94 1.94 0 0 0-2.2.452a20.35 20.35 0 0 0-4.51 7.775a1.94 1.94 0 0 0 .7 2.137l2.488 1.836a2.344 2.344 0 0 1 .701 2.938a2.34 2.34 0 0 1-.7.829l-2.49 1.839a1.94 1.94 0 0 0-.7 2.135a20.3 20.3 0 0 0 4.51 7.782a1.93 1.93 0 0 0 2.193.454l2.818-1.237c.291-.128.605-.194.923-.194h.008a2.34 2.34 0 0 1 2.32 2.074l.338 3.057a1.94 1.94 0 0 0 1.477 1.673M24 30.25a6.25 6.25 0 1 1 0-12.5a6.25 6.25 0 0 1 0 12.5"/><defs><linearGradient id="fluentColorSettings480" x1="33.588" x2="11.226" y1="42.451" y2="7.607" gradientUnits="userSpaceOnUse"><stop stop-color="#70777d"/><stop offset="1" stop-color="#b9c0c7"/></linearGradient></defs></g></svg>\`;
                const blob = new Blob([svgIcon], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/svg+xml';
                link.href = url;
                document.head.appendChild(link);
            </script>
        </head>
        <body class="text-center">
            <div class="container p-4 p-md-5">
                <div class="card shadow-sm">
                    <div class="card-body p-5">
                        <h1 class="h3 mb-3 fw-normal text-danger">配置错误</h1>
                        <p class="text-muted">检测到以下环境变量缺失或未正确设置：</p>
                        <ul class="list-group mb-4">${missingVarsHtml}</ul>
                        <p class="text-muted small">请前往 Cloudflare Workers 设置页面，在“设置”->“变量”中添加或修改这些环境变量。</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    return new Response(errorMessage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 500
    });
}

/**
 * 调用Telegram API来设置webhook
 * @param {string} webhookUrl - 要设置的webhook URL
 * @param {string} apiUrl - Telegram Bot API的基础URL
 * @returns {Promise<object>} - Telegram API的响应结果
 */
async function setWebhook(webhookUrl, apiUrl) {
	try {
		const response = await fetch(`${apiUrl}/setWebhook`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({url: webhookUrl}),
		});

		const result = await response.json();

		if (!result.ok) {
			console.error('Failed to set webhook:', result.description);
		}

		return result;
	} catch (error) {
		console.error('Error setting webhook:', error);
		return {ok: false, description: error.message};
	}
}

/**
 * 根据文件内容的字节签名检测图片类型
 * @param {Uint8Array} uint8Array - 图片文件的字节数组
 * @returns {{mime: string, ext: string}|null} - 如果是支持的图片类型，返回MIME类型和扩展名，否则返回null
 */
function detectImageType(uint8Array) {
	// 检查JPEG签名 (FF D8 FF)
	if (uint8Array.length >= 3 &&
		uint8Array[0] === 0xFF &&
		uint8Array[1] === 0xD8 &&
		uint8Array[2] === 0xFF) {
		return {mime: 'image/jpeg', ext: 'jpg'};
	}

	// 检查PNG签名 (89 50 4E 47 0D 0A 1A 0A)
	const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
	if (uint8Array.length >= pngSignature.length) {
		const isPng = pngSignature.every(
			(byte, index) => uint8Array[index] === byte
		);
		if (isPng) return {mime: 'image/png', ext: 'png'};
	}

	// 可以根据需要添加更多图片类型的检测 (例如 GIF, WebP)

	return null;
}

/**
 * 处理来自Telegram的webhook请求
 * @param {Request} request - 传入的请求
 * @param {object} env - Cloudflare Worker的环境变量
 * @returns {Promise<Response>}
 */
async function handleTelegramWebhook(request, env) {
	try {
		const update = await request.json();

		// 如果更新中没有消息，直接返回OK
		if (!update.message) {
			return new Response('OK');
		}

		const chatId = update.message.chat.id;

		// 检查用户是否已授权 (CHAT_ID环境变量中是否包含该用户的ID)
		if (!env.CHAT_ID.split(',').includes(chatId.toString())) {
			return new Response('Unauthorized access', {status: 403});
		}

		// 获取用户当前上传路径的函数
		async function getUserPath(chatId) {
			const path = await env.INDEXES_KV.get(chatId.toString());
			if (path === '/') {
				return ''; // 根路径返回空字符串
			}
			return path || ''; // 默认为空字符串 (根路径)
		}

		// 设置用户上传路径的函数
		async function setUserPath(chatId, path) {
			await env.INDEXES_KV.put(chatId.toString(), path);
		}

		// 处理媒体文件上传的函数
		async function handleMediaUpload(chatId, fileId, isDocument = false) {
			try {
				// 发送提示消息
				await sendMessage(chatId, '收到文件，正在上传ing', `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);

				const fileUrl = await getFileUrl(fileId, env.TELEGRAM_BOT_TOKEN);
				const userPath = await getUserPath(chatId);
				const uploadResult = await uploadImageToR2(fileUrl, env[env.BUCKET_NAME], isDocument, userPath, env.BASE_URL);

				if (uploadResult.ok) {
					const imageUrl = `${env.BASE_URL}/${uploadResult.key}`;
					const caption = `✅ 图片上传成功！\n直链\n<code>${imageUrl}</code>\nMarkdown\n<code>![img](${imageUrl})</code>`;
					await sendPhoto(chatId, imageUrl, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`, caption, {parse_mode: "HTML"});
				} else {
					await sendMessage(chatId, uploadResult.message, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				}
			} catch (error) {
				console.error('处理文件失败:', error);
				await sendMessage(chatId, '文件处理失败，请稍后再试。', `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
			}
		}

		// 处理文本消息
		if (update.message.text) {
			const text = update.message.text.trim();

			// 处理 /modify 命令，用于修改上传路径
			if (text.startsWith('/modify')) {
				const parts = text.split(' ');
				if (parts.length >= 2) {
					const newPath = parts[1].trim();
					await setUserPath(chatId, newPath);
					await sendMessage(chatId, `修改路径为${newPath}`, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				} else {
					await sendMessage(chatId, '请指定路径，例如：/modify blog', `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				}
				return new Response('OK');
			}

			// 处理 /status 命令，用于查看当前上传路径
			if (text === '/status') {
				const currentPath = await getUserPath(chatId);
				const statusMessage = currentPath ? `当前路径: ${currentPath}` : '当前路径: / (默认)';
				await sendMessage(chatId, statusMessage, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				return new Response('OK');
			}

			// 对于其他文本消息，发送帮助信息
			let mes = `请发送一张图片！\n或者使用以下命令：\n/modify 修改上传图片的存储路径\n/status 查看当前上传图片的路径`;
			await sendMessage(chatId, mes, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
			return new Response('OK');
		}

		// 处理以文件形式发送的图片
		if (update.message.document) {
			const doc = update.message.document;
			const fileName = doc.file_name || '';
			const fileExt = fileName.split('.').pop().toLowerCase();

			// 检查文件扩展名是否为支持的格式
			if (!['jpg', 'jpeg', 'png'].includes(fileExt)) {
				await sendMessage(chatId, '不支持的文件类型，请发送 JPG/PNG 格式文件', `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				return new Response('OK');
			}

			await handleMediaUpload(chatId, doc.file_id, true);
			return new Response('OK');
		}

		// 处理以图片形式发送的内容
		if (update.message.photo) {
			// Telegram会发送多个尺寸的图片，选择最大尺寸的
			const fileId = update.message.photo.slice(-1)[0].file_id;
			await handleMediaUpload(chatId, fileId);
			return new Response('OK');
		}

		return new Response('OK');
	} catch (err) {
		console.error(err);
		return new Response('Error processing request', {status: 500});
	}
}

// --- 身份验证相关函数 ---

/**
 * 检查请求的cookie中是否包含有效的认证信息
 * @param {Request} request - 传入的请求
 * @param {string} secretKey - 用于验证的密钥
 * @returns {Promise<boolean>} - 如果已认证则返回true，否则返回false
 */
async function isAuthenticated(request, secretKey) {
	const cookies = parseCookies(request.headers.get('Cookie') || '');
	// 比较cookie中的auth值与密钥的哈希值
	return cookies.auth === hashKey(secretKey).replace(/=/g, '');
}

/**
 * 处理登录请求
 * @param {Request} request - 传入的请求
 * @param {string} secretKey - 用于验证的密钥
 * @returns {Promise<Response>} - 成功则重定向到上传页面，失败则返回登录页面并显示错误信息
 */
async function handleLogin(request, secretKey) {
	const formData = await request.formData();
	const inputKey = formData.get('key');

	// 检查输入的密钥是否正确
	if (inputKey === secretKey) {
		const headers = new Headers();
		// 登录成功，设置一个有效期为一天的HttpOnly cookie
		headers.append('Set-Cookie', `auth=${hashKey(secretKey).replace(/=/g, '')}; HttpOnly; Path=/; Max-Age=86400`);
		// 重定向到上传页面
		headers.append('Location', '/upload');
		return new Response(null, {
			status: 302,
			headers
		});
	}

	// 密钥错误，返回登录页面并显示错误信息
	return serveLoginPage("密钥错误，请重新输入");
}

/**
 * 对密钥进行简单的哈希处理（Base64编码）
 * 注意：这只是一个示例，生产环境应使用更安全的哈希算法
 * @param {string} key - 要哈希的字符串
 * @returns {string} - 哈希后的字符串
 */
function hashKey(key) {
	return btoa(key);
}

/**
 * 解析cookie字符串为对象
 * @param {string} cookieString - 从请求头获取的cookie字符串
 * @returns {object} - 解析后的cookie键值对对象
 */
function parseCookies(cookieString) {
	const cookies = {};
	cookieString.split(';').forEach(cookie => {
		const [name, value] = cookie.trim().split('=');
		if (name) cookies[name] = value;
	});
	return cookies;
}

// --- 页面渲染函数 ---

/**
 * 提供登录页面的HTML
 * @param {string|null} errorMessage - 如果有错误，则显示此消息
 * @returns {Response} - 包含登录页面HTML的响应
 */
function serveLoginPage(errorMessage = null) {
	const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>R2管理 - 登录</title>
        <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background-color: #f8f9fa;
            }
            .form-signin {
                width: 100%;
                max-width: 400px;
                padding: 1rem;
                margin: auto;
            }
        </style>
        <script>
            // SVG 原始代码
            const svgIcon = \`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g fill="none"><path fill="url(#fluentColorSettings480)" d="M19.494 43.468c1.479.353 2.993.531 4.513.531a19.4 19.4 0 0 0 4.503-.534a1.94 1.94 0 0 0 1.474-1.672l.338-3.071a2.32 2.32 0 0 1 2.183-2.075c.367-.016.732.053 1.068.2l2.807 1.231a1.92 1.92 0 0 0 1.554.01c.247-.105.468-.261.65-.458a20.4 20.4 0 0 0 4.51-7.779a1.94 1.94 0 0 0-.7-2.133l-2.494-1.84a2.326 2.326 0 0 1 0-3.764l2.486-1.836a1.94 1.94 0 0 0 .7-2.138a20.3 20.3 0 0 0-4.515-7.777a1.94 1.94 0 0 0-2.192-.45l-2.806 1.236c-.29.131-.606.2-.926.2a2.34 2.34 0 0 1-2.32-2.088l-.34-3.06a1.94 1.94 0 0 0-1.5-1.681a21.7 21.7 0 0 0-4.469-.519a22 22 0 0 0-4.5.52a1.935 1.935 0 0 0-1.5 1.677l-.34 3.062a2.35 2.35 0 0 1-.768 1.488a2.53 2.53 0 0 1-1.569.6a2.3 2.3 0 0 1-.923-.194l-2.8-1.236a1.94 1.94 0 0 0-2.2.452a20.35 20.35 0 0 0-4.51 7.775a1.94 1.94 0 0 0 .7 2.137l2.488 1.836a2.344 2.344 0 0 1 .701 2.938a2.34 2.34 0 0 1-.7.829l-2.49 1.839a1.94 1.94 0 0 0-.7 2.135a20.3 20.3 0 0 0 4.51 7.782a1.93 1.93 0 0 0 2.193.454l2.818-1.237c.291-.128.605-.194.923-.194h.008a2.34 2.34 0 0 1 2.32 2.074l.338 3.057a1.94 1.94 0 0 0 1.477 1.673M24 30.25a6.25 6.25 0 1 1 0-12.5a6.25 6.25 0 0 1 0 12.5"/><defs><linearGradient id="fluentColorSettings480" x1="33.588" x2="11.226" y1="42.451" y2="7.607" gradientUnits="userSpaceOnUse"><stop stop-color="#70777d"/><stop offset="1" stop-color="#b9c0c7"/></linearGradient></defs></g></svg>\`;                 
            // 创建 blob 和 URL
            const blob = new Blob([svgIcon], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);                  
            // 创建 favicon link
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/svg+xml';
            link.href = url;                    
            // 插入到 head 中
            document.head.appendChild(link);
        </script>
    </head>
    <body class="text-center">
        <main class="form-signin">
            <div class="card shadow-sm">
                <div class="card-body p-5">
                    <h1 class="h3 mb-4 fw-normal">R2管理</h1>
                    <form action="/login" method="post">
                        <div class="form-floating mb-3">
                            <input type="password" class="form-control" id="floatingPassword" name="key" placeholder="访问密钥"
                                required>
                            <label for="floatingPassword">访问密钥</label>
                        </div>
                        <button class="w-100 btn btn-lg btn-primary" type="submit">登录</button>
                        ${errorMessage ? `<p class="mt-3 text-danger">${errorMessage}</p>` : ''}
                    </form>
                </div>
            </div>
        </main>
    </body>
    </html>
    `;

	return new Response(html, {
		headers: {'Content-Type': 'text/html; charset=utf-8'}
	});
}

/**
 * 提供文件上传页面的HTML
 * @returns {Response} - 包含上传页面HTML的响应
 */
function serveUploadPage() {
	const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>R2管理 - 上传</title>
        <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/bootstrap-icons/1.13.1/font/bootstrap-icons.min.css">
        <style>
            .dropzone {
                border: 2px dashed #dee2e6;
                border-radius: .375rem;
                cursor: pointer;
                transition: all 0.3s;
            }
            .dropzone:hover, .dropzone.active {
                border-color: #0d6efd;
                background-color: rgba(13, 110, 253, 0.05);
            }
        </style>
        <script>
            // SVG 原始代码
            const svgIcon = \`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g fill="none"><path fill="url(#fluentColorSettings480)" d="M19.494 43.468c1.479.353 2.993.531 4.513.531a19.4 19.4 0 0 0 4.503-.534a1.94 1.94 0 0 0 1.474-1.672l.338-3.071a2.32 2.32 0 0 1 2.183-2.075c.367-.016.732.053 1.068.2l2.807 1.231a1.92 1.92 0 0 0 1.554.01c.247-.105.468-.261.65-.458a20.4 20.4 0 0 0 4.51-7.779a1.94 1.94 0 0 0-.7-2.133l-2.494-1.84a2.326 2.326 0 0 1 0-3.764l2.486-1.836a1.94 1.94 0 0 0 .7-2.138a20.3 20.3 0 0 0-4.515-7.777a1.94 1.94 0 0 0-2.192-.45l-2.806 1.236c-.29.131-.606.2-.926.2a2.34 2.34 0 0 1-2.32-2.088l-.34-3.06a1.94 1.94 0 0 0-1.5-1.681a21.7 21.7 0 0 0-4.469-.519a22 22 0 0 0-4.5.52a1.935 1.935 0 0 0-1.5 1.677l-.34 3.062a2.35 2.35 0 0 1-.768 1.488a2.53 2.53 0 0 1-1.569.6a2.3 2.3 0 0 1-.923-.194l-2.8-1.236a1.94 1.94 0 0 0-2.2.452a20.35 20.35 0 0 0-4.51 7.775a1.94 1.94 0 0 0 .7 2.137l2.488 1.836a2.344 2.344 0 0 1 .701 2.938a2.34 2.34 0 0 1-.7.829l-2.49 1.839a1.94 1.94 0 0 0-.7 2.135a20.3 20.3 0 0 0 4.51 7.782a1.93 1.93 0 0 0 2.193.454l2.818-1.237c.291-.128.605-.194.923-.194h.008a2.34 2.34 0 0 1 2.32 2.074l.338 3.057a1.94 1.94 0 0 0 1.477 1.673M24 30.25a6.25 6.25 0 1 1 0-12.5a6.25 6.25 0 0 1 0 12.5"/><defs><linearGradient id="fluentColorSettings480" x1="33.588" x2="11.226" y1="42.451" y2="7.607" gradientUnits="userSpaceOnUse"><stop stop-color="#70777d"/><stop offset="1" stop-color="#b9c0c7"/></linearGradient></defs></g></svg>\`;                 
            // 创建 blob 和 URL
            const blob = new Blob([svgIcon], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);                  
            // 创建 favicon link
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/svg+xml';
            link.href = url;                    
            // 插入到 head 中
            document.head.appendChild(link);
        </script>
    </head>
    <body class="bg-light">
        <header>
            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div class="container">
                    <a class="navbar-brand fw-bold" href="#">R2管理</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li class="nav-item">
                                <a class="nav-link active" aria-current="page" href="/upload">上传图片</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="/gallery">图片管理</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>

        <main class="container my-5">
            <div class="card shadow-sm">
                <div class="card-body p-4 p-md-5">
                    <h1 class="card-title h3 mb-4">上传图片</h1>
                    <div class="dropzone text-center p-5 mb-3" id="dropzone">
                        <i class="bi bi-upload fs-1 text-primary"></i>
                        <p class="mt-3">拖拽文件到此处或点击选择文件</p>
                        <p class="text-muted small">支持 JPG 和 PNG 格式</p>
                        <input type="file" id="fileInput" class="d-none" accept="image/jpeg,image/png" multiple>
                    </div>

                    <div class="mb-3">
                        <label for="customPath" class="form-label">自定义路径（可选）</label>
                        <input type="text" class="form-control" id="customPath" placeholder="例如: blog/images">
                    </div>

                    <div id="selectedFiles" class="mb-3"></div>

                    <button id="uploadBtn" class="btn btn-primary w-100" disabled>上传图片</button>
                </div>
            </div>
        </main>

        <!-- Success Modal -->
        <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="successModalLabel">上传结果</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalContent">
                        <!-- Links will be populated here -->
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.7/js/bootstrap.bundle.min.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', () => {
                const dropzone = document.getElementById('dropzone');
                const fileInput = document.getElementById('fileInput');
                const selectedFilesContainer = document.getElementById('selectedFiles');
                const uploadBtn = document.getElementById('uploadBtn');
                const customPath = document.getElementById('customPath');
                const successModalEl = document.getElementById('successModal');
                const successModal = new bootstrap.Modal(successModalEl);
                const modalContent = document.getElementById('modalContent');

                let selectedFiles = [];

                dropzone.addEventListener('click', () => fileInput.click());
                dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('active'); });
                dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('active'); });
                dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('active'); handleFiles(e.dataTransfer.files); });
                fileInput.addEventListener('change', () => { handleFiles(fileInput.files); });

                function handleFiles(files) {
                    const validFiles = Array.from(files).filter(file => ['image/jpeg', 'image/png'].includes(file.type.toLowerCase()));
                    if (validFiles.length === 0 && files.length > 0) {
                        alert('只支持 JPG 和 PNG 格式的图片文件');
                        return;
                    }
                    selectedFiles = [...selectedFiles, ...validFiles];
                    updateFilePreview();
                    uploadBtn.disabled = selectedFiles.length === 0;
                }

                function updateFilePreview() {
                    selectedFilesContainer.innerHTML = '';
                    if (selectedFiles.length === 0) return;

                    const list = document.createElement('ul');
                    list.className = 'list-group';
                    selectedFiles.forEach((file, index) => {
                        const item = document.createElement('li');
                        item.className = 'list-group-item d-flex justify-content-between align-items-center';
                        item.innerHTML = \`
                            <span class="text-truncate">\${file.name}</span>
                            <button type="button" class="btn-close" aria-label="Remove" data-index="\${index}"></button>
                        \`;
                        list.appendChild(item);
                    });
                    selectedFilesContainer.appendChild(list);

                    document.querySelectorAll('#selectedFiles .btn-close').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const index = parseInt(e.target.dataset.index);
                            selectedFiles.splice(index, 1);
                            updateFilePreview();
                            uploadBtn.disabled = selectedFiles.length === 0;
                        });
                    });
                }

                uploadBtn.addEventListener('click', async () => {
                    if (selectedFiles.length === 0) return;
                    uploadBtn.disabled = true;
                    uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 上传中...';

                    const uploadPromises = selectedFiles.map(file => {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('path', customPath.value || '');
                        return fetch('/api/upload', { method: 'POST', body: formData })
                            .then(response => response.ok ? response.json() : Promise.reject('上传失败'))
                            .catch(error => ({ error: true, message: error.message, name: file.name }));
                    });

                    const results = await Promise.all(uploadPromises);
                    displayResults(results);

                    uploadBtn.disabled = false;
                    uploadBtn.textContent = '上传图片';
                    selectedFiles = [];
                    updateFilePreview();
                });

                function displayResults(results) {
                    modalContent.innerHTML = '';
                    const successfulUploads = results.filter(r => !r.error);
                    const failedUploads = results.filter(r => r.error);

                    if (failedUploads.length > 0) {
                        const errorAlert = document.createElement('div');
                        errorAlert.className = 'alert alert-danger';
                        errorAlert.innerHTML = \`<strong>\${failedUploads.length} 个文件上传失败:</strong> \${failedUploads.map(f => f.name).join(', ')}\`;
                        modalContent.appendChild(errorAlert);
                    }

                    if (successfulUploads.length > 0) {
                        successfulUploads.forEach(result => {
                            const linkItem = document.createElement('div');
                            linkItem.className = 'card mb-3';
                            linkItem.innerHTML = \`
                                <div class="card-header">\${result.key}</div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <label class="form-label small">直接链接</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control form-control-sm" value="\${result.url}" readonly>
                                            <button class="btn btn-outline-secondary btn-sm copy-btn" data-text="\${result.url}">复制</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="form-label small">Markdown</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control form-control-sm" value="![img](\${result.url})" readonly>
                                            <button class="btn btn-outline-secondary btn-sm copy-btn" data-text="![img](\${result.url})">复制</button>
                                        </div>
                                    </div>
                                </div>
                            \`;
                            modalContent.appendChild(linkItem);
                        });
                    }
                    successModal.show();

                    document.querySelectorAll('.copy-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const textToCopy = e.currentTarget.dataset.text;
                            navigator.clipboard.writeText(textToCopy).then(() => {
                                const originalText = e.currentTarget.textContent;
                                e.currentTarget.textContent = '已复制';
                                setTimeout(() => { e.currentTarget.textContent = originalText; }, 1500);
                            });
                        });
                    });
                }
            });
        </script>
    </body>
    </html>
    `;

	return new Response(html, {
		headers: {'Content-Type': 'text/html; charset=utf-8'}
	});
}

/**
 * 提供图库页面的HTML
 * @returns {Response} - 包含图库页面HTML的响应
 */
function serveGalleryPage() {
	const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R2管理 - 图库</title>
    <link href="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.7/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/bootstrap-icons/1.13.1/font/bootstrap-icons.min.css">
    <style>
        .gallery .item .card {
            cursor: pointer;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .gallery .item .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
        .gallery .item .file-image {
            width: 100%;
            aspect-ratio: 1 / 1;
            object-fit: cover;
        }
        .gallery .item .checkbox {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            z-index: 10;
            background-color: #fff;
        }
        .gallery .item.selected .card {
             border-color: var(--bs-primary);
        }
        .directory-icon {
            font-size: 4rem;
            color: #ffc107;
        }
        .toast-container {
            z-index: 1100;
        }
        .image-preview-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1200;
            cursor: pointer;
        }
        .image-preview-overlay.show {
            display: flex;
        }
        .preview-content {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            cursor: default;
        }
    </style>
    <script>
        // SVG 原始代码
        const svgIcon = \`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><g fill="none"><path fill="url(#fluentColorSettings480)" d="M19.494 43.468c1.479.353 2.993.531 4.513.531a19.4 19.4 0 0 0 4.503-.534a1.94 1.94 0 0 0 1.474-1.672l.338-3.071a2.32 2.32 0 0 1 2.183-2.075c.367-.016.732.053 1.068.2l2.807 1.231a1.92 1.92 0 0 0 1.554.01c.247-.105.468-.261.65-.458a20.4 20.4 0 0 0 4.51-7.779a1.94 1.94 0 0 0-.7-2.133l-2.494-1.84a2.326 2.326 0 0 1 0-3.764l2.486-1.836a1.94 1.94 0 0 0 .7-2.138a20.3 20.3 0 0 0-4.515-7.777a1.94 1.94 0 0 0-2.192-.45l-2.806 1.236c-.29.131-.606.2-.926.2a2.34 2.34 0 0 1-2.32-2.088l-.34-3.06a1.94 1.94 0 0 0-1.5-1.681a21.7 21.7 0 0 0-4.469-.519a22 22 0 0 0-4.5.52a1.935 1.935 0 0 0-1.5 1.677l-.34 3.062a2.35 2.35 0 0 1-.768 1.488a2.53 2.53 0 0 1-1.569.6a2.3 2.3 0 0 1-.923-.194l-2.8-1.236a1.94 1.94 0 0 0-2.2.452a20.35 20.35 0 0 0-4.51 7.775a1.94 1.94 0 0 0 .7 2.137l2.488 1.836a2.344 2.344 0 0 1 .701 2.938a2.34 2.34 0 0 1-.7.829l-2.49 1.839a1.94 1.94 0 0 0-.7 2.135a20.3 20.3 0 0 0 4.51 7.782a1.93 1.93 0 0 0 2.193.454l2.818-1.237c.291-.128.605-.194.923-.194h.008a2.34 2.34 0 0 1 2.32 2.074l.338 3.057a1.94 1.94 0 0 0 1.477 1.673M24 30.25a6.25 6.25 0 1 1 0-12.5a6.25 6.25 0 0 1 0 12.5"/><defs><linearGradient id="fluentColorSettings480" x1="33.588" x2="11.226" y1="42.451" y2="7.607" gradientUnits="userSpaceOnUse"><stop stop-color="#70777d"/><stop offset="1" stop-color="#b9c0c7"/></linearGradient></defs></g></svg>\`;                 
        // 创建 blob 和 URL
        const blob = new Blob([svgIcon], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);                  
        // 创建 favicon link
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = url;                    
        // 插入到 head 中
        document.head.appendChild(link);
    </script>
</head>
<body class="bg-light">
    <header>
        <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
            <div class="container">
                <a class="navbar-brand fw-bold" href="#">R2管理</a>
                <div class="d-flex align-items-center">
                    <a href="/upload" class="btn btn-outline-primary me-2">上传图片</a>
                    <button id="newFolderBtn" class="btn btn-secondary me-2">新建文件夹</button>
                    <button id="deleteBtn" class="btn btn-danger" disabled>删除所选</button>
                </div>
            </div>
        </nav>
    </header>

    <div class="container my-4">
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                    <nav id="breadcrumb" style="--bs-breadcrumb-divider: '>';" aria-label="breadcrumb"></nav>
                    <div class="form-check" id="selectAllContainer" style="display: none;">
                        <input class="form-check-input" type="checkbox" id="selectAllCheckbox">
                        <label class="form-check-label" for="selectAllCheckbox">&nbsp全选</label>
                    </div>
                </div>

                <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-3" id="gallery">
                </div>

                <nav id="paginationContainer" class="mt-4" aria-label="Page navigation">
                    <ul class="pagination justify-content-center" id="pagination"></ul>
                </nav>
            </div>
        </div>
    </div>

    <div class="modal fade" id="folderModal" tabindex="-1" aria-labelledby="folderModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="folderModalLabel">新建文件夹</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <label for="folderName" class="form-label">文件夹名称</label>
                    <input type="text" id="folderName" class="form-control" placeholder="请输入文件夹名称">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                    <button type="button" id="createFolderBtn" class="btn btn-primary">创建</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="loading" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered justify-content-center" style="background: none; border: none;">
            <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>

    <div class="toast-container position-fixed top-0 end-0 p-3">
        <div id="notification" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">通知</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body"></div>
        </div>
    </div>

    <div id="imagePreview" class="image-preview-overlay">
        <img class="preview-content" id="previewImage">
    </div>

    <script src="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.3.7/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            let currentPath = '';
            let selectedItems = [];
            let currentPage = 1;
            let hideTimeout = null;
            
            const galleryEl = document.getElementById('gallery');
            const breadcrumbEl = document.getElementById('breadcrumb');
            const paginationEl = document.getElementById('pagination');
            const deleteBtn = document.getElementById('deleteBtn');
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            const selectAllContainer = document.getElementById('selectAllContainer');
            const imagePreview = document.getElementById('imagePreview');
            const previewImage = document.getElementById('previewImage');
            
            const folderModal = new bootstrap.Modal(document.getElementById('folderModal'));
            const loadingModal = new bootstrap.Modal(document.getElementById('loading'));
            const notificationToast = new bootstrap.Toast(document.getElementById('notification'));

            const urlParams = new URLSearchParams(window.location.search);
            currentPage = parseInt(urlParams.get('page')) || 1;

            async function apiCall(endpoint, options = {}) {
                showLoading(true);
                try {
                    const response = await fetch(endpoint, options);
                    if (!response.ok) throw new Error('网络响应失败');
                    return await response.json();
                } catch (error) {
                    showNotification('操作失败: ' + error.message, 'danger');
                    return { success: false, error };
                } finally {
                    showLoading(false);
                }
            }

            async function loadGallery() {
                const data = await apiCall(\`/api/list?prefix=\${encodeURIComponent(currentPath)}&page=\${currentPage}\`);
                if (data && data.success) {
                    updateBreadcrumb();
                    renderGallery(data.directories, data.files);
                    renderPagination(data.pagination);
                    selectedItems = [];
                    updateControls();
                }
            }

            function updateBreadcrumb() {
                breadcrumbEl.innerHTML = '<ol class="breadcrumb mb-0"></ol>';
                const ol = breadcrumbEl.querySelector('ol');
                let path = '';
                const homeItem = document.createElement('li');
                homeItem.className = 'breadcrumb-item';
                homeItem.innerHTML = '<a href="#" data-path="">首页</a>';
                ol.appendChild(homeItem);

                if (currentPath) {
                    const parts = currentPath.replace(/\\/$/, '').split('/');
                    parts.forEach((part, index) => {
                        if(!part) return;
                        path += part + '/';
                        const item = document.createElement('li');
                        item.className = 'breadcrumb-item';
                        item.innerHTML = \`<a href="#" data-path="\${path}">\${part}</a>\`;
                        ol.appendChild(item);
                    });
                }
                ol.lastChild.classList.add('active');
                ol.lastChild.setAttribute('aria-current', 'page');
                ol.lastChild.innerHTML = ol.lastChild.textContent;
            }

            breadcrumbEl.addEventListener('click', e => {
                if (e.target.tagName === 'A' && e.target.dataset.path !== undefined) {
                    e.preventDefault();
                    currentPath = e.target.dataset.path;
                    currentPage = 1;
                    loadGallery();
                }
            });

            function renderGallery(directories, files) {
                galleryEl.innerHTML = '';
                const hasFiles = files.length > 0;
                selectAllContainer.style.display = hasFiles ? 'flex' : 'none';

                const items = [
                    ...directories.map(dir => ({...dir, isDir: true})),
                    ...files.map(file => ({...file, isFile: true}))
                ];

                if (items.length === 0) {
                    galleryEl.innerHTML = '<div class="col"><p class="text-muted">当前文件夹为空</p></div>';
                    return;
                }

                items.forEach(item => {
                    const col = document.createElement('div');
                    col.className = 'col item';
                    if (item.isDir) {
                        col.innerHTML = \`
                            <div class="card text-center h-100" data-path="\${item.path}">
                                <div class="card-body d-flex flex-column justify-content-center align-items-center">
                                    <i class="bi bi-folder-fill directory-icon"></i>
                                    <p class="card-text text-truncate mt-2" title="\${item.name}">\${item.name}</p>
                                </div>
                            </div>
                        \`;
                    } else { // isFile
                       col.dataset.key = item.key;
                       col.innerHTML = \`
                           <div class="card h-100 position-relative">
                               <input type="checkbox" class="form-check-input checkbox position-absolute top-0 end-0 m-2">
                               \${item.name === '.null' 
                                   ? '<div class="card-body text-center d-flex flex-column justify-content-center align-items-center"><i class="bi bi-file-earmark-binary fs-1"></i></div>'
                                   : \`<img src="\${item.url}" class="card-img-top file-image w-100 h-100 object-fit-cover" alt="\${item.name}">\`
                               }
                               <div class="card-footer text-body-secondary small">
                                   <div class="d-flex justify-content-between align-items-center">
                                       <div class="flex-grow-1 text-truncate me-2">
                                           <p class="card-text text-truncate mb-0" title="\${item.name}">\${item.name}</p>
                                           <p class="card-text mb-0"><small>\${formatFileSize(item.size)}</small></p>
                                       </div>
                                       \${item.name !== '.null' ? \`<button class="btn btn-sm btn-outline-secondary preview-btn flex-shrink-0" data-url="\${item.url}"><i class="bi bi-eye"></i></button>\` : ''}
                                   </div>
                               </div>
                           </div>
                       \`;
                    }
                    galleryEl.appendChild(col);
                });
            }
            
            galleryEl.addEventListener('click', e => {
                const itemEl = e.target.closest('.item');
                if (!itemEl) return;

                const dirCard = itemEl.querySelector('.card[data-path]');
                if (dirCard) {
                    currentPath = dirCard.dataset.path;
                    currentPage = 1;
                    loadGallery();
                    return;
                }
                
                if (itemEl.dataset.key) {
                    const previewBtn = e.target.closest('.preview-btn');
                    if (previewBtn) {
                        e.stopPropagation(); // 防止触发选中
                        const imageUrl = previewBtn.dataset.url;
                        previewImage.src = imageUrl;
                        imagePreview.classList.add('show');
                        return;
                    }

                    // 检查点击目标是否是复选框、图片或二进制文件图标
                    const isSelectableTarget = e.target.classList.contains('checkbox') ||
                                               e.target.classList.contains('file-image') ||
                                               e.target.classList.contains('bi-file-earmark-binary');

                    if (isSelectableTarget) {
                        const key = itemEl.dataset.key;
                        const checkbox = itemEl.querySelector('.checkbox');
                        const index = selectedItems.indexOf(key);
                        if (index > -1) {
                            selectedItems.splice(index, 1);
                            itemEl.classList.remove('selected');
                            checkbox.checked = false;
                        } else {
                            selectedItems.push(key);
                            itemEl.classList.add('selected');
                            checkbox.checked = true;
                        }
                        updateControls();
                    }
                }
            });

            function renderPagination({ totalPages }) {
                paginationEl.innerHTML = '';
                if (totalPages <= 1) return;

                const createPageItem = (page, text, isActive = false, isDisabled = false) => {
                    const li = document.createElement('li');
                    li.className = \`page-item \${isActive ? 'active' : ''} \${isDisabled ? 'disabled' : ''}\`;
                    li.innerHTML = \`<a class="page-link" href="#" data-page="\${page}">\${text}</a>\`;
                    return li;
                };

                paginationEl.appendChild(createPageItem(currentPage - 1, '«', false, currentPage === 1));
                for (let i = 1; i <= totalPages; i++) {
                    paginationEl.appendChild(createPageItem(i, i, i === currentPage));
                }
                paginationEl.appendChild(createPageItem(currentPage + 1, '»', false, currentPage === totalPages));
            }

            paginationEl.addEventListener('click', e => {
                if (e.target.tagName === 'A' && e.target.dataset.page) {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page);
                    if (page !== currentPage && page > 0 && !isNaN(page)) {
                        currentPage = page;
                        const url = new URL(window.location);
                        url.searchParams.set('page', currentPage);
                        window.history.pushState({}, '', url);
                        loadGallery();
                    }
                }
            });

            function updateControls() {
                const numFiles = galleryEl.querySelectorAll('.item[data-key]').length;
                deleteBtn.disabled = selectedItems.length === 0;
                selectAllCheckbox.checked = numFiles > 0 && selectedItems.length === numFiles;
                selectAllCheckbox.indeterminate = selectedItems.length > 0 && selectedItems.length < numFiles;
            }

            selectAllCheckbox.addEventListener('change', () => {
                const fileItems = galleryEl.querySelectorAll('.item[data-key]');
                selectedItems = [];
                fileItems.forEach(item => {
                    const checkbox = item.querySelector('.checkbox');
                    if (selectAllCheckbox.checked) {
                        selectedItems.push(item.dataset.key);
                        item.classList.add('selected');
                        checkbox.checked = true;
                    } else {
                        item.classList.remove('selected');
                        checkbox.checked = false;
                    }
                });
                updateControls();
            });

            document.getElementById('newFolderBtn').addEventListener('click', () => folderModal.show());
            document.getElementById('createFolderBtn').addEventListener('click', async () => {
                const folderName = document.getElementById('folderName').value.trim();
                if (!folderName) return;
                const path = currentPath + folderName + '/';
                const result = await apiCall('/api/create-folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path })
                });
                if (result.success) {
                    folderModal.hide();
                    document.getElementById('folderName').value = '';
                    showNotification('文件夹创建成功', 'success');
                    loadGallery();
                }
            });

            deleteBtn.addEventListener('click', async () => {
                if (selectedItems.length === 0 || !confirm(\`确定要删除选中的 \${selectedItems.length} 个项目吗？\`)) return;
                const result = await apiCall('/api/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keys: selectedItems })
                });
                if (result.success) {
                    showNotification('删除成功', 'success');
                    loadGallery();
                }
            });

            function showLoading(show) {
                if (show) {
                    if (hideTimeout) {
                        clearTimeout(hideTimeout);
                        hideTimeout = null;
                    }
                    loadingModal.show();
                } else {
                    hideTimeout = setTimeout(() => loadingModal.hide(), 200);
                }
            }

            function showNotification(message, type = 'success') {
                const toastBody = document.querySelector('#notification .toast-body');
                const toastEl = document.getElementById('notification');
                toastEl.classList.remove('bg-success', 'bg-danger');
                toastEl.classList.add(\`bg-\${type}\`, 'text-white');
                toastBody.textContent = message;
                notificationToast.show();
            }

            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' B';
                const i = Math.floor(Math.log(bytes) / Math.log(1024));
                return \`\${(bytes / Math.pow(1024, i)).toFixed(2)} \${['B', 'KB', 'MB', 'GB'][i]}\`;
            }

            imagePreview.addEventListener('click', (e) => {
                if (e.target === imagePreview) {
                    imagePreview.classList.remove('show');
                    previewImage.src = '';
                }
            });

            loadGallery();
        });
    </script>
</body>
</html>
    `;

	return new Response(html, {
		headers: {'Content-Type': 'text/html; charset=utf-8'}
	});
}

/**
 * 处理从网页界面上传的文件
 * @param {Request} request - 包含文件数据的请求
 * @param {R2Bucket} bucket - R2存储桶实例
 * @param {string} baseUrl - 用于构建公共URL的基础URL
 * @returns {Promise<Response>} - 包含上传结果的JSON响应
 */
async function handleWebUpload(request, bucket, baseUrl) {
	try {
		// 解析表单数据
		const formData = await request.formData();
		const file = formData.get('file');
		const path = formData.get('path') || ''; // 获取自定义路径

		if (!file) {
			return new Response(JSON.stringify({
				success: false,
				message: "No file provided"
			}), {
				status: 400,
				headers: {'Content-Type': 'application/json'}
			});
		}

		// 处理文件数据
		const fileBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(fileBuffer);

		// 检测文件类型
		const detectedType = detectImageType(uint8Array);
		if (!detectedType) {
			return new Response(JSON.stringify({
				success: false,
				message: "Only JPG/PNG formats are supported"
			}), {
				status: 400,
				headers: {'Content-Type': 'application/json'}
			});
		}

		// 生成文件名，包含日期前缀和短UUID
		const date = new Date();
		const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
		const shortUUID = crypto.randomUUID().split('-')[0];

		// 如果提供了路径，则构建完整的文件键
		let key = `${formattedDate}_${shortUUID}.${detectedType.ext}`;
		if (path) {
			// 确保路径以斜杠结尾
			const formattedPath = path.endsWith('/') ? path : `${path}/`;
			key = `${formattedPath}${key}`;
		}

		// 上传到R2
		await bucket.put(key, fileBuffer, {
			httpMetadata: {
				contentType: detectedType.mime
			}
		});

		// 生成响应URL
		const imageUrl = `${baseUrl}/${key}`;

		return new Response(JSON.stringify({
			success: true,
			url: imageUrl,
			markdown: `![img](${imageUrl})`,
			key: key
		}), {
			headers: {'Content-Type': 'application/json'}
		});

	} catch (error) {
		console.error('Upload failed:', error);
		return new Response(JSON.stringify({
			success: false,
			message: "File upload failed, please try again."
		}), {
			status: 500,
			headers: {'Content-Type': 'application/json'}
		});
	}
}

/**
 * 列出R2存储桶中的文件和目录
 * @param {Request} request - 传入的请求，可能包含prefix, page, pageSize等查询参数
 * @param {R2Bucket} bucket - R2存储桶实例
 * @param {string} BASE_URL - 用于构建公共URL的基础URL
 * @returns {Promise<Response>} - 包含文件和目录列表的JSON响应
 */
async function handleListFiles(request, bucket, BASE_URL) {
	try {
		const url = new URL(request.url);
		const prefix = url.searchParams.get('prefix') || '';
		const delimiter = '/';

		// 获取分页参数
		const page = parseInt(url.searchParams.get('page') || '1', 10); // 默认为第1页
		const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10); // 默认每页50项

		// 列出对象
		const listResult = await bucket.list({
			prefix: prefix,
			delimiter: delimiter
		});

		// 格式化目录 (commonPrefixes)
		const directories = (listResult.delimitedPrefixes || []).map(delimitedPrefixes => {
			const name = delimitedPrefixes.substring(prefix.length).replace(/\/$/, '');
			return {
				name: name,
				path: delimitedPrefixes,
				type: 'directory'
			};
		});

		// 格式化文件 (objects)
		const files = (listResult.objects || []).map(object => {
			// 跳过代表当前目录的对象
			if (object.key === prefix) {
				return null;
			}

			// 从完整路径中提取文件名
			const name = object.key.substring(prefix.length);
			if (!name) return null; // 如果文件名为空则跳过

			return {
				name: name,
				key: object.key,
				size: object.size,
				uploaded: object.uploaded,
				type: 'file',
				url: `${BASE_URL}/${encodeURIComponent(object.key)}`
			};
		}).filter(file => file !== null);

		// 实现分页
		const totalFiles = files.length;
		const totalPages = Math.ceil(totalFiles / pageSize);

		// 计算当前页的起始和结束索引
		const startIndex = (page - 1) * pageSize;
		const endIndex = Math.min(startIndex + pageSize, totalFiles);
		const filesOnPage = files.slice(startIndex, endIndex);

		// 计算父目录路径
		let parentPath = '';
		if (prefix) {
			const parts = prefix.split('/');
			parts.pop(); // 移除最后一个部分 (如果前缀以/结尾，则为空)
			if (parts.length > 0) {
				parts.pop(); // 移除目录名
				parentPath = parts.join('/');
				if (parentPath) parentPath += '/';
			}
		}

		return new Response(JSON.stringify({
			success: true,
			currentPath: prefix,
			parentPath: parentPath,
			directories: directories,
			files: filesOnPage,
			pagination: {
				currentPage: page,
				pageSize: pageSize,
				totalFiles: totalFiles,
				totalPages: totalPages
			}
		}), {
			headers: {'Content-Type': 'application/json'}
		});

	} catch (error) {
		console.error('List files error:', error);
		return new Response(JSON.stringify({
			success: false,
			message: 'Failed to list files'
		}), {
			status: 500,
			headers: {'Content-Type': 'application/json'}
		});
	}
}

/**
 * 从R2存储桶中删除文件
 * @param {Request} request - 包含要删除文件键(keys)数组的请求
 * @param {R2Bucket} bucket - R2存储桶实例
 * @returns {Promise<Response>} - 包含删除结果的JSON响应
 */
async function handleDeleteFiles(request, bucket) {
	try {
		const body = await request.json();
		const keys = body.keys;
		if (!keys || !Array.isArray(keys) || keys.length === 0) {
			return new Response(JSON.stringify({
				success: false,
				message: "No valid keys provided for deletion"
			}), {
				status: 400,
				headers: {'Content-Type': 'application/json'}
			});
		}
		// 并行删除所有指定的文件
		const deletePromises = keys.map(key => bucket.delete(key));
		await Promise.all(deletePromises);

		return new Response(JSON.stringify({
			success: true,
			message: `Successfully deleted ${keys.length} file(s)`,
			deletedKeys: keys
		}), {
			headers: {'Content-Type': 'application/json'}
		});
	} catch (error) {
		console.error('Delete files error:', error);
		return new Response(JSON.stringify({
			success: false,
			message: 'Failed to delete files'
		}), {
			status: 500,
			headers: {'Content-Type': 'application/json'}
		});
	}
}

/**
 * 在R2存储桶中创建文件夹
 * @param {Request} request - 包含文件夹路径(path)的请求
 * @param {R2Bucket} bucket - R2存储桶实例
 * @returns {Promise<Response>} - 包含创建结果的JSON响应
 */
async function handleCreateFolder(request, bucket) {
	try {
		const body = await request.json();
		let folderPath = body.path;

		if (!folderPath) {
			return new Response(JSON.stringify({
				success: false,
				message: "Folder path is required"
			}), {
				status: 400,
				headers: {'Content-Type': 'application/json'}
			});
		}

		// 确保文件夹路径以斜杠结尾
		if (!folderPath.endsWith('/')) {
			folderPath += '/';
		}

		// 创建一个.null文件来表示文件夹（这是S3/R2中的一种常见做法）
		// 这不是严格必需的，但有助于处理空文件夹
		const nullPath = `${folderPath}.null`;
		await bucket.put(nullPath, new Uint8Array(0), {
			httpMetadata: {
				contentType: 'application/x-directory'
			}
		});

		return new Response(JSON.stringify({
			success: true,
			message: "Folder created successfully",
			path: folderPath
		}), {
			headers: {'Content-Type': 'application/json'}
		});
	} catch (error) {
		console.error('Create folder error:', error);
		return new Response(JSON.stringify({
			success: false,
			message: 'Failed to create folder'
		}), {
			status: 500,
			headers: {'Content-Type': 'application/json'}
		});
	}
}


/**
 * 从URL下载图片并上传到R2
 * @param {string} imageUrl - 要下载的图片URL
 * @param {R2Bucket} bucket - R2存储桶实例
 * @param {boolean} isDocument - 是否是作为文档发送的
 * @param {string} userPath - 用户指定的上传子路径
 * @param {string} BASE_URL - 用于构建公共URL的基础URL
 * @returns {Promise<object>} - 包含上传结果的对象
 */
async function uploadImageToR2(imageUrl, bucket, isDocument = false, userPath = '', BASE_URL) {
	try {
		const response = await fetch(imageUrl);
		if (!response.ok) throw new Error('下载文件失败');

		const buffer = await response.arrayBuffer();
		const uint8Array = new Uint8Array(buffer);

		const detectedType = detectImageType(uint8Array);
		if (!detectedType) {
			return {
				ok: false,
				error: 'UNSUPPORTED_TYPE',
				message: '只支持 JPG/PNG 格式文件'
			};
		}
		const date = new Date();
		const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
		const shortUUID = crypto.randomUUID().split('-')[0];

		// 如果提供了用户路径，则构建完整的文件键
		let key = `${formattedDate}_${shortUUID}.${detectedType.ext}`;
		if (userPath) {
			// 确保路径格式正确（以斜杠结尾）
			const formattedPath = userPath.endsWith('/') ? userPath : `${userPath}/`;
			key = `${formattedPath}${key}`;
		}

		await bucket.put(key, buffer, {
			httpMetadata: {
				contentType: detectedType.mime
			},
		});

		return {ok: true, key};
	} catch (error) {
		console.error('上传失败:', error);
		return {
			ok: false,
			error: 'SERVER_ERROR',
			message: '文件上传失败，请稍后再试。'
		};
	}
}

/**
 * 从Telegram获取文件的临时下载URL
 * @param {string} fileId - 文件的唯一ID
 * @param {string} botToken - Telegram机器人的Token
 * @returns {Promise<string>} - 文件的可下载URL
 */
async function getFileUrl(fileId, botToken) {
	const response = await fetch(
		`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
	);
	const data = await response.json();
	return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
}

/**
 * 向指定的Telegram聊天发送文本消息
 * @param {number|string} chatId - 聊天ID
 * @param {string} text - 要发送的文本
 * @param {string} apiUrl - Telegram Bot API的基础URL
 * @param {object} options - 其他API选项 (例如 parse_mode)
 */
async function sendMessage(chatId, text, apiUrl, options = {}) {
	await fetch(`${apiUrl}/sendMessage`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			chat_id: chatId,
			text: text,
			...options
		}),
	});
}

/**
 * 向指定的Telegram聊天发送图片
 * @param {number|string} chatId - 聊天ID
 * @param {string} photoUrl - 图片的URL
 * @param {string} apiUrl - Telegram Bot API的基础URL
 * @param {string} caption - 图片的标题
 * @param {object} options - 其他API选项 (例如 parse_mode)
 * @returns {Promise<object>} - Telegram API的响应
 */
async function sendPhoto(chatId, photoUrl, apiUrl, caption = "", options = {}) {
	const response = await fetch(`${apiUrl}/sendPhoto`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			photo: photoUrl,
			caption: caption,
			...options
		}),
	});
	return await response.json();
}
