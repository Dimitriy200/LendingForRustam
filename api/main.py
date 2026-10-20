import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from aiogram import Bot


logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.environ["BOT_TOKEN"]
CHAT_ID = os.environ["CHAT_ID"]

bot = Bot(token=BOT_TOKEN)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await bot.session.close()   # аккуратно закрываем сессию при остановке


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # в проде замените на ваш домен
    allow_methods=["POST"],
    allow_headers=["*"],
)


class Lead(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=10, max_length=40)
    message: str = ""

@app.post("/api/lead")
async def lead(data: Lead):
    text = (
        "🔔 Новая заявка с лендинга"
        f"%0A%0AИмя: {data.name}"
        f"%0AТелефон: {data.phone}"
        f"%0AКомментарий: {data.message or '—'}"
    )
    try:
        await bot.send_message(CHAT_ID, text)
    except Exception:
        logging.exception("Failed to send lead")
        raise HTTPException(status_code=500, detail="send failed")
    return {"ok": True}