/**
 * Gemini Service - AI 功能服务
 * 
 * 支持两种模式：
 * 1. 通过后端 API 调用（推荐，需要启动后端服务）
 * 2. 直接调用 Gemini API（需要配置 API_KEY）
 */

import { CandidateProfile } from "../types";
import { analyzeResumeAPI, chatWithInterviewerAPI } from "./apiService";

// 是否使用后端 API（推荐）
const USE_BACKEND_API = true;

// 后端 API 可用性检测（每次都重新检测，避免缓存问题）
const checkBackendAvailable = async (): Promise<boolean> => {
  try {
    // 使用相对路径，通过 Vite 代理访问后端
    const response = await fetch('/health', { 
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const isAvailable = response.ok;
    console.log('[AI Service] Backend health check:', isAvailable ? 'OK' : 'FAILED');
    return isAvailable;
  } catch (e) {
    console.warn('[AI Service] Backend health check failed:', e);
    return false;
  }
};

/**
 * AI 简历分析
 */
export const analyzeResume = async (resumeText: string, userId?: number): Promise<CandidateProfile> => {
  console.log('[AI Service] analyzeResume called, text length:', resumeText.length);
  
  // 优先使用后端 API
  if (USE_BACKEND_API) {
    console.log('[AI Service] Checking backend availability...');
    const isBackendUp = await checkBackendAvailable();
    
    if (isBackendUp) {
      try {
        console.log('[AI Service] Calling backend API...');
        const result = await analyzeResumeAPI(resumeText, userId);
        console.log('[AI Service] Backend API success:', result.name);
        return result as CandidateProfile;
      } catch (error) {
        console.warn('[AI Service] Backend API failed:', error);
        // 如果后端失败，降级到直接调用
      }
    } else {
      console.warn('[AI Service] Backend not available');
    }
  }
  
  // 降级：直接调用 Gemini API
  console.log('[AI Service] Falling back to direct Gemini API call...');
  return analyzeResumeDirectly(resumeText);
};

/**
 * 直接调用 Gemini API 进行简历分析
 */
const analyzeResumeDirectly = async (resumeText: string): Promise<CandidateProfile> => {
  const { GoogleGenAI, Type } = await import("@google/genai");
  
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (typeof process !== 'undefined' ? process.env?.API_KEY : '') || '';
  
  if (!apiKey) {
    throw new Error('未配置 Gemini API Key，请启动后端服务或配置 API Key');
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `请深度分析以下简历并以 JSON 格式返回全方位的结构化人才画像。特别包含该人才最适合的"理想工作画像"描述。简历内容： "${resumeText}"`,
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

/**
 * AI 面试对话
 */
export const chatWithInterviewer = async (
  history: { role: string, parts: { text: string }[] }[], 
  userMessage: string,
  userId?: number
): Promise<string> => {
  console.log('[AI Service] chatWithInterviewer called');
  
  // 优先使用后端 API
  if (USE_BACKEND_API) {
    const isBackendUp = await checkBackendAvailable();
    
    if (isBackendUp) {
      try {
        // 转换历史格式
        const convertedHistory = history.map(h => ({
          role: h.role === 'model' ? 'assistant' : h.role,
          content: h.parts[0]?.text || ''
        }));
        
        console.log('[AI Service] Calling interview API...');
        const result = await chatWithInterviewerAPI(convertedHistory, userMessage, userId);
        console.log('[AI Service] Interview API success');
        return result.response;
      } catch (error) {
        console.warn('[AI Service] Interview API failed:', error);
      }
    }
  }
  
  // 降级：直接调用 Gemini API
  console.log('[AI Service] Falling back to direct Gemini call...');
  return chatWithInterviewerDirectly(history, userMessage);
};

/**
 * 直接调用 Gemini API 进行面试对话
 */
const chatWithInterviewerDirectly = async (
  history: { role: string, parts: { text: string }[] }[], 
  userMessage: string
): Promise<string> => {
  const { GoogleGenAI } = await import("@google/genai");
  
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (typeof process !== 'undefined' ? process.env?.API_KEY : '') || '';
  
  if (!apiKey) {
    throw new Error('未配置 Gemini API Key，请启动后端服务或配置 API Key');
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
    config: {
      systemInstruction: "你现在是 Devnors 的 AI 面试官。你正在对候选人进行压力面试。你的语气应该专业、犀利但有礼貌。请根据候选人的回答进行追问或评价。",
    }
  });
  
  return response.text || "AI 面试官暂时离开了。";
};
