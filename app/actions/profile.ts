"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function updateStudentProfile(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "student" && !profile.is_demo) {
    throw new Error("Students only");
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedin_url") ?? "").trim();
  const gradYearRaw = String(formData.get("grad_year") ?? "").trim();
  const profilePictureUrl = String(
    formData.get("profile_picture_url") ?? ""
  ).trim();

  const gradYear = gradYearRaw ? Number(gradYearRaw) : null;
  if (gradYearRaw && Number.isNaN(gradYear)) {
    throw new Error("Graduation year must be a number");
  }

  if (bio.length > 150) {
    throw new Error("Bio must be 150 characters or less");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      bio: bio || null,
      linkedin_url: linkedinUrl || null,
      grad_year: gradYear,
      profile_picture_url: profilePictureUrl || null,
    })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadProfilePicture(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "student" && !profile.is_demo) {
    throw new Error("Students only");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file selected");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be 2 MB or smaller");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${profile.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-pictures").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ profile_picture_url: publicUrl })
    .eq("id", profile.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, url: publicUrl };
}

