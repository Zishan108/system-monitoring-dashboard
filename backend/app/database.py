"""
database.py
===========

Sets up the SQLAlchemy engine and session factory. This is the ONE place
in the app that knows the actual database URL/driver — everything else
just imports `SessionLocal` or `get_db` from here.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Check your backend/.env file.")

# WHY pool_pre_ping=True:
# Neon (and Render, if you deploy the backend there too) can silently drop
# idle connections when compute suspends. Without pre_ping, SQLAlchemy would
# try to reuse a dead connection and throw a confusing error mid-query.
# pre_ping does a lightweight "is this connection still alive?" check
# before every checkout from the pool, and transparently reconnects if not.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class every ORM model will inherit from.
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session and guarantees it's
    closed afterward, even if an error occurs mid-request. The `yield`
    pattern here is what makes this a "dependency with cleanup" — code
    after `yield` runs no matter what happens in between.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()