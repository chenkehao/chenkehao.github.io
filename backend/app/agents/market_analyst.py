"""
Market Analyst Agent

Analyzes job market trends and salary benchmarks
"""

from typing import Any, Dict, List, Optional

from app.agents.base_agent import BaseAgent


class MarketAnalystAgent(BaseAgent):
    """Agent for market analysis and salary benchmarking"""
    
    def __init__(self):
        system_instruction = """你是 Devnors 的市场分析师智能体。你的职责是：

1. 分析职位的市场行情
2. 提供准确的薪资对标数据
3. 评估人才供需状况
4. 识别行业趋势和热门技能

你的分析应该：
- 基于中国主要城市的市场数据
- 考虑行业、职级、经验等因素
- 提供具体可操作的建议
- 使用中文回答"""
        
        super().__init__(
            system_instruction=system_instruction
        )
    
    async def analyze_salary(
        self,
        role: str,
        experience_years: float,
        skills: List[str],
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze salary range for a role"""
        
        prompt = f"""请分析以下职位的薪资行情：

职位: {role}
工作经验: {experience_years}年
技能: {', '.join(skills)}
地点: {location or '全国'}

请以 JSON 格式返回分析结果，包括：
1. salary_min: 最低年薪（万）
2. salary_max: 最高年薪（万）
3. salary_median: 中位数年薪（万）
4. market_percentile: 市场分位（如 "75%"）
5. factors: 影响薪资的关键因素列表
6. recommendation: 薪资谈判建议"""
        
        try:
            return await self.generate_json(prompt)
        except Exception:
            return self._get_fallback_json(prompt)
    
    async def analyze_market_demand(
        self,
        role: str,
        skills: List[str]
    ) -> Dict[str, Any]:
        """Analyze market demand for a role"""
        
        prompt = f"""请分析以下职位的市场需求：

职位: {role}
相关技能: {', '.join(skills)}

请以 JSON 格式返回分析结果，包括：
1. demand_level: 需求程度（高/中/低）
2. competition_level: 竞争程度（高/中/低）
3. supply_demand_ratio: 供需比
4. trending_up: 是否上升趋势
5. hot_skills: 当前热门技能列表
6. emerging_skills: 新兴技能列表
7. outlook: 未来展望描述"""
        
        try:
            return await self.generate_json(prompt)
        except Exception:
            return self._get_fallback_json(prompt)
    
    async def benchmark_candidate(
        self,
        profile: Dict[str, Any],
        target_role: str
    ) -> Dict[str, Any]:
        """Benchmark candidate against market"""
        
        prompt = f"""请对比分析候选人与目标职位的市场竞争力：

候选人信息:
- 当前职位: {profile.get('role', '未知')}
- 工作经验: {profile.get('experienceYears', 0)}年
- 技能: {', '.join(profile.get('skills', []))}

目标职位: {target_role}

请以 JSON 格式返回对比分析，包括：
1. competitiveness_score: 竞争力评分（0-100）
2. strengths: 优势列表
3. gaps: 差距列表
4. market_position: 市场定位描述
5. salary_expectation: 合理薪资预期
6. improvement_suggestions: 提升建议列表"""
        
        try:
            return await self.generate_json(prompt)
        except Exception:
            return self._get_fallback_json(prompt)
    
    def _get_fallback_response(self, prompt: str) -> str:
        """Fallback text response"""
        return "市场分析服务暂时不可用，请稍后重试。"
    
    def _get_fallback_json(self, prompt: str) -> Dict[str, Any]:
        """Fallback JSON response"""
        return {
            "salary_min": 30,
            "salary_max": 60,
            "salary_median": 45,
            "market_percentile": "50%",
            "demand_level": "高",
            "competition_level": "中",
            "supply_demand_ratio": "1:3",
            "trending_up": True,
            "hot_skills": ["Python", "AI/ML", "云原生"],
            "emerging_skills": ["LLM", "向量数据库", "智能体"],
            "outlook": "该领域人才需求持续增长，具有良好的职业发展前景。",
            "competitiveness_score": 75,
            "strengths": ["技术基础扎实", "学习能力强"],
            "gaps": ["缺乏大型项目经验", "管理能力待提升"],
            "market_position": "中高级人才",
            "salary_expectation": "¥40k-55k/月",
            "improvement_suggestions": [
                "建议补充云平台认证",
                "积累团队管理经验",
                "关注 AI 领域最新进展"
            ],
            "factors": [
                "一线城市薪资高于二三线20-30%",
                "AI相关技能可提升薪资15-25%",
                "管理经验是晋升关键因素"
            ],
            "recommendation": "建议薪资谈判时强调AI技术背景和项目成果"
        }
