// حفظ/تحميل مشاريع الزبون سحابياً — يعتمد على device_id في localStorage
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const KEY = "watar.device.id";
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export type SavedProject = {
  id: string;
  name: string;
  device_id: string;
  room_url: string | null;
  design_url: string | null;
  design_name: string | null;
  snapshot_url: string | null;
  box: Record<string, unknown>;
  wall_points: { x: number; y: number }[];
  surface: string | null;
  width_m: number | null;
  height_m: number | null;
  is_public: boolean;
  created_at: string;
};

export type SaveInput = Omit<SavedProject, "id" | "device_id" | "created_at">;

// نمرّر device_id عبر ترويسة كي تستفيد منها RLS
function withHeader() {
  // @ts-expect-error — العميل يقبل headers ديناميكياً
  supabase.rest.headers = { ...(supabase as any).rest?.headers, "x-device-id": getDeviceId() };
}

export async function saveProject(input: SaveInput): Promise<SavedProject | null> {
  withHeader();
  const { data, error } = await supabase
    .from("saved_projects")
    .insert({ ...input, device_id: getDeviceId() })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return data as SavedProject;
}

export async function listMyProjects(): Promise<SavedProject[]> {
  withHeader();
  const { data } = await supabase
    .from("saved_projects")
    .select("*")
    .eq("device_id", getDeviceId())
    .order("created_at", { ascending: false })
    .limit(60);
  return (data ?? []) as SavedProject[];
}

export async function listPublicProjects(): Promise<SavedProject[]> {
  const { data } = await supabase
    .from("saved_projects")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as SavedProject[];
}

export async function deleteProject(id: string) {
  withHeader();
  await supabase.from("saved_projects").delete().eq("id", id);
}

export async function togglePublic(id: string, is_public: boolean) {
  withHeader();
  await supabase.from("saved_projects").update({ is_public }).eq("id", id);
}

export function useMyProjects() {
  const [rows, setRows] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    setLoading(true);
    setRows(await listMyProjects());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);
  return { rows, loading, refresh };
}
