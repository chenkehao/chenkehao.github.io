# Devnors 数据库迁移方案

## 从 SQLite 迁移到 MySQL

### 一、当前数据库结构

#### 数据表清单

| 表名 | 说明 | 预估数据量(10万用户) |
|------|------|---------------------|
| `users` | 用户表 | 10万 |
| `team_members` | 团队成员 | 1万 |
| `user_profiles` | 用户详细资料 | 10万 |
| `user_settings` | 用户设置 | 10万 |
| `todos` | 任务表 | 50万 |
| `chat_messages` | 聊天消息 | 500万 |
| `memories` | 记忆存储 | 100万 |
| `personal_certifications` | 个人认证 | 30万 |
| `enterprise_certifications` | 企业认证 | 1万 |
| `ai_engine_configs` | AI引擎配置 | 1万 |
| `api_api_keys` | API密钥 | 1万 |
| `audit_logs` | 审计日志 | 100万 |

---

### 二、迁移步骤

#### 步骤 1：购买阿里云 RDS MySQL

**推荐配置**：
- 规格：4核8G
- 存储：100GB SSD（可扩容）
- 版本：MySQL 8.0
- 架构：主从高可用
- 预估费用：￥800/月

#### 步骤 2：安装 MySQL 依赖

```bash
cd backend

# 安装 MySQL 异步驱动
pip install aiomysql pymysql

# 更新 requirements.txt
echo "aiomysql>=0.2.0" >> requirements.txt
echo "pymysql>=1.1.0" >> requirements.txt
```

#### 步骤 3：修改配置文件

**修改 `backend/.env`**：

```env
# ============ 生产环境 MySQL 配置 ============
# 异步连接（FastAPI 使用）
DATABASE_URL=mysql+aiomysql://用户名:密码@数据库地址:3306/devnors?charset=utf8mb4

# 同步连接（数据迁移使用）
SYNC_DATABASE_URL=mysql+pymysql://用户名:密码@数据库地址:3306/devnors?charset=utf8mb4

# ============ 示例（阿里云 RDS）============
# DATABASE_URL=mysql+aiomysql://devnors_admin:YourPassword123@rm-xxx.mysql.rds.aliyuncs.com:3306/devnors?charset=utf8mb4
# SYNC_DATABASE_URL=mysql+pymysql://devnors_admin:YourPassword123@rm-xxx.mysql.rds.aliyuncs.com:3306/devnors?charset=utf8mb4
```

#### 步骤 4：修改数据库连接配置

**修改 `backend/app/database.py`**：

```python
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

# MySQL/PostgreSQL 支持连接池
if "mysql" in settings.database_url or "postgresql" in settings.database_url:
    engine_kwargs.update({
        "pool_pre_ping": True,      # 自动检测断开的连接
        "pool_size": 20,            # 连接池大小
        "max_overflow": 40,         # 最大溢出连接数
        "pool_recycle": 3600,       # 连接回收时间（秒）
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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections"""
    await engine.dispose()
```

#### 步骤 5：创建数据迁移脚本

**创建 `backend/scripts/migrate_sqlite_to_mysql.py`**：

```python
"""
SQLite 到 MySQL 数据迁移脚本
"""
import sqlite3
import pymysql
from datetime import datetime

# 配置
SQLITE_PATH = "./devnors.db"
MYSQL_CONFIG = {
    "host": "rm-xxx.mysql.rds.aliyuncs.com",  # 替换为你的RDS地址
    "port": 3306,
    "user": "devnors_admin",
    "password": "YourPassword123",
    "database": "devnors",
    "charset": "utf8mb4"
}

# 需要迁移的表
TABLES = [
    "users",
    "team_members", 
    "user_profiles",
    "user_settings",
    "todos",
    "chat_messages",
    "memories",
    "personal_certifications",
    "enterprise_certifications",
    "ai_engine_configs",
    "api_api_keys",
    "audit_logs"
]


def migrate():
    """执行迁移"""
    # 连接 SQLite
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()
    
    # 连接 MySQL
    mysql_conn = pymysql.connect(**MYSQL_CONFIG)
    mysql_cursor = mysql_conn.cursor()
    
    try:
        for table in TABLES:
            print(f"\n📦 迁移表: {table}")
            
            # 获取 SQLite 数据
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                print(f"  ⚠️ 表 {table} 为空，跳过")
                continue
            
            # 获取列名
            columns = [description[0] for description in sqlite_cursor.description]
            placeholders = ", ".join(["%s"] * len(columns))
            column_names = ", ".join([f"`{col}`" for col in columns])
            
            # 插入 MySQL
            insert_sql = f"INSERT INTO `{table}` ({column_names}) VALUES ({placeholders})"
            
            count = 0
            for row in rows:
                try:
                    values = [row[col] for col in columns]
                    mysql_cursor.execute(insert_sql, values)
                    count += 1
                except Exception as e:
                    print(f"  ❌ 插入失败: {e}")
            
            mysql_conn.commit()
            print(f"  ✅ 成功迁移 {count} 条记录")
        
        print("\n🎉 数据迁移完成！")
        
    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        mysql_conn.rollback()
    finally:
        sqlite_conn.close()
        mysql_conn.close()


if __name__ == "__main__":
    migrate()
```

#### 步骤 6：执行迁移

```bash
cd backend

# 1. 先在 MySQL 创建表结构
python -c "
import asyncio
from app.database import init_db
asyncio.run(init_db())
print('✅ 表结构创建完成')
"

# 2. 迁移数据
python scripts/migrate_sqlite_to_mysql.py

# 3. 验证数据
python -c "
import pymysql
conn = pymysql.connect(host='你的RDS地址', user='用户名', password='密码', database='devnors')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM users')
print(f'用户数: {cursor.fetchone()[0]}')
cursor.execute('SELECT COUNT(*) FROM todos')
print(f'任务数: {cursor.fetchone()[0]}')
conn.close()
"
```

---

### 三、MySQL 优化配置

#### 3.1 创建索引（提升查询性能）

```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 任务表索引
CREATE INDEX idx_todos_user_status ON todos(user_id, status);
CREATE INDEX idx_todos_created ON todos(created_at);

-- 聊天消息索引
CREATE INDEX idx_chat_user_todo ON chat_messages(user_id, todo_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);

-- 记忆表索引
CREATE INDEX idx_memories_user_type ON memories(user_id, type);
CREATE INDEX idx_memories_scope ON memories(scope);

-- 认证表索引
CREATE INDEX idx_personal_cert_user ON personal_certifications(user_id);
CREATE INDEX idx_personal_cert_category ON personal_certifications(category);
```

#### 3.2 RDS 参数优化

在阿里云 RDS 控制台设置：

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `innodb_buffer_pool_size` | 内存的70% | InnoDB缓冲池 |
| `max_connections` | 500 | 最大连接数 |
| `slow_query_log` | ON | 开启慢查询日志 |
| `long_query_time` | 1 | 慢查询阈值(秒) |
| `character_set_server` | utf8mb4 | 字符集 |

---

### 四、回滚方案

如果迁移出现问题，可以快速回滚：

```bash
# 1. 修改 .env 切换回 SQLite
DATABASE_URL=sqlite+aiosqlite:///./devnors.db
SYNC_DATABASE_URL=sqlite:///./devnors.db

# 2. 重启服务
pm2 restart devnors-api
```

---

### 五、生产环境部署清单

#### 5.1 环境变量模板 (`.env.production`)

```env
# ============ 生产环境配置 ============

# Database - 阿里云 RDS MySQL
DATABASE_URL=mysql+aiomysql://devnors_prod:密码@rm-xxx.mysql.rds.aliyuncs.com:3306/devnors?charset=utf8mb4
SYNC_DATABASE_URL=mysql+pymysql://devnors_prod:密码@rm-xxx.mysql.rds.aliyuncs.com:3306/devnors?charset=utf8mb4

# Redis - 阿里云 Redis
REDIS_URL=redis://:密码@r-xxx.redis.rds.aliyuncs.com:6379/0

# JWT - 生产密钥（请生成强随机字符串）
SECRET_KEY=生成一个64位随机字符串
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Provider
AI_PROVIDER=minimax
MINIMAX_API_KEY=你的API密钥
GEMINI_API_KEY=你的API密钥

# 阿里云 OCR
ALIYUN_ACCESS_KEY_ID=你的AccessKeyId
ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret

# App Settings
DEBUG=False
APP_NAME=Devnors API
API_VERSION=v1

# CORS - 生产域名
CORS_ORIGINS=["https://devnors.com","https://www.devnors.com","https://api.devnors.com"]
```

#### 5.2 部署检查清单

- [ ] RDS MySQL 已创建并可连接
- [ ] 数据库用户权限配置正确
- [ ] 表结构已创建
- [ ] 数据已迁移并验证
- [ ] 索引已创建
- [ ] Redis 已配置（可选）
- [ ] SSL 证书已配置
- [ ] 环境变量已更新
- [ ] 备份策略已配置
- [ ] 监控告警已配置

---

### 六、常见问题

#### Q1: 迁移时报编码错误？
```sql
-- 确保 MySQL 使用 utf8mb4
ALTER DATABASE devnors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Q2: 连接超时？
检查阿里云 RDS 安全组，确保应用服务器 IP 在白名单中。

#### Q3: 性能不如预期？
- 检查慢查询日志
- 确认索引已创建
- 调整连接池大小

---

## 迁移时间估算

| 阶段 | 耗时 |
|------|------|
| 购买配置 RDS | 30分钟 |
| 修改代码配置 | 30分钟 |
| 创建表结构 | 5分钟 |
| 数据迁移(10万用户) | 10-30分钟 |
| 验证测试 | 1小时 |
| **总计** | **约3小时** |

---

*文档创建时间：2026-02-04*
*适用版本：Devnors 1.0*
