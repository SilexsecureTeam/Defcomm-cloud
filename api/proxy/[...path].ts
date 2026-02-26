import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const REAL_BACKEND_URL = process.env.API_URL!;
  const BACKEND_SECRET = process.env.BACKEND_SECRET_KEY!;

  const path = (req.query.path as string[]).join("/"); // e.g., requestOtpSms

  try {
    const response = await axios({
      method: req.method,
      url: `${REAL_BACKEND_URL}/${path}`,
      data: req.body,
      headers: {
        "X-Internal-Secret": BACKEND_SECRET,
        Authorization: req.headers.authorization || "",
        "Content-Type": req.headers["content-type"] || "application/json",
      },
    });

    return res.status(response.status).json(response.data);
  } catch (err: any) {
    return res
      .status(err.response?.status || 500)
      .json(err.response?.data || "Proxy Error");
  }
}
