import { readFile } from "node:fs/promises";
import path from "node:path";
import { getWorkflow, getWorkflows } from "@/lib/data";
import { OG_SIZE, workflowOg } from "@/lib/og";

export const alt = "n8n workflow on n8n Rank";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [w, all, logo] = await Promise.all([
    getWorkflow(slug),
    getWorkflows(),
    readFile(path.join(process.cwd(), "public", "logo.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`),
  ]);
  return workflowOg(w, w ? all.findIndex((x) => x.id === w.id) + 1 : 0, logo);
}
