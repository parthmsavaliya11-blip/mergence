import { redirect } from "next/navigation";

export default function DealsIndex() {
  redirect("/deals/announced");
}
