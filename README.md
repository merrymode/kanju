# Kanju 落地页 — 部署到 Cloudflare Pages

数据**不存第三方**,全在你自己的 Cloudflare:表单 → Pages Function → KV。
你随时打开 `/api/export?token=...` 就能把所有提交**导成一个 JSON**。

## 目录结构
```
kanju-site/
├── index.html              # 落地页(表单 POST 到 /api/submit)
├── thanks.html             # 提交后的感谢页
└── functions/api/
    ├── submit.js           # 接收表单,写入 KV
    └── export.js           # 导出全部提交为 JSON(带付费意愿统计)
```

## 部署步骤(约 10 分钟)

1. **建 KV namespace**
   Cloudflare 控制台 → Storage & Databases → KV → Create → 命名随意(如 `kanju-subs`)。

2. **建 Pages 项目**
   Workers & Pages → Create → Pages → 上传 `kanju-site` 文件夹(或连 GitHub 仓库)。
   构建命令留空,输出目录就是根目录(纯静态 + functions)。

3. **绑定 KV 和密钥**(Pages 项目 → Settings）
   - Functions → KV namespace bindings:
     变量名 **`SUBMISSIONS`** → 选你刚建的 namespace。**变量名必须是 SUBMISSIONS**(代码里用的就是它)。
   - Environment variables：加一个 **`EXPORT_TOKEN`** = 一串你自己定的长密码(用于保护导出接口)。
   - 改完环境变量后要重新部署一次才生效。

4. **绑定二级域名**
   Pages 项目 → Custom domains → 填 `kanju.913.today` → 它自动加 CNAME(913.today 已在你 Cloudflare 名下,几秒生效)。

## 怎么拿数据
浏览器打开:
```
https://kanju.913.today/api/export?token=你设的EXPORT_TOKEN
```
返回形如:
```json
{
  "count": 42,
  "willingness_to_pay": { "free_only": 28, "9_mo": 9, "14_mo": 3, "already_pay_other": 2 },
  "submissions": [ { "email": "...", "would_pay": "9_mo", "level": "HSK4", "ts": "..." }, ... ]
}
```
把页面另存为 `.json` 即可。`willingness_to_pay` 那栏就是你的**生死线指标**——盯选 9_mo/14_mo 的比例。

## 注意
- 免费额度对验证绰绰有余(KV 每天 1000 写、10 万读)。
- 已内置蜜罐反垃圾(隐藏字段 `_gotcha`)。
- 想换名字:改 index.html 的 `<title>`、`<h1>` 周边和 footer 即可。
