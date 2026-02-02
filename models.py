from pydantic import BaseModel

# ---------- Product Schemas ----------

class Product(BaseModel):
    id: int
    name: str
    price: float
    in_stock: bool

    class Config:
        orm_mode = True


# ---------- User Schemas ----------

class UserCreate(BaseModel):
    username: str
    password: str   # plain password from frontend


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True


# ---------- Checkout Schemas ----------
class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = 1

class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]

class CheckoutResponseItem(BaseModel):
    product_id: int
    name: str
    unit_price: float
    quantity: int
    line_total: float

class CheckoutResponse(BaseModel):
    order_id: str
    items: list[CheckoutResponseItem]
    total: float
    message: str
