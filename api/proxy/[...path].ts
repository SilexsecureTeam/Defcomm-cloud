import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const REAL_BACKEND_URL = process.env.API_URL!;
  const BACKEND_SECRET = process.env.BACKEND_SECRET_KEY!;

  const path = req.url?.replace(/^\/api\/proxy\/?/, "");
  if (!path) return res.status(400).json({ error: "Missing path parameter" });

  // Forward query params if they exist
  const queryString = req.url?.split("?")[1];
  const targetUrl = queryString
    ? `${REAL_BACKEND_URL}/${path}?${queryString}`
    : `${REAL_BACKEND_URL}/${path}`;

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        "X-Internal-Secret": BACKEND_SECRET,
        Authorization: req.headers.authorization || "",
        "Content-Type": req.headers["content-type"] || "application/json",
      },
    });

    return res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error("Proxy error:", err.message);
    return res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Proxy Error" });
  }
}
