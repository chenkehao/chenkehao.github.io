"""
设置相关数据模型
包括用户/企业设置、认证信息、AI引擎配置、API密钥、审计日志等
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from app.database import Base


class CertificationStatus(str, Enum):
    """认证状态"""
    VALID = "valid"
    EXPIRED = "expired"
    PENDING = "pending"


# === 用户/企业设置 ===
class UserSettings(Base):
    """用户/企业基础设置"""
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # 基础信息
    display_name = Column(String(200), default="")  # 显示名称/企业全称
    contact_email = Column(String(200), default="")  # 管理联系邮箱
    contact_name = Column(String(100), default="")  # 联系人姓名
    contact_phone = Column(String(50), default="")  # 联系电话
    address = Column(String(500), default="")  # 公司地址
    website = Column(String(200), default="")  # 官方网址
    industry = Column(String(100), default="人工智能")  # 所属行业
    company_size = Column(String(50), default="1-50人")  # 企业规模
    description = Column(Text, default="")  # 企业简介
    
    # 功能开关
    notification_enabled = Column(Boolean, default=True)  # 智能消息推送
    dark_mode = Column(Boolean, default=False)  # 深色模式
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# === 企业认证信息 ===
class EnterpriseCertification(Base):
    """企业资质认证"""
    __tablename__ = "enterprise_certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(200), nullable=False)  # 认证名称
    organization = Column(String(200))  # 发证机构
    cert_date = Column(String(20))  # 认证日期
    status = Column(SQLEnum(CertificationStatus), default=CertificationStatus.VALID)
    category = Column(String(50), default="qualification")  # 类别：qualification, credit, other
    score = Column(Integer)  # 信用分数（如适用）
    color = Column(String(100))  # 显示颜色
    icon = Column(String(50))  # 图标名称
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# === 个人认证信息 ===
class PersonalCertification(Base):
    """个人认证信息"""
    __tablename__ = "personal_certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(200), nullable=False)  # 认证名称
    organization = Column(String(200))  # 发证机构/学校
    cert_date = Column(String(20))  # 认证日期/毕业时间
    status = Column(SQLEnum(CertificationStatus), default=CertificationStatus.VALID)
    category = Column(String(50), default="education")  # 类别：education, career, credit, award
    
    # 学历相关
    degree = Column(String(50))  # 学位
    major = Column(String(100))  # 专业
    cert_number = Column(String(100))  # 证书编号
    
    # 评分相关
    score = Column(Integer)
    level = Column(String(50))  # 级别/等级
    
    color = Column(String(100))  # 显示颜色
    icon = Column(String(50))  # 图标名称
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# === AI引擎配置 ===
class AIEngineConfig(Base):
    """AI引擎配置"""
    __tablename__ = "ai_engine_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    task = Column(String(100), nullable=False)  # 任务类型
    model_name = Column(String(100), nullable=False)  # 模型名称
    provider = Column(String(100), default="Devnors")  # 提供商
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# === API密钥 ===
class APIKey(Base):
    """API密钥"""
    __tablename__ = "api_api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    key = Column(String(100), nullable=False, unique=True)
    name = Column(String(100), default="Production Key")
    environment = Column(String(20), default="production")  # production, development
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True))


# === 审计日志 ===
class AuditLog(Base):
    """系统安全日志"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    action = Column(String(500), nullable=False)  # 操作描述
    actor = Column(String(100), nullable=False)  # 执行者
    ip_address = Column(String(50))  # IP地址
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
