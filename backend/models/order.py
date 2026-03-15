"""
RETURNKART.IN — PYDANTIC DATA CONTRACTS
=========================================
Shared data models used by: DB layer, AI service, API layer, and frontend response serialization.
Define the shape ONCE here. Import everywhere else.
"""
from datetime import date, datetime
from typing import Optional, Literal
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


# ------------------------------------------------------------
# DPDP Act 2023 Compliance Fields
# Required on ALL models that touch user data.
# ------------------------------------------------------------
class DPDPFields(BaseModel):
    """Fields required by India's Digital Personal Data Protection Act 2023."""
    consent_timestamp: Optional[datetime] = None  # When user granted consent
    purpose_id: Optional[str] = None              # e.g. "return_tracking" or "logistics_benchmarking"
    data_expiry_date: Optional[date] = None        # Auto-set to +24 months from consent
    anonymization_status: bool = False             # True = scrubbed for B2B reporting


# ------------------------------------------------------------
# Return Policy (from knowledge_base.json)
# ------------------------------------------------------------
class ReturnPolicy(BaseModel):
    """The return policy looked up from the RAG knowledge base."""
    brand: str
    category: str
    return_window_days: int
    return_type: Literal["refund", "replacement", "exchange", "refund_or_exchange"]
    is_replacement_only: bool = False
    conditions: list[str] = []
    non_returnable: list[str] = []


# ------------------------------------------------------------
# Order (core entity)
# ------------------------------------------------------------
class OrderBase(BaseModel):
    """Fields shared between create and read."""
    order_id: str = Field(..., description="Unique order ID from the platform (e.g. 402-1234567-8901234)")
    brand: str = Field(..., description="Platform: Amazon, Myntra, Flipkart, Meesho, Ajio")
    item_name: str
    price: float
    order_date: date
    return_deadline: Optional[date] = None         # AI-calculated
    category: Optional[str] = None
    courier_partner: Optional[str] = None
    delivery_pincode: Optional[str] = None
    is_replacement_only: bool = False
    status: Literal["active", "kept", "returned", "expired"] = "active"


class OrderCreate(OrderBase, DPDPFields):
    """Used when inserting a new order into Supabase."""
    user_id: str  # Supabase auth user UUID


class Order(OrderBase, DPDPFields):
    """Full order as returned from DB — includes generated fields."""
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows creating from ORM/dict objects


# ------------------------------------------------------------
# AI Output (Gemini response contract)
# ------------------------------------------------------------
class AIOrderContext(BaseModel):
    """The structured output Gemini must return when parsing an invoice email."""
    order_id: Optional[str] = None
    brand: Optional[str] = None
    item_name: Optional[str] = None
    total_amount: Optional[float] = None
    currency: str = "INR"
    order_date: Optional[str] = None  # String — parsed to date in service layer
    category: Optional[str] = None
    courier_partner: Optional[str] = None
    delivery_pincode: Optional[str] = None
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="AI confidence 0-1")
    raw_extraction_notes: Optional[str] = None
