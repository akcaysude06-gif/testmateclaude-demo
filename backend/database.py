"""
Database configuration and models
"""
import enum
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SAEnum
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

	# Jira OAuth 2.0
	jira_access_token = Column(String, nullable=True)
	jira_refresh_token = Column(String, nullable=True)
	jira_cloud_id = Column(String, nullable=True)

class GapTypeEnum(enum.Enum):
	not_started    = "not_started"
	untested       = "untested"
	complete       = "complete"
	non_code_task  = "non_code_task"


class JiraIntegration(Base):
	__tablename__ = "jira_integrations"

	id           = Column(Integer, primary_key=True, index=True)
	user_id      = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
	instance_url    = Column(String, nullable=False)
	email           = Column(String, nullable=False)
	api_token       = Column(String, nullable=False)
	project_key     = Column(String, nullable=True)
	space_cloud_id  = Column(String, nullable=True)
	created_at   = Column(DateTime, default=datetime.utcnow)


class JiraTask(Base):
	__tablename__ = "jira_tasks"

	id                  = Column(Integer, primary_key=True, index=True)
	jira_integration_id = Column(Integer, ForeignKey("jira_integrations.id"), nullable=False, index=True)
	task_key            = Column(String, nullable=False, index=True)
	summary             = Column(String, nullable=False)
	status              = Column(String, nullable=True)
	acceptance_criteria = Column(Text, nullable=True)
	updated_at          = Column(DateTime, default=datetime.utcnow)


class ImplementationGap(Base):
	__tablename__ = "implementation_gaps"

	id              = Column(Integer, primary_key=True, index=True)
	jira_task_id    = Column(Integer, ForeignKey("jira_tasks.id"), nullable=False, index=True)
	gap_type        = Column(SAEnum(GapTypeEnum), nullable=False)
	affected_files  = Column(Text, nullable=True)
	generated_tests = Column(Text, nullable=True)
	created_at      = Column(DateTime, default=datetime.utcnow)


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