import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const REAL_BACKEND_URL = process.env.API_URL!;
  const BACKEND_SECRET = process.env.BACKEND_SECRET_KEY!;

  const path = req.query.path as string;

  if (!path) return res.status(400).json({ error: "Missing path parameter" });

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
    return res.status(err.response?.status || 500).json(
      err.response?.data || {
        error: err.message || "Proxy Error",
      },
    );
  }
}
