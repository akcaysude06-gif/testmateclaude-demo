"""
Database configuration and models
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config.settings import settings

# Create engine
engine = create_engine(
	settings.DATABASE_URL,
	connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# User Model
class User(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True, index=True)
	github_id = Column(String, unique=True, index=True, nullable=False)
	username = Column(String, nullable=False)
	email = Column(String, nullable=True)
	avatar_url = Column(String, nullable=True)
	github_access_token = Column(String, nullable=False)
	created_at = Column(DateTime, default=datetime.utcnow)
	last_login = Column(DateTime, default=datetime.utcnow)
	is_active = Column(Boolean, default=True)

	# Progress tracking
	level0_completed = Column(Boolean, default=False)
	level1_completed = Column(Boolean, default=False)

# Create all tables
def init_db():
	Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()