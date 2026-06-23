// Cloudflare Pages Function — 把所有提交导出成一个 JSON 数组。
// 路由: /api/export?token=你的密钥
// 需要在 Pages 设置里加一个环境变量: EXPORT_TOKEN = 一个你自己定的长密码
// 这就是你"保存成 json"的出口:浏览器打开这个 URL,另存为 .json 即可。

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.EXPORT_TOKEN || url.searchParams.get("token") !== env.EXPORT_TOKEN) {
    return new Response("Forbidden", { status: 403 });
  }

  const out = [];
  let cursor = undefined;
  do {
    const list = await env.SUBMISSIONS.list({ cursor });
    for (const k of list.keys) {
      const v = await env.SUBMISSIONS.get(k.name);
      if (v) {
        try { out.push(JSON.parse(v)); } catch (_) {}
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  // 顺手算一下付费意愿分布,省得你手动统计
  const tally = {};
  for (const r of out) tally[r.would_pay || "(empty)"] = (tally[r.would_pay || "(empty)"] || 0) + 1;

  return new Response(JSON.stringify({ count: out.length, willingness_to_pay: tally, submissions: out }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
