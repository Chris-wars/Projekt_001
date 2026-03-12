
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Standard-SQLite-Konfiguration für lokale Entwicklung
DATABASE_URL = "sqlite:///./test.db"
engine = None

try:
    # Überschreiben mit PostgreSQL, wenn Umgebungsvariablen für die Produktion gesetzt sind
    DB_HOST = os.getenv("DB_HOST")
    if DB_HOST:
        DB_USER = os.getenv("DB_USER", "indihubadmin")
        DB_PASSWORD = os.getenv("DB_PASSWORD", "Ts#Project_2024!")
        DB_NAME = os.getenv("DB_NAME", "indihub_db")
        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
        logger.info(f"Connecting to PostgreSQL: {DATABASE_URL}")
        engine = create_engine(DATABASE_URL)
    else:
        logger.info(f"Using SQLite: {DATABASE_URL}")
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    logger.error(f"Fehler beim Erstellen des DB-Engines: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
