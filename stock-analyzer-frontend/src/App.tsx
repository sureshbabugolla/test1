import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Star,
  ArrowLeft,
  RefreshCw,
  Activity,
  DollarSign,
  Target,
  Shield,
  Loader2,
} from "lucide-react";
import type {
  Stock,
  StockDetail,
  HistoryPoint,
  Prediction,
  Recommendation,
} from "./services/api";
import {
  getStocks,
  getStockDetail,
  getStockHistory,
  getPredictions,
  getRecommendations,
} from "./services/api";

type Tab = "dashboard" | "predictions" | "recommendations" | "detail";

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function RatingBadge({ rating }: { rating: string }) {
  const colors: Record<string, string> = {
    "Strong Buy": "bg-green-600 text-white",
    Buy: "bg-green-500 text-white",
    Hold: "bg-yellow-500 text-white",
    "Weak Hold": "bg-orange-500 text-white",
    Sell: "bg-red-500 text-white",
  };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors[rating] || "bg-gray-500 text-white"}`}
    >
      {rating}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = {
    high: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${colors[confidence] || "bg-gray-100 text-gray-800"}`}
    >
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="ml-3 text-gray-500 text-lg">Loading data...</span>
    </div>
  );
}

function StockCard({
  stock,
  onClick,
}: {
  stock: Stock;
  onClick: () => void;
}) {
  const isPositive = stock.change >= 0;
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
          <p className="text-sm text-gray-500 truncate max-w-48">
            {stock.name}
          </p>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
          {stock.sector}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(stock.price)}
          </p>
          <div className={`flex items-center gap-1 mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isPositive ? "+" : ""}
              {stock.change.toFixed(2)} ({isPositive ? "+" : ""}
              {stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          MCap: {formatMarketCap(stock.marketCap)}
        </p>
      </div>
    </div>
  );
}

function StockDetailView({
  symbol,
  onBack,
}: {
  symbol: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, h] = await Promise.all([
        getStockDetail(symbol),
        getStockHistory(symbol, period),
      ]);
      setDetail(d);
      setHistory(h);
    } catch (e) {
      console.error("Error loading stock detail:", e);
    } finally {
      setLoading(false);
    }
  }, [symbol, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner />;
  if (!detail) return <p className="text-center text-gray-500 py-10">Stock not found</p>;

  const isPositive = detail.change >= 0;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {detail.symbol}
              </h2>
              <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {detail.sector}
              </span>
            </div>
            <p className="text-gray-500 text-lg">{detail.name}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">
              {formatPrice(detail.price)}
            </p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-lg font-semibold">
                {isPositive ? "+" : ""}
                {detail.change.toFixed(2)} ({isPositive ? "+" : ""}
                {detail.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Market Cap", value: formatMarketCap(detail.marketCap), icon: DollarSign },
          { label: "P/E Ratio", value: detail.pe ? detail.pe.toFixed(2) : "N/A", icon: BarChart3 },
          { label: "EPS", value: detail.eps ? `$${detail.eps.toFixed(2)}` : "N/A", icon: Target },
          { label: "Beta", value: detail.beta ? detail.beta.toFixed(2) : "N/A", icon: Activity },
          { label: "52W High", value: formatPrice(detail.high52Week), icon: TrendingUp },
          { label: "52W Low", value: formatPrice(detail.low52Week), icon: TrendingDown },
          { label: "Volume", value: detail.volume ? detail.volume.toLocaleString() : "N/A", icon: BarChart3 },
          { label: "Target Price", value: detail.targetMeanPrice ? formatPrice(detail.targetMeanPrice) : "N/A", icon: Target },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <item.icon className="w-4 h-4" />
              <span className="text-xs">{item.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Price History</h3>
          <div className="flex gap-2">
            {["1mo", "3mo", "6mo", "1y", "2y"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), "Price"]}
                labelFormatter={(label: string) =>
                  new Date(label).toLocaleDateString()
                }
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {detail.description && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {detail.description}
          </p>
        </div>
      )}
    </div>
  );
}

function PredictionsView({
  onSelectStock,
}: {
  onSelectStock: (symbol: string) => void;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictions()
      .then(setPredictions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const sortedPredictions = [...predictions].sort(
    (a, b) => b.predictedGrowth - a.predictedGrowth
  );

  const chartData = sortedPredictions.map((p) => ({
    symbol: p.symbol,
    growth: p.predictedGrowth,
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          6-Month Growth Predictions
        </h2>
        <p className="text-gray-500 mt-1">
          Based on moving averages, momentum indicators, and trend analysis
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Predicted Growth by Stock
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}%`, "Predicted Growth"]}
              />
              <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.growth >= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPredictions.map((pred) => {
          const isPositive = pred.predictedGrowth >= 0;
          return (
            <div
              key={pred.symbol}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectStock(pred.symbol)}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {pred.symbol}
                    </h3>
                    <ConfidenceBadge confidence={pred.confidence} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Current Price</p>
                      <p className="font-semibold">
                        {formatPrice(pred.currentPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Predicted Price</p>
                      <p className="font-semibold">
                        {formatPrice(pred.predictedPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Volatility</p>
                      <p className="font-semibold">{pred.volatility}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">1M Momentum</p>
                      <p
                        className={`font-semibold ${pred.momentum1m >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {pred.momentum1m >= 0 ? "+" : ""}
                        {pred.momentum1m}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-3xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : ""}
                    {pred.predictedGrowth.toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-500">6-month growth</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {pred.signals.slice(0, 3).map((signal, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-600"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationsView({
  onSelectStock,
}: {
  onSelectStock: (symbol: string) => void;
}) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then(setRecommendations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Investment Recommendations
        </h2>
        <p className="text-gray-500 mt-1">
          Stocks ranked by predicted performance over the next 6 months
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Star className="w-6 h-6" />
          <h3 className="text-xl font-bold">Top Picks</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((rec, i) => (
            <div
              key={rec.symbol}
              className="bg-white/10 backdrop-blur rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => onSelectStock(rec.symbol)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">#{i + 1}</span>
                <div>
                  <p className="font-bold text-lg">{rec.symbol}</p>
                  <p className="text-sm opacity-80">{rec.name}</p>
                </div>
              </div>
              <p className="text-2xl font-bold">
                {rec.predictedGrowth >= 0 ? "+" : ""}{rec.predictedGrowth.toFixed(1)}%
              </p>
              <p className="text-sm opacity-80">predicted growth</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Rank
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Sector
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Price
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Target
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Growth
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Confidence
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, i) => (
                <tr
                  key={rec.symbol}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectStock(rec.symbol)}
                >
                  <td className="px-6 py-4 text-sm font-bold text-gray-400">
                    {i + 1}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{rec.symbol}</p>
                    <p className="text-sm text-gray-500">{rec.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {rec.sector}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    {formatPrice(rec.currentPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    {formatPrice(rec.predictedPrice)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-bold ${rec.predictedGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {rec.predictedGrowth >= 0 ? "+" : ""}
                      {rec.predictedGrowth.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ConfidenceBadge confidence={rec.confidence} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <RatingBadge rating={rec.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Disclaimer</p>
            <p className="text-sm text-amber-700 mt-1">
              These predictions are based on technical analysis of historical
              data and should not be considered financial advice. Past
              performance does not guarantee future results. Always do your own
              research and consult a financial advisor before making investment
              decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadStocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStocks();
      setStocks(data);
    } catch (e) {
      console.error("Error loading stocks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab("detail");
  };

  const navItems = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
    { id: "predictions" as Tab, label: "Predictions", icon: TrendingUp },
    { id: "recommendations" as Tab, label: "Recommendations", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Activity className="w-7 h-7 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Stock Analyzer
              </h1>
            </div>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id ||
                    (item.id === "dashboard" && activeTab === "detail")
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>
            <button
              onClick={loadStocks}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Market Overview
              </h2>
              <p className="text-gray-500 mt-1">
                Real-time stock data from major US exchanges
              </p>
            </div>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stocks.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    onClick={() => handleSelectStock(stock.symbol)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "detail" && selectedSymbol && (
          <StockDetailView
            symbol={selectedSymbol}
            onBack={() => setActiveTab("dashboard")}
          />
        )}

        {activeTab === "predictions" && (
          <PredictionsView onSelectStock={handleSelectStock} />
        )}

        {activeTab === "recommendations" && (
          <RecommendationsView onSelectStock={handleSelectStock} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>
            Stock Analyzer - Data sourced from Yahoo Finance. Predictions are
            for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
