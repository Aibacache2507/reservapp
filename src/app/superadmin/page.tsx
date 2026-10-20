import { createClient } from "@/lib/supabase/server";
import { SuperadminView } from "./superadmin-view";

export default async function SuperadminPage() {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  return <SuperadminView businesses={businesses || []} />;
}
