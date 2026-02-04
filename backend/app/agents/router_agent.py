"""
Router Agent

Orchestrates workflow and routes tasks to appropriate agents
"""

from typing import Any, Dict, List, Optional
from enum import Enum

from app.agents.base_agent import BaseAgent


class TaskType(str, Enum):
    """Types of tasks the router can handle"""
    RESUME_PARSE = "resume_parse"
    INTERVIEW = "interview"
    MARKET_ANALYSIS = "market_analysis"
    JOB_MATCH = "job_match"
    PROFILE_BUILD = "profile_build"


class RouterAgent(BaseAgent):
    """Agent for orchestrating workflow and routing tasks"""
    
    def __init__(self):
        system_instruction = """你是 Devnors 的路由调度智能体。你的职责是：

1. 分析用户请求，确定需要调用哪些智能体
2. 协调多个智能体的工作流程
3. 整合各智能体的输出结果
4. 优化任务执行顺序

你应该：
- 准确理解用户意图
- 选择最合适的智能体组合
- 设计高效的执行流程
- 使用中文回答"""
        
        super().__init__(
            model_name="gemini-1.5-flash",
            system_instruction=system_instruction
        )
    
    async def route_task(self, user_request: str) -> Dict[str, Any]:
        """Analyze request and route to appropriate agents"""
        
        prompt = f"""请分析以下用户请求，确定需要调用哪些智能体：

用户请求: {user_request}

可用智能体：
1. resume_parser - 简历解析智能体：解析简历，提取关键信息
2. interview_agent - 面试评估智能体：进行模拟面试，评估候选人
3. market_analyst - 市场分析智能体：分析薪资行情和市场需求
4. profile_builder - 画像构建智能体：构建候选人多维画像
5. job_matcher - 岗位匹配智能体：匹配合适的职位

请以 JSON 格式返回路由决策：
{{
    "primary_agent": "主要负责的智能体",
    "supporting_agents": ["辅助智能体列表"],
    "workflow": ["执行步骤1", "执行步骤2", ...],
    "estimated_tokens": 预估token消耗,
    "reasoning": "路由决策的原因"
}}"""
        
        try:
            return await self.generate_json(prompt)
        except Exception:
            return self._get_fallback_json(prompt)
    
    async def plan_workflow(
        self,
        task_type: TaskType,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Plan workflow for a specific task"""
        
        prompt = f"""请为以下任务规划执行流程：

任务类型: {task_type.value}
上下文信息: {context}

请以 JSON 格式返回工作流计划：
{{
    "steps": [
        {{"step": 1, "agent": "智能体名称", "action": "执行动作", "estimated_tokens": 预估token}},
        ...
    ],
    "total_estimated_tokens": 总预估token,
    "estimated_time": "预估执行时间",
    "dependencies": ["步骤间的依赖关系"],
    "fallback_plan": "失败时的备选方案"
}}"""
        
        try:
            return await self.generate_json(prompt)
        except Exception:
            return self._get_default_workflow(task_type)
    
    def _get_default_workflow(self, task_type: TaskType) -> Dict[str, Any]:
        """Get default workflow for task type"""
        workflows = {
            TaskType.RESUME_PARSE: {
                "steps": [
                    {"step": 1, "agent": "resume_parser", "action": "解析简历文本", "estimated_tokens": 2000},
                    {"step": 2, "agent": "profile_builder", "action": "构建候选人画像", "estimated_tokens": 3000},
                ],
                "total_estimated_tokens": 5000,
                "estimated_time": "10-15秒",
                "dependencies": ["步骤2依赖步骤1的输出"],
                "fallback_plan": "使用规则引擎进行基础解析"
            },
            TaskType.INTERVIEW: {
                "steps": [
                    {"step": 1, "agent": "interview_agent", "action": "生成面试问题", "estimated_tokens": 1000},
                    {"step": 2, "agent": "interview_agent", "action": "进行面试对话", "estimated_tokens": 2000},
                    {"step": 3, "agent": "interview_agent", "action": "生成面试报告", "estimated_tokens": 1500},
                ],
                "total_estimated_tokens": 4500,
                "estimated_time": "根据对话长度",
                "dependencies": ["步骤3依赖步骤2的对话内容"],
                "fallback_plan": "使用预设问题库"
            },
            TaskType.MARKET_ANALYSIS: {
                "steps": [
                    {"step": 1, "agent": "market_analyst", "action": "分析薪资行情", "estimated_tokens": 1500},
                    {"step": 2, "agent": "market_analyst", "action": "评估市场需求", "estimated_tokens": 1500},
                ],
                "total_estimated_tokens": 3000,
                "estimated_time": "5-10秒",
                "dependencies": [],
                "fallback_plan": "返回历史缓存数据"
            },
            TaskType.JOB_MATCH: {
                "steps": [
                    {"step": 1, "agent": "job_matcher", "action": "计算匹配分数", "estimated_tokens": 2000},
                    {"step": 2, "agent": "job_matcher", "action": "生成匹配报告", "estimated_tokens": 1500},
                ],
                "total_estimated_tokens": 3500,
                "estimated_time": "8-12秒",
                "dependencies": ["需要候选人画像数据"],
                "fallback_plan": "使用关键词匹配"
            },
        }
        
        return workflows.get(task_type, {
            "steps": [],
            "total_estimated_tokens": 0,
            "estimated_time": "未知",
            "dependencies": [],
            "fallback_plan": "联系技术支持"
        })
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Fallback text response"""
        return "路由服务暂时不可用，请稍后重试。"
    
    def _get_fallback_json(self, prompt: str) -> Dict[str, Any]:
        """Fallback JSON response"""
        return {
            "primary_agent": "resume_parser",
            "supporting_agents": ["profile_builder"],
            "workflow": ["解析简历", "构建画像", "返回结果"],
            "estimated_tokens": 5000,
            "reasoning": "默认使用简历解析流程"
        }
