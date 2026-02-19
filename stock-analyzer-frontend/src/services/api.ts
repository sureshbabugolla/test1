const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sector: string;
  industry: string;
}

export interface StockDetail extends Stock {
  volume: number;
  avgVolume: number;
  high52Week: number;
  low52Week: number;
  pe: number;
  forwardPE: number;
  eps: number;
  dividend: number;
  beta: number;
  description: string;
  targetMeanPrice: number;
  recommendationKey: string;
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Prediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  predictedGrowth: number;
  confidence: string;
  signals: string[];
  momentum1m: number;
  momentum3m: number;
  momentum6m: number;
  volatility: number;
  sma20: number;
  sma50: number;
}

export interface Recommendation {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  predictedPrice: number;
  predictedGrowth: number;
  confidence: string;
  rating: string;
  ratingScore: number;
  signals: string[];
  momentum1m: number;
  momentum3m: number;
  volatility: number;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function getStocks(): Promise<Stock[]> {
  const data = await fetchApi<{ stocks: Stock[] }>("/api/stocks");
  return data.stocks;
}

export async function getStockDetail(symbol: string): Promise<StockDetail> {
  return fetchApi<StockDetail>(`/api/stocks/${symbol}`);
}

export async function getStockHistory(
  symbol: string,
  period: string = "1y"
): Promise<HistoryPoint[]> {
  const data = await fetchApi<{ symbol: string; history: HistoryPoint[] }>(
    `/api/stocks/${symbol}/history?period=${period}`
  );
  return data.history;
}

export async function getPredictions(): Promise<Prediction[]> {
  const data = await fetchApi<{ predictions: Prediction[] }>("/api/predictions");
  return data.predictions;
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const data = await fetchApi<{ recommendations: Recommendation[] }>(
    "/api/recommendations"
  );
  return data.recommendations;
}
