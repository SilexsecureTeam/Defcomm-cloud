import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const REAL_BACKEND_URL = process.env.API_URL!;
  const BACKEND_SECRET = process.env.BACKEND_SECRET_KEY!;

  // This is the proper way for [...path].ts
  const pathSegments = req.query.path;

  if (!pathSegments) {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  // Convert ["user","profile"] -> "user/profile"
  const path = Array.isArray(pathSegments)
    ? pathSegments.join("/")
    : pathSegments;

  const targetUrl = `${REAL_BACKEND_URL}/${path}`;

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        Authorization: req.headers.authorization || "",
        "Content-Type": req.headers["content-type"] || "application/json",
        "X-Api-Signature": BACKEND_SECRET,
      },
      timeout: 60000,
    });

    return res.status(response.status).json(response.data);
  } catch (err: any) {
    console.error("Proxy error:", err.response?.data || err.message);

    return res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: "Proxy Error" });
  }
}
