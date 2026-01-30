from pydantic import BaseModel

# ---------- Product Schemas ----------

class Product(BaseModel):
    id: int
    name: str
    price: float
    in_stock: bool

    class Config:
        from_attributes = True


# ---------- User Schemas ----------

class UserCreate(BaseModel):
    username: str
    password: str   # 🔥 plain password from frontend


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
