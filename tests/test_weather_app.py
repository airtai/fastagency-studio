import datetime

from fastapi.testclient import TestClient

from fastagency.weather_app import weather_app

client = TestClient(weather_app)


def test_weather_route() -> None:
    response = client.get("/?city=Chennai")
    assert response.status_code == 200
    resp_json = response.json()
    assert resp_json.get("city") == "Chennai"
    assert resp_json.get("temperature") > 0

    assert len(resp_json.get("daily_forecasts")) > 0
    daily_forecasts = resp_json.get("daily_forecasts")
    assert isinstance(daily_forecasts, list)

    first_daily_forecast = daily_forecasts[0]
    assert (
        first_daily_forecast.get("forecast_date") == datetime.date.today().isoformat()
    )
    assert first_daily_forecast.get("temperature") > 0
    assert len(first_daily_forecast.get("hourly_forecasts")) > 0

    first_hourly_forecast = first_daily_forecast.get("hourly_forecasts")[0]
    assert isinstance(first_hourly_forecast, dict)
    assert first_hourly_forecast.get("forecast_time") is not None
    assert first_hourly_forecast.get("temperature") > 0  # type: ignore
    assert first_hourly_forecast.get("description") is not None
