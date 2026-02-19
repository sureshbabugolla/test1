import math
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf


def safe_float(value: object, default: float = 0.0) -> float:
    v = float(value)
    if math.isnan(v) or math.isinf(v):
        return default
    return v


class StockService:
    def _get_ticker_info(self, symbol: str) -> dict:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return info

    def _get_ticker_history(self, symbol: str, period: str = "1y") -> pd.DataFrame:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        return hist

    def get_stock_list(self, symbols: list[str]) -> list[dict]:
        results = []
        for symbol in symbols:
            try:
                info = self._get_ticker_info(symbol)
                current_price = info.get("currentPrice", info.get("regularMarketPrice", 0))
                previous_close = info.get("previousClose", info.get("regularMarketPreviousClose", 0))
                change = current_price - previous_close if current_price and previous_close else 0
                change_pct = (change / previous_close * 100) if previous_close else 0
                results.append({
                    "symbol": symbol,
                    "name": info.get("shortName", info.get("longName", symbol)),
                    "price": round(current_price, 2) if current_price else 0,
                    "change": round(change, 2),
                    "changePercent": round(change_pct, 2),
                    "marketCap": info.get("marketCap", 0),
                    "sector": info.get("sector", "N/A"),
                    "industry": info.get("industry", "N/A"),
                })
            except Exception:
                results.append({
                    "symbol": symbol,
                    "name": symbol,
                    "price": 0,
                    "change": 0,
                    "changePercent": 0,
                    "marketCap": 0,
                    "sector": "N/A",
                    "industry": "N/A",
                })
        return results

    def get_stock_detail(self, symbol: str) -> Optional[dict]:
        try:
            info = self._get_ticker_info(symbol)
            current_price = info.get("currentPrice", info.get("regularMarketPrice", 0))
            previous_close = info.get("previousClose", info.get("regularMarketPreviousClose", 0))
            change = current_price - previous_close if current_price and previous_close else 0
            change_pct = (change / previous_close * 100) if previous_close else 0

            return {
                "symbol": symbol,
                "name": info.get("shortName", info.get("longName", symbol)),
                "price": round(current_price, 2) if current_price else 0,
                "change": round(change, 2),
                "changePercent": round(change_pct, 2),
                "marketCap": info.get("marketCap", 0),
                "volume": info.get("volume", info.get("regularMarketVolume", 0)),
                "avgVolume": info.get("averageVolume", 0),
                "high52Week": info.get("fiftyTwoWeekHigh", 0),
                "low52Week": info.get("fiftyTwoWeekLow", 0),
                "pe": info.get("trailingPE", 0),
                "forwardPE": info.get("forwardPE", 0),
                "eps": info.get("trailingEps", 0),
                "dividend": info.get("dividendYield", 0),
                "beta": info.get("beta", 0),
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "description": info.get("longBusinessSummary", ""),
                "targetMeanPrice": info.get("targetMeanPrice", 0),
                "recommendationKey": info.get("recommendationKey", "N/A"),
            }
        except Exception:
            return None

    def get_stock_history(self, symbol: str, period: str = "1y") -> list[dict]:
        hist = self._get_ticker_history(symbol, period)
        records = []
        for date, row in hist.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return records

    def _calculate_prediction(self, symbol: str) -> dict:
        try:
            hist = self._get_ticker_history(symbol, "1y")
            if hist.empty or len(hist) < 30:
                return {
                    "symbol": symbol,
                    "currentPrice": 0,
                    "predictedPrice": 0,
                    "predictedGrowth": 0,
                    "confidence": "low",
                    "signals": [],
                }

            closes = hist["Close"].values
            current_price = float(closes[-1])

            sma_20 = float(np.mean(closes[-20:]))
            sma_50 = float(np.mean(closes[-50:])) if len(closes) >= 50 else float(np.mean(closes))
            sma_200 = float(np.mean(closes[-200:])) if len(closes) >= 200 else float(np.mean(closes))

            momentum_1m = safe_float((closes[-1] / closes[-21] - 1) * 100) if len(closes) >= 21 else 0.0
            momentum_3m = safe_float((closes[-1] / closes[-63] - 1) * 100) if len(closes) >= 63 else 0.0
            momentum_6m = safe_float((closes[-1] / closes[-126] - 1) * 100) if len(closes) >= 126 else 0.0

            returns = np.diff(closes) / closes[:-1]
            volatility = safe_float(float(np.std(returns) * np.sqrt(252) * 100))

            signals = []
            score = 0

            if current_price > sma_20:
                signals.append("Price above 20-day SMA (bullish)")
                score += 1
            else:
                signals.append("Price below 20-day SMA (bearish)")
                score -= 1

            if current_price > sma_50:
                signals.append("Price above 50-day SMA (bullish)")
                score += 1
            else:
                signals.append("Price below 50-day SMA (bearish)")
                score -= 1

            if sma_20 > sma_50:
                signals.append("20-day SMA above 50-day SMA (golden cross trend)")
                score += 2
            else:
                signals.append("20-day SMA below 50-day SMA (death cross trend)")
                score -= 1

            if momentum_1m > 0:
                signals.append(f"Positive 1-month momentum ({momentum_1m:.1f}%)")
                score += 1
            else:
                signals.append(f"Negative 1-month momentum ({momentum_1m:.1f}%)")
                score -= 1

            if momentum_3m > 0:
                signals.append(f"Positive 3-month momentum ({momentum_3m:.1f}%)")
                score += 1

            if momentum_6m > 0:
                signals.append(f"Positive 6-month momentum ({momentum_6m:.1f}%)")
                score += 1

            if volatility < 25:
                signals.append(f"Low volatility ({volatility:.1f}%) - stable")
                score += 1
            elif volatility > 40:
                signals.append(f"High volatility ({volatility:.1f}%) - risky")
                score -= 1

            trend_factor = 1 + (score * 0.02)
            historical_annual_return = (closes[-1] / closes[0] - 1) if closes[0] != 0 else 0
            projected_6m_return = historical_annual_return * 0.5 * trend_factor

            predicted_price = current_price * (1 + projected_6m_return)
            predicted_growth = projected_6m_return * 100

            if abs(score) >= 4:
                confidence = "high"
            elif abs(score) >= 2:
                confidence = "medium"
            else:
                confidence = "low"

            return {
                "symbol": symbol,
                "currentPrice": round(safe_float(current_price), 2),
                "predictedPrice": round(safe_float(predicted_price), 2),
                "predictedGrowth": round(safe_float(predicted_growth), 2),
                "confidence": confidence,
                "signals": signals,
                "momentum1m": round(safe_float(momentum_1m), 2),
                "momentum3m": round(safe_float(momentum_3m), 2),
                "momentum6m": round(safe_float(momentum_6m), 2),
                "volatility": round(safe_float(volatility), 2),
                "sma20": round(safe_float(sma_20), 2),
                "sma50": round(safe_float(sma_50), 2),
            }
        except Exception:
            return {
                "symbol": symbol,
                "currentPrice": 0,
                "predictedPrice": 0,
                "predictedGrowth": 0,
                "confidence": "low",
                "signals": ["Unable to analyze"],
            }

    def get_predictions(self, symbols: list[str]) -> list[dict]:
        predictions = []
        for symbol in symbols:
            pred = self._calculate_prediction(symbol)
            predictions.append(pred)
        return predictions

    def get_recommendations(self, symbols: list[str]) -> list[dict]:
        predictions = self.get_predictions(symbols)
        info_cache: dict[str, dict] = {}
        for symbol in symbols:
            try:
                info_cache[symbol] = self._get_ticker_info(symbol)
            except Exception:
                info_cache[symbol] = {}

        recommendations = []
        for pred in predictions:
            symbol = pred["symbol"]
            info = info_cache.get(symbol, {})

            growth = pred["predictedGrowth"]
            confidence = pred["confidence"]

            if confidence == "high" and growth > 10:
                rating = "Strong Buy"
                rating_score = 5
            elif confidence in ("high", "medium") and growth > 5:
                rating = "Buy"
                rating_score = 4
            elif growth > 0:
                rating = "Hold"
                rating_score = 3
            elif growth > -5:
                rating = "Weak Hold"
                rating_score = 2
            else:
                rating = "Sell"
                rating_score = 1

            recommendations.append({
                "symbol": symbol,
                "name": info.get("shortName", info.get("longName", symbol)),
                "sector": info.get("sector", "N/A"),
                "currentPrice": pred["currentPrice"],
                "predictedPrice": pred["predictedPrice"],
                "predictedGrowth": pred["predictedGrowth"],
                "confidence": confidence,
                "rating": rating,
                "ratingScore": rating_score,
                "signals": pred["signals"],
                "momentum1m": pred.get("momentum1m", 0),
                "momentum3m": pred.get("momentum3m", 0),
                "volatility": pred.get("volatility", 0),
            })

        recommendations.sort(key=lambda x: (x["ratingScore"], x["predictedGrowth"]), reverse=True)
        return recommendations
