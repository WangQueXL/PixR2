export default {
	async fetch(request, env) {
		const requiredEnvVars = ['SECRET_KEY', 'TELEGRAM_BOT_TOKEN', 'CHAT_ID', 'BUCKET_NAME', 'BASE_URL'];
		const missingEnvVars = requiredEnvVars.filter(key => !env[key]);

		if (missingEnvVars.length > 0) {
			const missingVarsHtml = missingEnvVars.map(key => `<li class="list-group-item font-monospace">${key}</li>`).join('');
			const errorMessage = `
				<!DOCTYPE html>
				<html lang="zh-CN">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>配置错误 - R2管理</title>
                    <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABIFJREFUWEfNl11oHFUYht9vNttNNmpabWySGtysCdIKxdYVI6YaQau9MDa0BktDssuKbRShXogiFFIQ/EHBC0EQlh1EaZFIQSwujaQBwVLQCy+EaC0dL0SbWsSa3WTn78g5Z352NplJNl7EheXwzcyZ7znv956fIWzwjzY4P/7fAKkzxRRsexyMBtelFLFZ7WD+ZFTfSAVSU4UrAFLrSu530rRD+Z6wd4QCpD4vZMFQ/I/JZXfCZJgS4QBTBZ486wIMpnfh5kQSDBB/m9W2FIgX9Aq++/UH2VV2ULWRfG6lwawJYFdnD4bveQgMBIvJ5KKtiy0QbBvg7fm5b3D56hUJAFK1Z7PrBGAMe7b3Yf+Ofj8xc0BWAhIAwLdzF3Hp90sOAFRttFGAz3gJiPsA927vwxM7HwgCiDKEK3Jh7iIu//aLq7qqjY01qMCpogfQveV2jNz/mJ8QsgQWk7XnI5ZlcWJGmPn+a1z7a973QH60QYBPPpYmFDUE2ppbkdiUAHNcKFqQjLnPxHVFPK4bOsqVBXFfXCBStecONwigcgBZAs/N7gtdd0fF4hkHAFC1iUYBCp/609CDcCaNG7sA9fEyQFK1F0caVOAjDuAq4I3EnVauu5fFA+mU8Mrm5qT0iQ3M//1PaTjTP5HrIa1+LQhfBz48XeOB1QGODmTQ196OtpZW6DZgmBCtbgGG5bWzBkPu5R0+SDjAB6eLYDUK+KuaNJcTt9/UiqN7M+jd1h5IVpdY3uNApmgnT+wmsUmFA7w/VQQxaUJuJvfnuN8157GH70N/753eKOsS1SvgxwZ63nqQtHCA96ZWnQVkKXh3dB9uSbaIFy8btT/iZfeuLeHtwiP0WjjAO2cC64CU3JeeGKAYCo5ln8LOltCaBxM7QGUTSz/OY2JmmNRwgDc5gOOBFaYZmYCiM3QdGMIzWwkdcalAQIUQBX6+zlDRKTdzMArgjS+CCtSMnosR0xXQkomuQ0NiKt7dDKSbgVvjAdcHgP4oA1dvMBgGgRhy0yNRAJNfFgHHhDWuF6WwCU1VgCoGOg8PgWwSmwNvkwpDks9aC0gQUNGBqiH/ZPNNRLZkU276SBTAibNFkLsXBNeBmBVDbNEGFqvoPPJ04MUQL/cT8di7xu+JgwTxa7npsSiA18+uvBLaDIoZQ9OiDVpaRMfogbUB8C2TcQAJBIty0/kogFdLAuCOzq7gZmQxYT5WNmCVy9i0fy+vpyct35drSxKIuY/kUQqKRbnS81EAr5zLwkYxszuNzJ67nMMdwdJNmBUbi9cXsPDnDfy0pQNmU8IbmZBfSO10cWpeXxrugdJEFMDxr1JN8cQF07A7Nre1oK2tWS6c3GyGAlQMWAsVUG8a8e7ugAK8xm6tiZ9URM1rlYFWekERR/Xo74Lj51Mw7XGABt2llxhIsRQlVrUTSlWPW0uV+LZ9A+nEbVuT3ugjTChmAaNHSy/R7KoA9VtnVPz4KTFlx2GxwfpZ4ILBJhUxnCxNrGE3bCR57bNPFlkKpvM1JVt+BtBqk9Y+v+Efp/8CK9/SP1wSzRcAAAAASUVORK5CYII=">
					<link href="https://cdn.staticfile.net/twitter-bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
					<style>
						body {
							display: flex;
							align-items: center;
							justify-content: center;
							min-height: 100vh;
							background-color: #f8f9fa;
						}
						.container {
							max-width: 600px;
						}
					</style>
				</head>
				<body class="text-center">
					<div class="container p-4 p-md-5">
						<div class="card shadow-sm">
							<div class="card-body p-5">
								<h1 class="h3 mb-3 fw-normal text-danger">配置错误</h1>
								<p class="text-muted">检测到以下环境变量缺失或未正确设置：</p>
								<ul class="list-group mb-4">
									${missingVarsHtml}
								</ul>
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

		const SECRET_KEY = env.SECRET_KEY;
		const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
		const CHAT_ID = env.CHAT_ID.split(','); // Assuming CHAT_ID is a comma-separated string in env
		const BUCKET_NAME = env.BUCKET_NAME;
		const BASE_URL = env.BASE_URL;

		const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

		const url = new URL(request.url);
		const path = url.pathname;

		try {
			if (path === '/webhook' && request.method === 'POST') {
				return handleTelegramWebhook(request, env, TELEGRAM_API_URL, CHAT_ID, BUCKET_NAME, BASE_URL);
			}
			// Web interface routes
			if (path === '/login' && request.method === 'POST') {
				return handleLogin(request, SECRET_KEY);
			}
			if (path === '/' || path === '/index.html') {
				return serveLoginPage();
			}
			if (path === '/upload' && await isAuthenticated(request, SECRET_KEY)) {
				return serveUploadPage();
			}
			if (path === '/gallery' && await isAuthenticated(request, SECRET_KEY)) {
				return serveGalleryPage();
			}
			if (path === '/api/upload' && request.method === 'POST' && await isAuthenticated(request, SECRET_KEY)) {
				return handleWebUpload(request, env[BUCKET_NAME], BASE_URL);
			}
			if (path === '/api/list' && await isAuthenticated(request, SECRET_KEY)) {
				return handleListFiles(request, env[BUCKET_NAME], BASE_URL);
			}
			if (path === '/api/delete' && request.method === 'POST' && await isAuthenticated(request, SECRET_KEY)) {
				return handleDeleteFiles(request, env[BUCKET_NAME]);
			}
			if (path === '/api/create-folder' && request.method === 'POST' && await isAuthenticated(request, SECRET_KEY)) {
				return handleCreateFolder(request, env[BUCKET_NAME]);
			}

			// Telegram bot routes
			if (path === '/setWebhook') {
				const webhookUrl = `${url.protocol}//${url.host}/webhook`;
				const webhookResponse = await setWebhook(webhookUrl, TELEGRAM_API_URL);
				if (webhookResponse.ok) {
					return new Response(`Webhook set successfully to ${webhookUrl}`);
				}
				return new Response('Failed to set webhook', {status: 500});
			}

			return new Response('Not found', {status: 404});
		} catch (err) {
			console.error(err);
			return new Response('Server error', {status: 500});
		}
	}
};

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

function detectImageType(uint8Array) {
	// Check for JPEG signature (FF D8 FF)
	if (uint8Array.length >= 3 &&
		uint8Array[0] === 0xFF &&
		uint8Array[1] === 0xD8 &&
		uint8Array[2] === 0xFF) {
		return {mime: 'image/jpeg', ext: 'jpg'};
	}

	// Check for PNG signature (89 50 4E 47 0D 0A 1A 0A)
	const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
	if (uint8Array.length >= pngSignature.length) {
		const isPng = pngSignature.every(
			(byte, index) => uint8Array[index] === byte
		);
		if (isPng) return {mime: 'image/png', ext: 'png'};
	}

	// Add more image type detection as needed (GIF, WebP, etc.)

	return null;
}

async function handleTelegramWebhook(request, env) {
	try {
		const update = await request.json();

		if (!update.message) {
			return new Response('OK');
		}

		const chatId = update.message.chat.id;

		// Check if user is authorized
		if (!env.CHAT_ID.split(',').includes(chatId.toString())) {
			return new Response('Unauthorized access', {status: 403});
		}

		// Get functions for path management
		async function getUserPath(chatId) {
			const path = await env.INDEXES_KV.get(chatId.toString());
			if (path === '/') {
				return '';
			}
			return path || ''; // Default to empty string (root path)
		}

		async function setUserPath(chatId, path) {
			await env.INDEXES_KV.put(chatId.toString(), path);
		}

		// Handle media uploads
		async function handleMediaUpload(chatId, fileId, isDocument = false) {
			try {
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

		// Process text messages
		if (update.message.text) {
			const text = update.message.text.trim();

			// Handle /modify command
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

			// Handle /status command
			if (text === '/status') {
				const currentPath = await getUserPath(chatId);
				const statusMessage = currentPath ? `当前路径: ${currentPath}` : '当前路径: / (默认)';
				await sendMessage(chatId, statusMessage, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				return new Response('OK');
			}

			// Default message for any other text
			let mes = `请发送一张图片！\n或者使用以下命令：\n/modify 修改上传图片的存储路径\n/status 查看当前上传图片的路径`;
			await sendMessage(chatId, mes, `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
			return new Response('OK');
		}

		// Handle document files
		if (update.message.document) {
			const doc = update.message.document;
			const fileName = doc.file_name || '';
			const fileExt = fileName.split('.').pop().toLowerCase();

			if (!['jpg', 'jpeg', 'png'].includes(fileExt)) {
				await sendMessage(chatId, '不支持的文件类型，请发送 JPG/PNG 格式文件', `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`);
				return new Response('OK');
			}

			await handleMediaUpload(chatId, doc.file_id, true);
			return new Response('OK');
		}

		// Handle photos
		if (update.message.photo) {
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

// Authentication Functions
async function isAuthenticated(request, secretKey) {
	const cookies = parseCookies(request.headers.get('Cookie') || '');
	return cookies.auth === hashKey(secretKey).replace(/=/g, '');
}

async function handleLogin(request, secretKey) {
	const formData = await request.formData();
	const inputKey = formData.get('key');

	if (inputKey === secretKey) {
		const headers = new Headers();
		headers.append('Set-Cookie', `auth=${hashKey(secretKey).replace(/=/g, '')}; HttpOnly; Path=/; Max-Age=86400`);
		headers.append('Location', '/upload');
		return new Response(null, {
			status: 302,
			headers
		});
	}

	return serveLoginPage("密钥错误，请重新输入");
}

function hashKey(key) {
	// Simple hash function for demo purposes
	// In production, use a proper crypto hash
	return btoa(key);
}

function parseCookies(cookieString) {
	const cookies = {};
	cookieString.split(';').forEach(cookie => {
		const [name, value] = cookie.trim().split('=');
		if (name) cookies[name] = value;
	});
	return cookies;
}

// Page Rendering Functions
function serveLoginPage(errorMessage = null) {
	const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>R2管理 - 登录</title>
      <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABIFJREFUWEfNl11oHFUYht9vNttNNmpabWySGtysCdIKxdYVI6YaQau9MDa0BktDssuKbRShXogiFFIQ/EHBC0EQlh1EaZFIQSwujaQBwVLQCy+EaC0dL0SbWsSa3WTn78g5Z352NplJNl7EheXwzcyZ7znv956fIWzwjzY4P/7fAKkzxRRsexyMBtelFLFZ7WD+ZFTfSAVSU4UrAFLrSu530rRD+Z6wd4QCpD4vZMFQ/I/JZXfCZJgS4QBTBZ486wIMpnfh5kQSDBB/m9W2FIgX9Aq++/UH2VV2ULWRfG6lwawJYFdnD4bveQgMBIvJ5KKtiy0QbBvg7fm5b3D56hUJAFK1Z7PrBGAMe7b3Yf+Ofj8xc0BWAhIAwLdzF3Hp90sOAFRttFGAz3gJiPsA927vwxM7HwgCiDKEK3Jh7iIu//aLq7qqjY01qMCpogfQveV2jNz/mJ8QsgQWk7XnI5ZlcWJGmPn+a1z7a973QH60QYBPPpYmFDUE2ppbkdiUAHNcKFqQjLnPxHVFPK4bOsqVBXFfXCBStecONwigcgBZAs/N7gtdd0fF4hkHAFC1iUYBCp/609CDcCaNG7sA9fEyQFK1F0caVOAjDuAq4I3EnVauu5fFA+mU8Mrm5qT0iQ3M//1PaTjTP5HrIa1+LQhfBz48XeOB1QGODmTQ196OtpZW6DZgmBCtbgGG5bWzBkPu5R0+SDjAB6eLYDUK+KuaNJcTt9/UiqN7M+jd1h5IVpdY3uNApmgnT+wmsUmFA7w/VQQxaUJuJvfnuN8157GH70N/753eKOsS1SvgxwZ63nqQtHCA96ZWnQVkKXh3dB9uSbaIFy8btT/iZfeuLeHtwiP0WjjAO2cC64CU3JeeGKAYCo5ln8LOltCaBxM7QGUTSz/OY2JmmNRwgDc5gOOBFaYZmYCiM3QdGMIzWwkdcalAQIUQBX6+zlDRKTdzMArgjS+CCtSMnosR0xXQkomuQ0NiKt7dDKSbgVvjAdcHgP4oA1dvMBgGgRhy0yNRAJNfFgHHhDWuF6WwCU1VgCoGOg8PgWwSmwNvkwpDks9aC0gQUNGBqiH/ZPNNRLZkU276SBTAibNFkLsXBNeBmBVDbNEGFqvoPPJ04MUQL/cT8di7xu+JgwTxa7npsSiA18+uvBLaDIoZQ9OiDVpaRMfogbUB8C2TcQAJBIty0/kogFdLAuCOzq7gZmQxYT5WNmCVy9i0fy+vpyct35drSxKIuY/kUQqKRbnS81EAr5zLwkYxszuNzJ67nMMdwdJNmBUbi9cXsPDnDfy0pQNmU8IbmZBfSO10cWpeXxrugdJEFMDxr1JN8cQF07A7Nre1oK2tWS6c3GyGAlQMWAsVUG8a8e7ugAK8xm6tiZ9URM1rlYFWekERR/Xo74Lj51Mw7XGABt2llxhIsRQlVrUTSlWPW0uV+LZ9A+nEbVuT3ugjTChmAaNHSy/R7KoA9VtnVPz4KTFlx2GxwfpZ4ILBJhUxnCxNrGE3bCR57bNPFlkKpvM1JVt+BtBqk9Y+v+Efp/8CK9/SP1wSzRcAAAAASUVORK5CYII=">
      <link href="https://cdn.staticfile.net/twitter-bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
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
    </head>
    <body class="text-center">
        <main class="form-signin">
            <div class="card shadow-sm">
                <div class="card-body p-5">
                    <h1 class="h3 mb-4 fw-normal">R2 管理登录</h1>
                    <form action="/login" method="post">
                        <div class="form-floating mb-3">
                            <input type="password" class="form-control" id="floatingPassword" name="key" placeholder="访问密钥" required>
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

function serveUploadPage() {
	const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>R2管理 - 上传</title>
        <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABIFJREFUWEfNl11oHFUYht9vNttNNmpabWySGtysCdIKxdYVI6YaQau9MDa0BktDssuKbRShXogiFFIQ/EHBC0EQlh1EaZFIQSwujaQBwVLQCy+EaC0dL0SbWsSa3WTn78g5Z352NplJNl7EheXwzcyZ7znv956fIWzwjzY4P/7fAKkzxRRsexyMBtelFLFZ7WD+ZFTfSAVSU4UrAFLrSu530rRD+Z6wd4QCpD4vZMFQ/I/JZXfCZJgS4QBTBZ486wIMpnfh5kQSDBB/m9W2FIgX9Aq++/UH2VV2ULWRfG6lwawJYFdnD4bveQgMBIvJ5KKtiy0QbBvg7fm5b3D56hUJAFK1Z7PrBGAMe7b3Yf+Ofj8xc0BWAhIAwLdzF3Hp90sOAFRttFGAz3gJiPsA927vwxM7HwgCiDKEK3Jh7iIu//aLq7qqjY01qMCpogfQveV2jNz/mJ8QsgQWk7XnI5ZlcWJGmPn+a1z7a973QH60QYBPPpYmFDUE2ppbkdiUAHNcKFqQjLnPxHVFPK4bOsqVBXFfXCBStecONwigcgBZAs/N7gtdd0fF4hkHAFC1iUYBCp/609CDcCaNG7sA9fEyQFK1F0caVOAjDuAq4I3EnVauu5fFA+mU8Mrm5qT0iQ3M//1PaTjTP5HrIa1+LQhfBz48XeOB1QGODmTQ196OtpZW6DZgmBCtbgGG5bWzBkPu5R0+SDjAB6eLYDUK+KuaNJcTt9/UiqN7M+jd1h5IVpdY3uNApmgnT+wmsUmFA7w/VQQxaUJuJvfnuN8157GH70N/753eKOsS1SvgxwZ63nqQtHCA96ZWnQVkKXh3dB9uSbaIFy8btT/iZfeuLeHtwiP0WjjAO2cC64CU3JeeGKAYCo5ln8LOltCaBxM7QGUTSz/OY2JmmNRwgDc5gOOBFaYZmYCiM3QdGMIzWwkdcalAQIUQBX6+zlDRKTdzMArgjS+CCtSMnosR0xXQkomuQ0NiKt7dDKSbgVvjAdcHgP4oA1dvMBgGgRhy0yNRAJNfFgHHhDWuF6WwCU1VgCoGOg8PgWwSmwNvkwpDks9aC0gQUNGBqiH/ZPNNRLZkU276SBTAibNFkLsXBNeBmBVDbNEGFqvoPPJ04MUQL/cT8di7xu+JgwTxa7npsSiA18+uvBLaDIoZQ9OiDVpaRMfogbUB8C2TcQAJBIty0/kogFdLAuCOzq7gZmQxYT5WNmCVy9i0fy+vpyct35drSxKIuY/kUQqKRbnS81EAr5zLwkYxszuNzJ67nMMdwdJNmBUbi9cXsPDnDfy0pQNmU8IbmZBfSO10cWpeXxrugdJEFMDxr1JN8cQF07A7Nre1oK2tWS6c3GyGAlQMWAsVUG8a8e7ugAK8xm6tiZ9URM1rlYFWekERR/Xo74Lj51Mw7XGABt2llxhIsRQlVrUTSlWPW0uV+LZ9A+nEbVuT3ugjTChmAaNHSy/R7KoA9VtnVPz4KTFlx2GxwfpZ4ILBJhUxnCxNrGE3bCR57bNPFlkKpvM1JVt+BtBqk9Y+v+Efp/8CK9/SP1wSzRcAAAAASUVORK5CYII=">
        <link href="https://cdn.staticfile.net/twitter-bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.staticfile.net/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
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

        <script src="https://cdn.staticfile.net/twitter-bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
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

function serveGalleryPage() {
	const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R2管理 - 图库</title>
    <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAABIFJREFUWEfNl11oHFUYht9vNttNNmpabWySGtysCdIKxdYVI6YaQau9MDa0BktDssuKbRShXogiFFIQ/EHBC0EQlh1EaZFIQSwujaQBwVLQCy+EaC0dL0SbWsSa3WTn78g5Z352NplJNl7EheXwzcyZ7znv956fIWzwjzY4P/7fAKkzxRRsexyMBtelFLFZ7WD+ZFTfSAVSU4UrAFLrSu530rRD+Z6wd4QCpD4vZMFQ/I/JZXfCZJgS4QBTBZ486wIMpnfh5kQSDBB/m9W2FIgX9Aq++/UH2VV2ULWRfG6lwawJYFdnD4bveQgMBIvJ5KKtiy0QbBvg7fm5b3D56hUJAFK1Z7PrBGAMe7b3Yf+Ofj8xc0BWAhIAwLdzF3Hp90sOAFRttFGAz3gJiPsA927vwxM7HwgCiDKEK3Jh7iIu//aLq7qqjY01qMCpogfQveV2jNz/mJ8QsgQWk7XnI5ZlcWJGmPn+a1z7a973QH60QYBPPpYmFDUE2ppbkdiUAHNcKFqQjLnPxHVFPK4bOsqVBXFfXCBStecONwigcgBZAs/N7gtdd0fF4hkHAFC1iUYBCp/609CDcCaNG7sA9fEyQFK1F0caVOAjDuAq4I3EnVauu5fFA+mU8Mrm5qT0iQ3M//1PaTjTP5HrIa1+LQhfBz48XeOB1QGODmTQ196OtpZW6DZgmBCtbgGG5bWzBkPu5R0+SDjAB6eLYDUK+KuaNJcTt9/UiqN7M+jd1h5IVpdY3uNApmgnT+wmsUmFA7w/VQQxaUJuJvfnuN8157GH70N/753eKOsS1SvgxwZ63nqQtHCA96ZWnQVkKXh3dB9uSbaIFy8btT/iZfeuLeHtwiP0WjjAO2cC64CU3JeeGKAYCo5ln8LOltCaBxM7QGUTSz/OY2JmmNRwgDc5gOOBFaYZmYCiM3QdGMIzWwkdcalAQIUQBX6+zlDRKTdzMArgjS+CCtSMnosR0xXQkomuQ0NiKt7dDKSbgVvjAdcHgP4oA1dvMBgGgRhy0yNRAJNfFgHHhDWuF6WwCU1VgCoGOg8PgWwSmwNvkwpDks9aC0gQUNGBqiH/ZPNNRLZkU276SBTAibNFkLsXBNeBmBVDbNEGFqvoPPJ04MUQL/cT8di7xu+JgwTxa7npsSiA18+uvBLaDIoZQ9OiDVpaRMfogbUB8C2TcQAJBIty0/kogFdLAuCOzq7gZmQxYT5WNmCVy9i0fy+vpyct35drSxKIuY/kUQqKRbnS81EAr5zLwkYxszuNzJ67nMMdwdJNmBUbi9cXsPDnDfy0pQNmU8IbmZBfSO10cWpeXxrugdJEFMDxr1JN8cQF07A7Nre1oK2tWS6c3GyGAlQMWAsVUG8a8e7ugAK8xm6tiZ9URM1rlYFWekERR/Xo74Lj51Mw7XGABt2llxhIsRQlVrUTSlWPW0uV+LZ9A+nEbVuT3ugjTChmAaNHSy/R7KoA9VtnVPz4KTFlx2GxwfpZ4ILBJhUxnCxNrGE3bCR57bNPFlkKpvM1JVt+BtBqk9Y+v+Efp/8CK9/SP1wSzRcAAAAASUVORK5CYII=">
    <link href="https://cdn.staticfile.net/twitter-bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.staticfile.net/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css">
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

    <script src="https://cdn.staticfile.net/twitter-bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            let currentPath = '';
            let selectedItems = [];
            let currentPage = 1;
            
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
                if (show) loadingModal.show();
                else setTimeout(() => loadingModal.hide(), 200);
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

async function handleWebUpload(request, bucket, baseUrl) {
	try {
		// Parse the form data
		const formData = await request.formData();
		const file = formData.get('file');
		const path = formData.get('path') || '';

		if (!file) {
			return new Response(JSON.stringify({
				success: false,
				message: "No file provided"
			}), {
				status: 400,
				headers: {'Content-Type': 'application/json'}
			});
		}

		// Process file data
		const fileBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(fileBuffer);

		// Detect file type
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

		// Generate file name with date prefix and UUID
		const date = new Date();
		const formattedDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
		const shortUUID = crypto.randomUUID().split('-')[0];

		// Build file path with user prefix if provided
		let key = `${formattedDate}_${shortUUID}.${detectedType.ext}`;
		if (path) {
			// Ensure path has trailing slash
			const formattedPath = path.endsWith('/') ? path : `${path}/`;
			key = `${formattedPath}${key}`;
		}

		// Upload to R2
		await bucket.put(key, fileBuffer, {
			httpMetadata: {
				contentType: detectedType.mime
			}
		});

		// Generate URLs for response
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

async function handleListFiles(request, bucket, BASE_URL) {
	try {
		const url = new URL(request.url);
		const prefix = url.searchParams.get('prefix') || '';
		const delimiter = '/';

		// Get pagination parameters
		const page = parseInt(url.searchParams.get('page') || '1', 10); // Default to page 1
		const pageSize = parseInt(url.searchParams.get('pageSize') || '50', 10); // Default to 50 items per page

		// List objects with the given prefix
		const listResult = await bucket.list({
			prefix: prefix,
			delimiter: delimiter
		});

		// Format directories (commonPrefixes) and files (objects)
		const directories = (listResult.delimitedPrefixes || []).map(delimitedPrefixes => {
			const name = delimitedPrefixes.substring(prefix.length).replace(/\/$/, '');
			return {
				name: name,
				path: delimitedPrefixes,
				type: 'directory'
			};
		});

		const files = (listResult.objects || []).map(object => {
			// Skip objects that represent the current directory or are used as directory markers
			if (object.key === prefix) {
				return null;
			}

			// For actual files, extract just the filename from the full path
			const name = object.key.substring(prefix.length);
			if (!name) return null; // Skip if name is empty

			return {
				name: name,
				key: object.key,
				size: object.size,
				uploaded: object.uploaded,
				type: 'file',
				url: `${BASE_URL}/${encodeURIComponent(object.key)}`
			};
		}).filter(file => file !== null);

		// Implement pagination
		const totalFiles = files.length;
		const totalPages = Math.ceil(totalFiles / pageSize);

		// Calculate starting index for the current page
		const startIndex = (page - 1) * pageSize;
		const endIndex = Math.min(startIndex + pageSize, totalFiles); // Ensure we don't exceed the array length
		const filesOnPage = files.slice(startIndex, endIndex);

		// Calculate parent directory path
		let parentPath = '';
		if (prefix) {
			const parts = prefix.split('/');
			parts.pop(); // Remove the last part (empty if prefix ends with /)
			if (parts.length > 0) {
				parts.pop(); // Remove the directory name
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


async function handleDeleteFiles(request, bucket) {
	try {
		console.log("Request received");
		const body = await request.json();
		console.log("Body parsed", body);
		const keys = body.keys;
		if (!keys || !Array.isArray(keys) || keys.length === 0) {
			console.log("No valid keys provided");
			return new Response(JSON.stringify({
				success: false,
				message: "No valid keys provided for deletion"
			}), {
				status: 400,
				headers: {'Content-Type': 'application/json'}
			});
		}
		const deletePromises = keys.map(key => bucket.delete(key));
		await Promise.all(deletePromises);
		console.log(`${keys.length} files deleted`);

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


async function handleCreateFolder(request, bucket) {
	try {
		// Parse the JSON body to get the folder path
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

		// Ensure the folder path ends with a slash
		if (!folderPath.endsWith('/')) {
			folderPath += '/';
		}

		// Create a .null file to represent the folder (a common practice in S3/R2)
		// This isn't strictly necessary but helps with empty folders
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

		// Build file path with user prefix if provided
		let key = `${formattedDate}_${shortUUID}.${detectedType.ext}`;
		if (userPath) {
			// Ensure path format is correct (has trailing slash)
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

async function getFileUrl(fileId, botToken) {
	const response = await fetch(
		`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
	);
	const data = await response.json();
	return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
}

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