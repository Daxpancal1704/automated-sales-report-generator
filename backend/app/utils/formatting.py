from typing import Dict

CURRENCY_SYMBOLS: Dict[str, str] = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "CAD": "C$",
    "AUD": "A$",
}

def get_currency_symbol(currency_code: str) -> str:
    """Return the display symbol for a given 3-letter currency code, defaulting to INR."""
    return CURRENCY_SYMBOLS.get(currency_code.upper(), currency_code)

def format_currency_amount(amount: float, currency_code: str = "INR", decimal_places: int = 2) -> str:
    """Format a numeric value with currency symbol and thousands separator."""
    symbol = get_currency_symbol(currency_code)
    formatted_num = f"{amount:,.{decimal_places}f}"
    return f"{symbol} {formatted_num}"

def format_percentage(value: float, decimal_places: int = 1) -> str:
    """Format a percentage value."""
    return f"{value:.{decimal_places}f}%"
