const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL. Set it in frontend/.env or frontend/.env.local.");
}

function formatApiDetail(detail, fallback) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length) {
    const firstItem = detail[0];
    if (typeof firstItem === "string" && firstItem.trim()) {
      return firstItem;
    }

    if (firstItem && typeof firstItem.msg === "string" && firstItem.msg.trim()) {
      return firstItem.msg;
    }
  }

  return fallback;
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
