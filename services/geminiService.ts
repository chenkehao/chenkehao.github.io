
import { GoogleGenAI, Type } from "@google/genai";
import { CandidateProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeResume = async (resumeText: string): Promise<CandidateProfile> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请深度分析以下简历并以 JSON 格式返回全方位的结构化人才画像。特别包含该人才最适合的“理想工作画像”描述。简历内容： "${resumeText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experienceYears: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          idealJobPersona: { type: Type.STRING, description: "基于该人才背景推导出的理想工作环境、团队氛围及岗位挑战描述" },
          salaryRange: { type: Type.STRING, description: "根据市场行情预测的年薪范围，如 50k-80k" },
          marketDemand: { type: Type.STRING, description: "当前职位在市场上的火爆程度描述" },
          radarData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["subject", "value"]
            }
          },
          interviewQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3个针对性的压力面试问题" },
          optimizationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3条具体的简历改进或职业建议" },
          skillGaps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                resource: { type: Type.STRING, description: "建议的学习资源或方向" }
              }
            },
            description: "相对于目标高级职位存在的技能差距"
          },
          agentFeedbacks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                agentName: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["Technical", "SoftSkills", "Strategy"] },
                comment: { type: Type.STRING },
                score: { type: Type.NUMBER }
              }
            },
            description: "三个不同维度的智能体专家评估"
          },
          careerPath: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING, description: "建议的未来职位名称" },
                requirement: { type: Type.STRING, description: "达到该职位所需的关键能力提升" },
                timeframe: { type: Type.STRING, description: "预计达成时间，如 1-2年" }
              }
            },
            description: "未来3个阶段的职业晋升路径建议"
          }
        },
        required: ["name", "role", "skills", "experienceYears", "radarData", "summary", "idealJobPersona", "interviewQuestions", "optimizationSuggestions", "careerPath", "salaryRange", "marketDemand", "skillGaps", "agentFeedbacks"]
      },
      systemInstruction: "你是一位 Devnors 得若平台的资深职业导师。你将扮演多个智能体（技术专家、HRBP、战略顾问）对候选人进行多维评估。确保所有返回的文本内容为中文。评估必须客观且具有行业前瞻性。"
    }
  });

  return JSON.parse(response.text || "{}") as CandidateProfile;
};

export const chatWithInterviewer = async (history: { role: string, parts: { text: string }[] }[], userMessage: string): Promise<string> => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "你现在是 Devnors 的 AI 面试官。你正在对候选人进行压力面试。你的语气应该专业、犀利但有礼貌。请根据候选人的回答进行追问或评价。",
    }
  });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [...history, { role: 'user', parts: [{ text: userMessage }] }]
  });
  
  return response.text || "AI 面试官暂时离开了。";
};
