"""
AI Agents Module

Multi-agent system for recruitment automation
"""

from app.agents.base_agent import BaseAgent
from app.agents.resume_parser import ResumeParserAgent
from app.agents.interview_agent import InterviewAgent
from app.agents.market_analyst import MarketAnalystAgent
from app.agents.router_agent import RouterAgent

__all__ = [
    "BaseAgent",
    "ResumeParserAgent",
    "InterviewAgent",
    "MarketAnalystAgent",
    "RouterAgent",
]
