"""
Order & Transaction Models
订单与交易记录模型
"""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, Enum, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OrderType(str, enum.Enum):
    """订单类型"""
    PACKAGE_PURCHASE = "package_purchase"  # Token套餐购买
    SUBSCRIPTION = "subscription"          # 订阅续费
    REFUND = "refund"                      # 退款
    PLATFORM_EXPENSE = "platform_expense"  # 平台支出（如AI调用成本）
    PLATFORM_INCOME = "platform_income"    # 平台其他收入
    ADJUSTMENT = "adjustment"              # 手动调账


class OrderStatus(str, enum.Enum):
    """订单状态"""
    PENDING = "pending"        # 待支付
    PAID = "paid"              # 已支付
    COMPLETED = "completed"    # 已完成
    REFUNDED = "refunded"      # 已退款
    PARTIAL_REFUND = "partial_refund"  # 部分退款
    CANCELLED = "cancelled"    # 已取消
    FAILED = "failed"          # 失败


class PaymentMethod(str, enum.Enum):
    """支付方式"""
    ALIPAY = "alipay"
    WECHAT = "wechat"
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    BALANCE = "balance"
    SYSTEM = "system"          # 系统自动（如退款、调账）


class Order(Base):
    """订单记录"""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_no: Mapped[str] = mapped_column(String(64), unique=True, index=True)

    # 关联用户（平台支出类可为空）
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    # 订单类型与状态
    order_type: Mapped[OrderType] = mapped_column(Enum(OrderType), default=OrderType.PACKAGE_PURCHASE)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)

    # 金额：正数=收入，负数=支出/退款
    amount: Mapped[float] = mapped_column(Float, default=0)
    original_amount: Mapped[float] = mapped_column(Float, default=0)  # 原价（优惠前）
    discount: Mapped[float] = mapped_column(Float, default=0)  # 优惠金额
    refund_amount: Mapped[float] = mapped_column(Float, default=0)  # 已退金额

    # 支付方式
    payment_method: Mapped[Optional[PaymentMethod]] = mapped_column(Enum(PaymentMethod), nullable=True)
    payment_no: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)  # 第三方支付单号

    # 关联套餐（购买/退款场景）
    package_id: Mapped[Optional[int]] = mapped_column(ForeignKey("token_packages.id"), nullable=True)
    package_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # 描述与备注
    title: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_remark: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 管理员备注

    # 关联退款单（退款时指向原订单）
    related_order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id"), nullable=True)

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    refunded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_type_status", "order_type", "status"),
    )

    def __repr__(self):
        return f"<Order(id={self.id}, no={self.order_no}, type={self.order_type}, amount={self.amount})>"
