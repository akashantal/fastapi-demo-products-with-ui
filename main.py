from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import sessionmaker, engine
from database_models import Base, Product as ProductDB, User
from models import Product, Product as ProductSchema, UserCreate, UserLogin, UserResponse
from auth import hash_password, verify_password
import secrets

app = FastAPI()


# ------------------- CORS -------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ------------------- Database -------------------
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------- Auth Dependency -------------------
def get_current_user(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    # For now, just return token (simple auth). Could verify against DB if stored
    return token

# ------------------- Startup: Initialize DB -------------------
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Initialize products
        if db.query(ProductDB).count() == 0:
            db.add_all([
                ProductDB(id=1, name="Laptop", price=999.99, in_stock=True),
                ProductDB(id=2, name="Smartphone", price=499.99, in_stock=False),
                ProductDB(id=3, name="Tablet", price=299.99, in_stock=True),
            ])
        # Initialize default user
        if db.query(User).count() == 0:
            db.add(User(username="akash", hashed_password=hash_password("mypassword")))
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

# ------------------- Products -------------------
@app.get("/products/")
def get_products(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    return db.query(ProductDB).all()

@app.get("/products/{product_id}")
def get_product_by_id(product_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/products/")
def add_product(product: Product, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    db.add(ProductDB(**product.dict()))
    db.commit()
    return product

@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if product:
        db.delete(product)
        db.commit()
        return {"message": "Product deleted successfully."}
    return {"message": "Product not found."}

@app.put("/products/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, updated_product: ProductSchema, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    product = db.query(ProductDB).filter(ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in updated_product.dict(exclude={"id"}).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

# ------------------- User Auth -------------------
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_user = User(username=user.username, hashed_password=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user



@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful"}



# ------------------- OPTIONS handler -------------------
@app.options("/{path:path}")
def options_handler():
    return {}
