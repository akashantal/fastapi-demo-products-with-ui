from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
engine = create_engine("postgresql://postgres:akash@host.docker.internal:5432/Akash_New_DB")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
