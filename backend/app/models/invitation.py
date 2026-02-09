"""
Invitation / Referral Models
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Invitation(Base):
    """Tracks referral invitations between users"""
    
    __tablename__ = "invitations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    inviter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    invitee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    invite_code: Mapped[str] = mapped_column(String(20))  # the code that was used
    reward_tokens: Mapped[int] = mapped_column(Integer, default=500)
    status: Mapped[str] = mapped_column(String(20), default="registered")  # registered / rewarded
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Invitation(id={self.id}, inviter={self.inviter_id}, invitee={self.invitee_id})>"
