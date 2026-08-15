"""
Run once to create tables in your Neon database based on the models
defined in app/models.py. Safe to re-run — create_all() only creates
tables that don't already exist, it won't wipe or duplicate anything.
"""

from dotenv import load_dotenv
load_dotenv()  # this script runs standalone, outside main.py, so it needs
                # its own call to load .env before database.py reads it

from app.database import engine, Base
from app import models  # noqa: F401 — import so Base knows about the model

Base.metadata.create_all(bind=engine)
print("Tables created successfully.")