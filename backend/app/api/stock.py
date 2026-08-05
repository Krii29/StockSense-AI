from fastapi import APIRouter

from app.services.stock_services import get_stock_data

router = APIRouter()


@router.get("/stocks/{symbol}")
def get_stock(symbol: str):

    return get_stock_data(symbol)