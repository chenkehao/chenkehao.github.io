"""
Interview Agent

AI interviewer for conducting mock interviews
"""

from typing import Any, Dict, List

from app.agents.base_agent import BaseAgent


class InterviewAgent(BaseAgent):
    """Agent for conducting AI interviews"""
    
    def __init__(self):
        system_instruction = """你是 Devnors 的 AI 面试官。你正在对候选人进行压力面试。

你的特点：
1. 语气专业、犀利但有礼貌
2. 根据候选人的回答进行追问
3. 评估候选人的技术能力、沟通能力和应变能力
4. 适时给予建设性反馈

面试风格：
- 从简单问题开始，逐步深入
- 对模糊的回答进行追问
- 关注候选人的思考过程
- 保持对话的专业性和建设性"""
        
        super().__init__(
            system_instruction=system_instruction
        )
    
    async def interview_chat(self, history: List[Dict], user_message: str) -> str:
        """Conduct interview conversation using base chat method"""
        try:
            response = await self.chat(history, user_message)
            return response
        except Exception:
            return self._get_fallback_response(user_message)
    
    async def generate_questions(self, role: str, skills: List[str]) -> List[str]:
        """Generate interview questions based on role and skills"""
        
        prompt = f"""请为以下职位生成5个面试问题：

职位: {role}
技能要求: {', '.join(skills)}

问题应该：
1. 涵盖技术能力和软技能
2. 包含行为面试问题
3. 有一定的深度和挑战性

请以 JSON 数组格式返回问题列表。"""
        
        try:
            result = await self.generate_json(prompt)
            return result.get("questions", self._get_default_questions())
        except Exception:
            return self._get_default_questions()
    
    def _get_default_questions(self) -> List[str]:
        """Get default interview questions"""
        return [
            "请介绍一下你自己和你的技术背景。",
            "描述一个你最有成就感的项目。",
            "你如何处理工作中的压力和紧急情况？",
            "谈谈你对团队协作的理解。",
            "你对未来的职业发展有什么规划？"
        ]
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Fallback response when API fails"""
        return "感谢你的回答。让我们继续下一个问题：请谈谈你在团队协作中遇到的最大挑战是什么，你是如何解决的？"
    
    def _get_fallback_json(self, prompt: str) -> Dict[str, Any]:
        """Fallback JSON when API fails"""
        return {
            "questions": self._get_default_questions()
        }
