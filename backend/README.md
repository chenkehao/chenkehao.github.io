# Devnors Backend API

AI 多智能体招聘平台后端服务

## 技术栈

- **框架**: FastAPI + Python 3.11+
- **数据库**: PostgreSQL + SQLAlchemy 2.0 (异步)
- **缓存**: Redis
- **AI**: Google Gemini API
- **认证**: JWT (python-jose)

## 项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models/              # SQLAlchemy 模型
│   │   ├── user.py          # 用户模型
│   │   ├── candidate.py     # 候选人模型
│   │   ├── job.py           # 职位模型
│   │   ├── flow.py          # 工作流模型
│   │   └── token.py         # Token 计费模型
│   ├── schemas/             # Pydantic 验证模式
│   ├── routers/             # API 路由
│   │   ├── auth.py          # 认证路由
│   │   ├── users.py         # 用户路由
│   │   ├── jobs.py          # 职位路由
│   │   ├── candidates.py    # 候选人路由
│   │   ├── flows.py         # 工作流路由
│   │   └── ai.py            # AI 智能体路由
│   ├── agents/              # AI 智能体
│   │   ├── base_agent.py    # 基础智能体类
│   │   ├── resume_parser.py # 简历解析智能体
│   │   ├── interview_agent.py # 面试评估智能体
│   │   ├── market_analyst.py  # 市场分析智能体
│   │   └── router_agent.py    # 路由调度智能体
│   └── utils/               # 工具函数
├── alembic/                 # 数据库迁移
├── tests/                   # 测试文件
├── requirements.txt         # 依赖列表
└── .env.example            # 环境变量示例
```

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置以下变量：
# - DATABASE_URL: PostgreSQL 连接字符串
# - GEMINI_API_KEY: Google Gemini API Key
# - SECRET_KEY: JWT 密钥
```

### 3. 初始化数据库

```bash
# 确保 PostgreSQL 运行中
# 创建数据库
createdb devnors

# 运行迁移
alembic upgrade head
```

### 4. 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 概览

### 认证 `/api/v1/auth`
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `GET /me` - 获取当前用户

### 用户 `/api/v1/users`
- `GET /` - 用户列表（管理员）
- `GET /{id}` - 用户详情
- `PUT /{id}` - 更新用户
- `GET /team/members` - 团队成员
- `POST /team/members` - 邀请成员

### 职位 `/api/v1/jobs`
- `GET /` - 职位列表
- `POST /` - 创建职位
- `GET /{id}` - 职位详情
- `PUT /{id}` - 更新职位
- `DELETE /{id}` - 删除职位

### 候选人 `/api/v1/candidates`
- `GET /` - 候选人列表
- `GET /me` - 我的档案
- `POST /analyze` - AI 简历分析
- `POST /upload-resume` - 上传简历

### 工作流 `/api/v1/flows`
- `GET /` - 流程列表
- `POST /` - 创建流程
- `GET /{id}` - 流程详情
- `PUT /{id}` - 更新流程
- `POST /{id}/advance` - 推进流程

### AI 智能体 `/api/v1/ai`
- `POST /analyze-resume` - AI 简历解析
- `POST /interview/chat` - AI 面试对话
- `POST /match-jobs` - AI 职位匹配
- `POST /market-analysis` - 市场分析
- `GET /token-usage` - Token 使用统计

## AI 智能体系统

### 简历解析智能体 (ResumeParserAgent)
- 深度解析简历文本
- 生成多维人才画像
- 输出技能雷达图数据

### 面试评估智能体 (InterviewAgent)
- 模拟压力面试
- 生成针对性问题
- 评估候选人表现

### 市场分析智能体 (MarketAnalystAgent)
- 薪资行情分析
- 市场需求评估
- 竞争力对标

### 路由调度智能体 (RouterAgent)
- 任务分发
- 流程编排
- 智能体协调

## 开发指南

### 添加新的 API 路由

1. 在 `app/routers/` 创建新路由文件
2. 在 `app/routers/__init__.py` 导出
3. 在 `app/main.py` 注册路由

### 添加新的数据模型

1. 在 `app/models/` 创建模型文件
2. 在 `app/models/__init__.py` 导出
3. 创建对应的 Schema
4. 运行 `alembic revision --autogenerate -m "描述"`
5. 运行 `alembic upgrade head`

### 添加新的智能体

1. 继承 `BaseAgent` 类
2. 实现 `_get_fallback_response` 和 `_get_fallback_json`
3. 添加业务方法

## 许可证

MIT License
