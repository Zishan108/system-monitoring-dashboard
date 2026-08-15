"""
models.py
=========

SQLAlchemy ORM models — Python classes that map to database tables.
Phase 7 only needs MetricSnapshot; the User table comes in Phase 8 (auth).
"""

from sqlalchemy import Column, Integer, Float, BigInteger, DateTime
from sqlalchemy.sql import func
from app.database import Base


class MetricSnapshot(Base):
    """
    One row = one periodic snapshot of system metrics, taken at a lower
    frequency (every 10s) than the live WebSocket stream (every 1s).

    WHY WE DON'T STORE EVERY 1-SECOND READING:
    At 1 reading/second, that's 86,400 rows/day, ~2.6M rows/month, for a
    SINGLE machine. None of that resolution is actually useful for
    "what did usage look like yesterday" — you're going to zoom out and
    look at trends, not individual seconds from three days ago. Storing
    every reading would bloat the database for data nobody queries at
    that granularity, and burn through Neon's free-tier storage fast for
    zero practical benefit. Sampling at 10s (or even 60s for anything
    older than a day, if you wanted to get fancier later) keeps the table
    small while still being genuinely useful for historical trend charts.
    """

    __tablename__ = "metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    cpu_usage = Column(Float, nullable=False)
    memory_usage = Column(Float, nullable=False)
    disk_usage = Column(Float, nullable=False)
    network_bytes_sent = Column(BigInteger, nullable=False)
    network_bytes_received = Column(BigInteger, nullable=False)