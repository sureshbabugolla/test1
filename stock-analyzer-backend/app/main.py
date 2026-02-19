from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.stock_service import StockService

app = FastAPI(title="Stock Analyzer API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

stock_service = StockService()

TRACKED_SYMBOLS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "META", "TSLA", "JPM", "V", "JNJ",
    "WMT", "PG", "MA", "UNH", "HD",
    "BAC", "XOM", "KO", "PFE", "DIS",
]


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/stocks")
async def get_stocks():
    try:
        stocks = stock_service.get_stock_list(TRACKED_SYMBOLS)
        return {"stocks": stocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{symbol}")
async def get_stock_detail(symbol: str):
    try:
        detail = stock_service.get_stock_detail(symbol.upper())
        if not detail:
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
        return detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{symbol}/history")
async def get_stock_history(symbol: str, period: str = "1y"):
    try:
        history = stock_service.get_stock_history(symbol.upper(), period)
        return {"symbol": symbol.upper(), "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predictions")
async def get_predictions():
    try:
        predictions = stock_service.get_predictions(TRACKED_SYMBOLS)
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommendations")
async def get_recommendations():
    try:
        recommendations = stock_service.get_recommendations(TRACKED_SYMBOLS)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
