export type Update = {
  id: string;
  title: string;
  body: string;
  date: string;
  url?: string;
  imageUrl?: string;
  tags: string[];
};

export type DiaryEntry = {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  imageUrl?: string;
  url?: string;
  category: string;
};

export type SensorReading = {
  recordedAt: string;
  temperature: number;
  humidity: number;
  weight: number;
  activity: number;
};

export type DashboardData = {
  hiveName: string;
  status: "live" | "cached" | "demo";
  readings: SensorReading[];
  lastUpdated: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId?: string;
  emoji: string;
  stock: number;
};
