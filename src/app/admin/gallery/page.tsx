import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GalleryView } from "./gallery-view";

export default async function AdminGalleryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member }: any = await supabase
    .from("business_members")
    .select("role, business_id, businesses(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member || !member.businesses) {
    redirect("/admin/onboarding");
  }

  const business = member.businesses as any;

  // 1. Consultar fotos de la galería
  const { data: images } = await supabase
    .from("gallery_images")
    .select(`
      id,
      business_id,
      image_url,
      category,
      caption,
      display_order,
      created_at,
      professionals (
        name
      )
    `)
    .eq("business_id", business.id)
    .order("display_order", { ascending: true });

  // 2. Consultar profesionales para asociar trabajos
  const { data: professionals } = await supabase
    .from("professionals")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <GalleryView
      business={business}
      images={(images as any) || []}
      professionals={professionals || []}
    />
  );
}
