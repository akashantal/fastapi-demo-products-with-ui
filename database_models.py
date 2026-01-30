
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column as column, Integer, String, Float, Boolean
Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    id = column(Integer, primary_key=True, index=True)
    name = column(String, index=True)
    price = column(Float)
    in_stock = column(Boolean)


class User(Base):
    __tablename__ = "users"

    id = column(Integer, primary_key=True, index=True)
    username = column(String, unique=True, index=True, nullable=False)
    hashed_password = column(String, nullable=False)