"""
版本更新记录数据模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Changelog(Base):
    """平台版本更新记录"""
    __tablename__ = "changelogs"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(20), nullable=False, index=True)          # e.g. v1.0.0
    date = Column(String(20), nullable=False)                          # e.g. 2026-02-04
    tag = Column(String(20), nullable=True, default="")                # e.g. 最新, 首发
    tag_color = Column(String(60), nullable=True, default="")          # tailwind classes
    item_type = Column(String(20), nullable=False, default="新功能")    # 新功能 / 优化 / 修复
    item_color = Column(String(60), nullable=False, default="text-emerald-600 bg-emerald-50")
    description = Column(Text, nullable=False)
    commit_hash = Column(String(40), nullable=True)                    # git commit hash
    sort_order = Column(Integer, nullable=False, default=0)            # 排序：version内的顺序

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Changelog(version={self.version}, desc={self.description[:30]})>"
