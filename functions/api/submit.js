// Cloudflare Pages Function — 接收落地页表单 POST,写入 KV。
// 路由自动映射为  /api/submit
// 需要在 Pages 设置里绑定一个 KV namespace,变量名: SUBMISSIONS

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return new Response("Bad request", { status: 400 });
  }

  // 简单蜜罐反垃圾:如果隐藏字段 _gotcha 被填了,当作机器人,假装成功
  if (form.get("_gotcha")) {
    return Response.redirect(new URL("/thanks.html", request.url).toString(), 302);
  }

  const email = (form.get("email") || "").toString().trim();
  if (!email || !email.includes("@")) {
    return new Response("Invalid email", { status: 400 });
  }

  const record = {
    email,
    would_pay: (form.get("would_pay") || "").toString(),
    what_would_make_me_switch: (form.get("what_would_make_me_switch") || "").toString(),
    level: (form.get("level") || "").toString(),
    ts: new Date().toISOString(),
    country: request.headers.get("cf-ipcountry") || "",
    referer: request.headers.get("referer") || "",
  };

  const key = `sub:${record.ts}:${crypto.randomUUID()}`;
  await env.SUBMISSIONS.put(key, JSON.stringify(record));

  // 普通表单提交:重定向到感谢页
  return Response.redirect(new URL("/thanks.html", request.url).toString(), 302);
}
