import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from aiogram import Bot
from dotenv import load_dotenv
from pathlib import Path
from aiogram.enums import ParseMode
from aiogram.utils.formatting import Bold, as_key_value, as_marked_section, as_marked_list



ENV_PATH = Path(__file__).parent / ".env"
LOG_PATH = Path(__file__).parent.parent / "logs.log"

load_dotenv()
logging.basicConfig(
    level = logging.INFO,
    filename =  LOG_PATH,
    filemode = "w",
    format = "%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s"
)


BOT_TOKEN = os.environ.get("BOT_TOKEN")
CHAT_ID = os.environ.get("CHAT_ID")
logging.info(f"ENV_PATH = {ENV_PATH}")
logging.info(f"BOT_TOKEN = {BOT_TOKEN}")
logging.info(f"CHAT_ID = {CHAT_ID}")

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
    content = as_marked_section(
        Bold("НОВАЯ ЗАЯВКА С ЛЕНДИНГА\n"),
        as_key_value("ИМЯ", data.name),
        as_key_value("ТЕЛЕФОН", data.phone),
        as_key_value("КОММЕНТАРИЙ", data.message or '—'),
        marker="" # Убираем маркеры списков (точки)
    )
    try:
        await bot.send_message(
            chat_id=CHAT_ID,
            text=content.as_html(),
            parse_mode=ParseMode.HTML
        )
        # await bot.send_message(CHAT_ID, text)
    except Exception:
        logging.exception("Failed to send lead")
        raise HTTPException(status_code=500, detail="send failed")
    return {"ok": True}