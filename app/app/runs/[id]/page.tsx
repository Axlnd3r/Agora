import { redirect } from "next/navigation";

export default async function RunPage() {
  redirect("/app/runs/new");
}
