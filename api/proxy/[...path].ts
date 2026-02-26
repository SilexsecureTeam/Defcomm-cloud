import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios, { AxiosRequestHeaders } from "axios";

/**
 * Flexible proxy for Axios requests
 * - Works with any multi-segment path: /requestOtpSms, /user/profile, /foo/bar/baz
 * - Automatically forwards query parameters
 * - Supports GET, POST, PUT, DELETE, PATCH
 * - Forwards headers and Authorization
 * - Hides REAL_BACKEND_URL from client
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const REAL_BACKEND_URL = process.env.API_URL!;
  const BACKEND_SECRET = process.env.BACKEND_SECRET_KEY!;

  // Extract the path after /api/proxy/
  const urlPath = req.url?.replace(/^\/api\/proxy\/?/, "");
  if (!urlPath)
    return res.status(400).json({ error: "Missing path parameter" });

  // Preserve query string if present
  const queryString = req.url?.split("?")[1];
  const targetUrl = queryString
    ? `${REAL_BACKEND_URL}/${urlPath}?${queryString}`
    : `${REAL_BACKEND_URL}/${urlPath}`;

  // Forward headers, but override host and add internal secret
  const headers: any = {
    ...req.headers,
    host: new URL(REAL_BACKEND_URL).host,
    "X-Internal-Secret": BACKEND_SECRET,
  };

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers,
      timeout: 60000,
      withCredentials: false,
    });

    // Return backend response to client
    return res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error("Proxy error:", err.message, err.response?.data);
    return res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Proxy Error" });
  }
}
