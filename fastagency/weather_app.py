import datetime
import logging
from typing import List

import python_weather
from fastapi import FastAPI
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)

weather_app = FastAPI()


class HourlyForecast(BaseModel):
    time: datetime.time
    temperature: int
    description: str


class DailyForecast(BaseModel):
    date: datetime.date
    temperature: int
    hourly_forecasts: List[HourlyForecast]


class Weather(BaseModel):
    city: str
    temperature: int
    daily_forecasts: List[DailyForecast]


@weather_app.get("/")
async def get_weather(city: str) -> Weather:
    async with python_weather.Client(unit=python_weather.METRIC) as client:
        # fetch a weather forecast from a city
        weather = await client.get(city)

        daily_forecasts = []
        # get the weather forecast for a few days
        for daily in weather.daily_forecasts:
            hourly_forecasts = [
                HourlyForecast(
                    time=hourly.time,
                    temperature=hourly.temperature,
                    description=hourly.description,
                )
                for hourly in daily.hourly_forecasts
            ]
            daily_forecasts.append(
                DailyForecast(
                    date=daily.date,
                    temperature=daily.temperature,
                    hourly_forecasts=hourly_forecasts,
                )
            )

        weather_response = Weather(
            city=city,
            temperature=weather.temperature,
            daily_forecasts=daily_forecasts,
            hourly_forecasts=hourly_forecasts,
        )
    return weather_response
