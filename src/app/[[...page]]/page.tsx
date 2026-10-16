import { notFound } from "next/navigation";
import Workspace from "@/components/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ page?: string[] }>;
}) {
  const path = (await params).page || [];
  if (
    path.length > 1 ||
    (path.length &&
      !["products", "studio", "drafts", "analytics", "settings"].includes(
        path[0],
      ))
  )
    notFound();
  return <Workspace section={path[0] || "overview"} />;
}
