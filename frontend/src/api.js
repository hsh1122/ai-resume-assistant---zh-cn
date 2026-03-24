const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MESSAGE_COPY = {
  "Missing VITE_API_BASE_URL. Set it in frontend/.env or frontend/.env.local.": "缺少 VITE_API_BASE_URL，请在 frontend/.env 或 frontend/.env.local 中进行配置。",
  "Failed to register": "注册失败",
  "Failed to login": "登录失败",
  "Failed to fetch profile": "加载用户信息失败",
  "Failed to optimize resume": "简历优化失败",
  "AI provider authentication failed": "AI 服务鉴权失败，请检查后端 OPENAI_API_KEY 是否有效",
  "Failed to load records": "加载记录失败",
  "Failed to load record detail": "加载记录详情失败",
  "Failed to delete record": "删除记录失败",
  "Username already exists": "用户名已存在",
  "Invalid username or password": "用户名或密码错误",
  "Record not found": "未找到记录",
  "Could not validate credentials": "无法验证登录凭证",
  "Not authenticated": "未登录",
  "Invalid authentication credentials": "登录凭证无效",
  "Field required": "必填项不能为空",
  "There was an error parsing the body": "请求内容解析失败",
  "Failed to fetch": "网络请求失败，请检查后端服务是否可用。",
};

export function localizeApiMessage(message) {
  const normalized = typeof message === "string" ? message.trim() : "";

  if (!normalized) {
    return "";
  }

  if (MESSAGE_COPY[normalized]) {
    return MESSAGE_COPY[normalized];
  }

  const minLengthMatch = normalized.match(/^String should have at least (\d+) characters?$/);
  if (minLengthMatch) {
    const minLength = Number(minLengthMatch[1]);

    if (minLength === 1) {
      return "内容不能为空";
    }
    if (minLength === 3) {
      return "用户名至少需要 3 个字符";
    }
    if (minLength === 6) {
      return "密码至少需要 6 个字符";
    }

    return `输入内容至少需要 ${minLength} 个字符`;
  }

  const maxLengthMatch = normalized.match(/^String should have at most (\d+) characters?$/);
  if (maxLengthMatch) {
    return `输入内容不能超过 ${Number(maxLengthMatch[1])} 个字符`;
  }

  if (normalized === "Load failed") {
    return "加载失败";
  }

  return normalized;
}

if (!API_BASE_URL) {
  throw new Error(localizeApiMessage("Missing VITE_API_BASE_URL. Set it in frontend/.env or frontend/.env.local."));
}

function formatApiDetail(detail, fallback) {
  if (typeof detail === "string" && detail.trim()) {
    return localizeApiMessage(detail);
  }

  if (Array.isArray(detail) && detail.length) {
    const firstItem = detail[0];
    if (typeof firstItem === "string" && firstItem.trim()) {
      return localizeApiMessage(firstItem);
    }

    if (firstItem && typeof firstItem.msg === "string" && firstItem.msg.trim()) {
      return localizeApiMessage(firstItem.msg);
    }
  }

  return localizeApiMessage(fallback);
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response, fallback) {
  try {
    const data = await response.json();
    return formatApiDetail(data.detail, fallback);
  } catch {
    return fallback;
  }
}

export async function registerUser(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to register"));
  }

  return response.json();
}

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to login"));
  }

  return response.json();
}

export async function fetchMe(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to fetch profile"));
  }

  return response.json();
}

export async function optimizeResume(payload, token) {
  const response = await fetch(`${API_BASE_URL}/api/optimize`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to optimize resume"));
  }

  return response.json();
}

export async function fetchRecords(page = 1, pageSize = 5, keyword = "", style = "", token) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    keyword,
    style,
  });

  const response = await fetch(`${API_BASE_URL}/api/records?${params.toString()}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load records"));
  }

  return response.json();
}

export async function fetchRecordById(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/records/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to load record detail"));
  }

  return response.json();
}

export async function deleteRecordById(id, token) {
  const response = await fetch(`${API_BASE_URL}/api/records/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Failed to delete record"));
  }

  return response.json();
}
