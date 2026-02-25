import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Use PRIVATE env variables from Vercel Dashboard (no VITE_ prefix)
  const REAL_BACKEND_URL = process.env.API_URL;
  const BACKEND_SECRET = process.env.BACKEND_SECRET_KEY;

  try {
    // Forward the request from Vercel's server to your Backend
    const response = await axios({
      method: req.method,
      // Combines your hidden URL with the specific endpoint path
      url: `${REAL_BACKEND_URL}${req.url?.replace("/api/proxy", "")}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: new URL(REAL_BACKEND_URL!).host,
        "X-Internal-Secret": BACKEND_SECRET, // Hidden from the Network Tab!
      },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || "Proxy Error");
  }
}
