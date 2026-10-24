import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "n8n Rank – the leaderboard for n8n workflows";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, background: "#000", color: "#fff", fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={640} height={138} />
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>Outbid. Rank up. Get your workflow seen.</div>
      </div>
    ),
    { ...size },
  );
}
