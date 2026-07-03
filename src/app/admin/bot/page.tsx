import { redirect } from "next/navigation";

export default function BotPage() {
  redirect("/admin/parametres?tab=bot");
}
