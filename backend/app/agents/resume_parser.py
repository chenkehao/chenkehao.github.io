"""
Resume Parser Agent

Analyzes resumes and generates comprehensive candidate profiles
"""

import json
from typing import Any, Dict

from app.agents.base_agent import BaseAgent
from app.schemas.candidate import ResumeAnalysisResponse, RadarDataPoint, AgentFeedbackSchema, CareerPathSchema, SkillGapSchema


class ResumeParserAgent(BaseAgent):
    """Agent for parsing resumes and building candidate profiles"""
    
    def __init__(self):
        system_instruction = """你是 Devnors 得若平台的资深职业导师。你将扮演多个智能体（技术专家、HRBP、战略顾问）对候选人进行多维评估。

你的任务是深度分析简历并生成全方位的结构化人才画像。

评估必须：
1. 客观且具有行业前瞻性
2. 所有返回的文本内容为中文
3. 提供具体可操作的建议
4. 基于市场行情给出合理的薪资预测"""
        
        super().__init__(
            system_instruction=system_instruction
        )
    
    async def analyze(self, resume_text: str) -> ResumeAnalysisResponse:
        """Analyze resume and generate candidate profile"""
        
        prompt = f"""请深度分析以下简历并以 JSON 格式返回全方位的结构化人才画像。

简历内容：
{resume_text}

请返回以下格式的 JSON：
{{
    "name": "候选人姓名",
    "role": "当前/目标职位",
    "skills": ["技能1", "技能2", ...],
    "experienceYears": 工作年限（数字）,
    "summary": "职业概况总结",
    "idealJobPersona": "基于该人才背景推导出的理想工作环境、团队氛围及岗位挑战描述",
    "salaryRange": "根据市场行情预测的年薪范围，如 50k-80k",
    "marketDemand": "当前职位在市场上的火爆程度描述",
    "radarData": [
        {{"subject": "技术能力", "value": 85}},
        {{"subject": "项目经验", "value": 80}},
        {{"subject": "沟通能力", "value": 75}},
        {{"subject": "学习能力", "value": 90}},
        {{"subject": "团队协作", "value": 85}},
        {{"subject": "领导力", "value": 70}}
    ],
    "interviewQuestions": ["针对性面试问题1", "问题2", "问题3"],
    "optimizationSuggestions": ["简历改进建议1", "建议2", "建议3"],
    "careerPath": [
        {{"role": "未来职位1", "requirement": "达到该职位所需的关键能力", "timeframe": "预计时间"}},
        {{"role": "未来职位2", "requirement": "关键能力", "timeframe": "预计时间"}},
        {{"role": "未来职位3", "requirement": "关键能力", "timeframe": "预计时间"}}
    ],
    "skillGaps": [
        {{"skill": "技能差距1", "priority": "High/Medium/Low", "resource": "学习资源建议"}},
        {{"skill": "技能差距2", "priority": "High/Medium/Low", "resource": "学习资源建议"}}
    ],
    "agentFeedbacks": [
        {{"agentName": "技术专家", "type": "Technical", "comment": "技术评估意见", "score": 85}},
        {{"agentName": "HRBP", "type": "SoftSkills", "comment": "软技能评估", "score": 80}},
        {{"agentName": "战略顾问", "type": "Strategy", "comment": "职业发展建议", "score": 82}}
    ]
}}"""
        
        try:
            result = await self.generate_json(prompt)
            return self._parse_result(result)
        except Exception as e:
            # Return fallback data
            return self._parse_result(self._get_fallback_json(prompt))
    
    def _parse_result(self, data: Dict[str, Any]) -> ResumeAnalysisResponse:
        """Parse API response to schema"""
        return ResumeAnalysisResponse(
            name=data.get("name", "未知"),
            role=data.get("role", "未知职位"),
            skills=data.get("skills", []),
            experienceYears=float(data.get("experienceYears", 0)),
            summary=data.get("summary", ""),
            idealJobPersona=data.get("idealJobPersona"),
            salaryRange=data.get("salaryRange"),
            marketDemand=data.get("marketDemand"),
            radarData=[
                RadarDataPoint(subject=r["subject"], value=r["value"])
                for r in data.get("radarData", [])
            ],
            interviewQuestions=data.get("interviewQuestions"),
            optimizationSuggestions=data.get("optimizationSuggestions"),
            careerPath=[
                CareerPathSchema(**c) for c in data.get("careerPath", [])
            ] if data.get("careerPath") else None,
            skillGaps=[
                SkillGapSchema(**s) for s in data.get("skillGaps", [])
            ] if data.get("skillGaps") else None,
            agentFeedbacks=[
                AgentFeedbackSchema(**a) for a in data.get("agentFeedbacks", [])
            ] if data.get("agentFeedbacks") else None,
        )
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Fallback text response"""
        return "简历分析服务暂时不可用，请稍后重试。"
    
    def _get_fallback_json(self, prompt: str) -> Dict[str, Any]:
        """Fallback JSON response with mock data"""
        return {
            "name": "示例候选人",
            "role": "高级软件工程师",
            "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
            "experienceYears": 5,
            "summary": "具有5年软件开发经验的全栈工程师，擅长后端架构设计和前端交互实现。",
            "idealJobPersona": "适合技术驱动型团队，追求代码质量和工程效率，喜欢解决复杂技术挑战。",
            "salaryRange": "¥40k - ¥60k",
            "marketDemand": "市场需求旺盛，全栈工程师持续紧缺",
            "radarData": [
                {"subject": "技术能力", "value": 85},
                {"subject": "项目经验", "value": 80},
                {"subject": "沟通能力", "value": 75},
                {"subject": "学习能力", "value": 90},
                {"subject": "团队协作", "value": 85},
                {"subject": "领导力", "value": 70}
            ],
            "interviewQuestions": [
                "请描述一个你主导的复杂项目，遇到的最大挑战是什么？",
                "如何在保证代码质量的同时提高开发效率？",
                "谈谈你对微服务架构的理解和实践经验。"
            ],
            "optimizationSuggestions": [
                "建议增加具体的项目成果数据，如性能提升百分比",
                "可以补充开源项目贡献或技术博客链接",
                "建议突出团队协作和跨部门沟通经验"
            ],
            "careerPath": [
                {"role": "技术负责人", "requirement": "提升团队管理和架构设计能力", "timeframe": "1-2年"},
                {"role": "技术总监", "requirement": "积累跨团队协调和技术决策经验", "timeframe": "3-4年"},
                {"role": "CTO", "requirement": "培养商业思维和战略规划能力", "timeframe": "5年以上"}
            ],
            "skillGaps": [
                {"skill": "大规模分布式系统设计", "priority": "High", "resource": "建议学习 MIT 6.824 分布式系统课程"},
                {"skill": "团队管理", "priority": "Medium", "resource": "推荐《成为技术领导者》一书"}
            ],
            "agentFeedbacks": [
                {"agentName": "技术专家", "type": "Technical", "comment": "技术基础扎实，对新技术保持学习热情，建议深入分布式系统领域", "score": 85},
                {"agentName": "HRBP", "type": "SoftSkills", "comment": "沟通表达清晰，团队意识强，具备良好的职业素养", "score": 82},
                {"agentName": "战略顾问", "type": "Strategy", "comment": "职业规划清晰，建议加强管理能力培养，为技术管理岗位做准备", "score": 80}
            ]
        }
