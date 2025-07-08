# R2-Img-Tg

使用 Cloudflare Worker 快速将 Telegram 内的图片转存至 Cloudflare R2 存储桶，支持直链调用以及 Web 上传/预览/管理

> 基于 [cloudflare-r2-telegram-bot](https://github.com/xinycai/cloudflare-r2-telegram-bot) 项目修改而来，感谢Gemini

## 相较原版

- 更灵活的全局变量添加方式
- 缺少变量时，展示相应的网页提示
- Web 端快速预览完整图片（点击空白处即可退出预览）
- 其他一些界面上的调整

## 截图

<p align="left">
<img src="https://raw.githubusercontent.com/WangQueXL/r2-img-tg/refs/heads/main/docs/screenshot/1.png" width="30%" />
<img src="https://raw.githubusercontent.com/WangQueXL/r2-img-tg/refs/heads/main/docs/screenshot/2.png" width="30%" />
<img src="https://raw.githubusercontent.com/WangQueXL/r2-img-tg/refs/heads/main/docs/screenshot/3.png" width="30%" />
</p>

<p align="left">
<img src="https://raw.githubusercontent.com/WangQueXL/r2-img-tg/refs/heads/main/docs/screenshot/4.jpeg" width="10%" />
<img src="https://raw.githubusercontent.com/WangQueXL/r2-img-tg/refs/heads/main/docs/screenshot/5.png" width="33%" />
<img src="https://raw.githubusercontent.com/WangQueXL/r2-img-tg/refs/heads/main/docs/screenshot/6.png" width="33%" />
</p>

## Worker 部署教程

### 0.准备工作
  - 在开始之前你需要一个域名，一个 Telegram Bot 以及 ChatID
  - 不知道如何获取可以点击[此处](https://blog.xiny.cc/archives/mTaUz0TW)或[仓库备份](https://github.com/WangQueXL/r2-img-tg/blob/main/docs/tutorial/bot.jpeg)

### 1.创建 KV 与 R2 存储桶：
  - 在 Cloudflare 侧边栏中找到 存储与数据库
  - 根据你的喜好创建一个任意名称的 KV
  - 在 Cloudflare 侧边栏中找到 R2 对象存储
  - 根据你的喜好创建一个任意名称的 R2
  - 进入刚刚创建的存储桶
  - 点击 设置 找到 自定义域 为你的存储桶添加 自定义域

### 2-1.直接上传代码部署 
 - 在 Cloudflare 侧边栏中找到 计算（Workers）
 - 创建 Worker 并选择 从 Hello World! 开始
 - 填写一个你喜欢的名字部署
 - 点击右上角的 编辑代码
 - 将[_worker.js](https://github.com/WangQueXL/r2-img-tg/blob/main/_worker.js)里面的内容粘贴进去并部署
 - 返回项目页，点击 绑定 再点击 添加绑定
 - 选择 R2 存储桶
 - 变量名称 随意填 R2 存储桶 选择上面创建的存储桶
 - 再点击 添加绑定
 - 选择 KV 命名空间
 - 变量名称填 `INDEXES_KV` KV 命名空间 选择上面创建的 KV
 - 点击 设置 找到 变量和机密 开始添加环境变量

| 变量名 | 备注 |
|--------|--------|
|SECRET_KEY|Web访问页的密码|
|TELEGRAM_BOT_TOKEN|Telegram Bot Token|
|CHAT_ID|允许使用机器人的用户 ID（多个用户请以`,`分隔）|
|BUCKET_NAME|填入 R2 存储桶 变量名称|
|BASE_URL|填入 R2 存储桶 的自定义域|

 - 最后在 域和路由 为你的项目添加自定义域名
 - 一切就大功告成了
 
### 2-2.导入存储库部署 
 - Fork 本项目
 - 在 Cloudflare 侧边栏中找到 计算（Workers）
 - 创建 Worker 并选择 导入存储库
 - 如果你的 Cloudflare 没有绑定 Github 这个时候需要去绑定一下，绑定完就能在 Cloudflare 看到你的仓库
 - 选择本项目，设置 项目名称
 - 点击 创建和部署
 - 选择右上角 继续处理项目
 - 点击 绑定 再点击 添加绑定
 - 选择 R2 存储桶
 - 变量名称 随意填 R2 存储桶 选择上面创建的存储桶
 - 再点击 添加绑定
 - 选择 KV 命名空间
 - 变量名称填 `INDEXES_KV` KV 命名空间 选择上面创建的 KV
 - 点击 设置 找到 变量和机密 开始添加环境变量

| 变量名 | 备注 |
|--------|--------|
|SECRET_KEY|Web访问页的密码|
|TELEGRAM_BOT_TOKEN|Telegram Bot Token|
|CHAT_ID|允许使用机器人的用户 ID（多个用户请以`,`分隔）|
|BUCKET_NAME|填入 R2 存储桶 变量名称|
|BASE_URL|填入 R2 存储桶 的自定义域|

 - 最后在 域和路由 为你的项目添加自定义域名
 - 一切就大功告成了
