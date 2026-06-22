import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("codementor.database")

class DatabaseHelper:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None

    def connect(self):
        logger.info("Connecting to MongoDB...")
        if "mongodb+srv://" in settings.MONGODB_URI:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
        else:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
        
        # Parse database name from URI
        db_name = "codementor"
        try:
            # Simple check for URI path segment
            # e.g. mongodb://localhost:27017/dbname or mongodb+srv://.../dbname?options
            path_part = settings.MONGODB_URI.split("/")[-1]
            db_name_candidate = path_part.split("?")[0]
            if db_name_candidate:
                db_name = db_name_candidate
        except Exception:
            pass

        self.db = self.client[db_name]
        logger.info(f"Successfully connected to MongoDB database: {db_name}")

    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

db_helper = DatabaseHelper()

def get_db():
    return db_helper.db

def get_collection(name: str):
    return db_helper.db[name]
