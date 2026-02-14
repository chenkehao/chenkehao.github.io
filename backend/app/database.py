"""
Database connection and session management
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Create async engine with appropriate settings based on database type
engine_kwargs = {
    "echo": settings.debug,
}

# PostgreSQL supports connection pooling, SQLite doesn't
if "postgresql" in settings.database_url:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_async_engine(settings.database_url, **engine_kwargs)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    import os
    # 打印数据库状态，便于排查问题
    db_url = settings.database_url
    if "sqlite" in db_url:
        db_path = db_url.split("///")[-1]
        if os.path.exists(db_path):
            size_mb = os.path.getsize(db_path) / (1024 * 1024)
            print(f"📂 Database: {db_path} ({size_mb:.1f} MB)")
        else:
            print(f"📂 Database: {db_path} (文件不存在，将创建新数据库)")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()
