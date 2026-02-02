from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from database_models import Base, Product as ProductDB
# Changed import: alias Pydantic schema to avoid name collision with DB model
from models import (
    Product as ProductSchema,
    CheckoutRequest,
    CheckoutResponse,
    CheckoutResponseItem,
)
import uuid

app = FastAPI()

# ------------------- CORS -------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Database -------------------
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------- Startup: Initialize DB -------------------
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Initialize products if DB is empty
        if db.query(ProductDB).count() == 0:
            initial = [
                ProductDB(name="Example Widget", price=9.99, in_stock=True),
                ProductDB(name="Gizmo", price=19.99, in_stock=True),
                ProductDB(name="Obsolete Thing", price=2.5, in_stock=False),
            ]
            db.add_all(initial)
        db.commit()
    finally:
        db.close()

# ------------------- Health Check -------------------
@app.get("/")
def greet():
    return {"message": "Welcome to FastAPI Products Project"}

@app.get("/name")
def name():
    return {"name": "Akash"}

# ------------------- Products (no auth) -------------------
@app.get("/products/", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    return db.query(ProductDB).all()

@app.get("/products/{product_id}", response_model=ProductSchema)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products/", response_model=ProductSchema)
def add_product(product: ProductSchema, db: Session = Depends(get_db)):
    db_obj = ProductDB(**product.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted."}

@app.put("/products/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, updated_product: ProductSchema, db: Session = Depends(get_db)):
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in updated_product.dict(exclude={"id"}).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

# New: Checkout endpoint
@app.post("/checkout", response_model=CheckoutResponse)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    items_out = []
    total = 0.0
    for it in payload.items:
        product = db.query(ProductDB).filter(ProductDB.id == it.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {it.product_id} not found")
        if not product.in_stock:
            raise HTTPException(status_code=400, detail=f"Product {it.product_id} is not in stock")
        line_total = float(product.price) * int(it.quantity)
        items_out.append(
            CheckoutResponseItem(
                product_id=product.id,
                name=product.name,
                unit_price=float(product.price),
                quantity=int(it.quantity),
                line_total=line_total,
            )
        )
        total += line_total

    order_id = str(uuid.uuid4())
    return CheckoutResponse(
        order_id=order_id,
        items=items_out,
        total=round(total, 2),
        message="Checkout successful",
    )

# ------------------- OPTIONS handler -------------------
@app.options("/{path:path}")
def options_handler():
    return {}
