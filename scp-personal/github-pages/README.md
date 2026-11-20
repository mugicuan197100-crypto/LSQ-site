# 部署到 GitHub Pages

这个文件夹就是一个可以直接发布的静态网站：

| 文件 | 作用 |
| --- | --- |
| `index.html` | 站点本体。单文件，无外部依赖，样式/脚本/图标全部内嵌 |
| `content.json` | 站点发布内容：标题、副标题、所有页面、标签、评分、修订记录 |
| `.nojekyll` | 告诉 GitHub Pages 不要用 Jekyll 处理，避免下划线文件被忽略 |

## 一次性部署

1. 在 GitHub 新建一个仓库（免费账号需要是 **public**），例如 `scp-site`。
2. 把本文件夹里的**所有文件**上传到仓库根目录（网页上 Add file → Upload files，或本地 `git push`）。
3. 打开仓库的 **Settings → Pages**。
4. **Build and deployment → Source** 选 `Deploy from a branch`，**Branch** 选 `main`，目录选 `/ (root)`，点 Save。
5. 等 1–2 分钟，访问：

   ```
   https://<你的用户名>.github.io/<仓库名>/
   ```

   例如 `https://alice.github.io/scp-site/`。

站内所有页面链接都是 `#/页面地址` 形式，所以放在仓库子路径下也能正常工作。

## 以后怎么更新内容

**方式 A：站内编辑后发布（推荐）**

1. 打开线上站点，点右下角 ✎ 或页面底部「编辑」，改完后保存。
2. 工具菜单 → **导出备份**，得到一个 `scp-personal-backup-YYYY-MM-DD.json`。
3. 把它**重命名为 `content.json`**，上传覆盖仓库里的同名文件（GitHub 网页上 Add file → Upload files 即可）。
4. 新访客打开站点时会自动载入新内容；已经在浏览器里看过本站的访客，点 **工具 → 从线上内容刷新** 即可同步。

**方式 B：直接改 content.json**

适合小改动。在 GitHub 里点开 `content.json` → 铅笔图标编辑 → 提交。最小结构如下（缺省字段会自动补默认值）：

```json
{
  "app": "scp-personal-wiki",
  "version": 1,
  "site": {
    "title": "SCP基金会",
    "subtitle": "控制，收容，保护",
    "home": "main"
  },
  "pages": [
    {
      "slug": "scp-cn-7421",
      "title": "SCP-CN-7421 — 修订者",
      "tags": ["scp", "euclid"],
      "content": "<p>正文 HTML</p>",
      "rating": 37
    }
  ]
}
```

- `slug` 是页面地址，对应站内的 `#/scp-cn-7421`
- `content` 必须是 HTML 字符串（不是 Markdown）
- `home` 要指向某个页面的 `slug`；不建议把 `app` 改掉

## 重要说明

- 这是**纯静态站点**：编辑器里的保存只写入访问者自己的浏览器（localStorage），不会同步给其他人，也没有后台服务器。
- 因此要让所有人看到你的内容，必须更新仓库里的 `content.json`（或用方式 A 重新发布）。
- 每位访客第一次打开时会用 `content.json` 初始化；之后该浏览器以自己的本地副本为准（他们也可以自己编辑着玩，不影响别人）。
- 直接双击本地 `index.html` 时浏览器不允许读取 `content.json`，站点会使用文件里内置的默认内容；`content.json` 只在 http(s) 环境下生效。
- 自定义域名：Settings → Pages → Custom domain，按提示加 CNAME 记录。
- 文件大小限制：单个文件 < 100 MB，整个站点 < 1 GB，正常使用远远够用。

## 本地预览（可选）

在解压后的文件夹里执行：

```bash
python -m http.server 8000
```

然后打开 <http://localhost:8000/>。这样可以验证 `content.json` 是否被正确读取。
