import "server-only";
import { unstable_cache } from "next/cache";
import { demoDashboardData } from "@/lib/fallback-data";
import { createServiceClient } from "@/lib/supabase/server";
import type { DashboardData, SensorReading } from "@/lib/types";

async function loadDashboard(): Promise<DashboardData> {
  const client = createServiceClient();
  if (!client) return demoDashboardData;
  const { data, error } = await client.from("sensor_readings").select("recorded_at,temperature,humidity,weight,activity,hives(name)").order("recorded_at", { ascending: false }).limit(48);
  if (error || !data?.length) return { ...demoDashboardData, status: "cached" };
  const readings: SensorReading[] = data.map((row) => ({
    recordedAt: row.recorded_at, temperature: Number(row.temperature), humidity: Number(row.humidity),
    weight: Number(row.weight), activity: Number(row.activity),
  })).reverse();
  const hive = data[0]?.hives as unknown as { name?: string } | null;
  return { hiveName: hive?.name ?? "調布キャンパス 屋上巣箱", readings, status: "live", lastUpdated: readings.at(-1)?.recordedAt ?? new Date().toISOString() };
}

export const getDashboardData = unstable_cache(loadDashboard, ["dashboard"], { revalidate: 60 });
