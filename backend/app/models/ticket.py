"""
工单/反馈建议数据模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Ticket(Base):
    """用户反馈工单"""
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # 工单分类
    type = Column(String(20), nullable=False, default="question")       # bug / feature / question / complaint
    priority = Column(String(20), nullable=False, default="normal")     # low / normal / high / urgent
    status = Column(String(20), nullable=False, default="open")         # open / processing / resolved / closed

    # 工单内容
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    contact = Column(String(200), nullable=True)  # 可选联系方式

    # 管理员回复
    reply = Column(Text, nullable=True)
    replied_at = Column(DateTime, nullable=True)

    # 时间戳
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Ticket(id={self.id}, title={self.title}, status={self.status})>"
