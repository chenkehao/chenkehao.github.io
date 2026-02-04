"""
Base Agent Class

Foundation for all AI agents in the system
Supports multiple AI providers: MiniMax, Gemini
"""

import json
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class BaseAgent(ABC):
    """Base class for all AI agents"""
    
    def __init__(
        self,
        model_name: Optional[str] = None,
        system_instruction: Optional[str] = None,
    ):
        self.system_instruction = system_instruction
        
        # Get fresh settings
        from app.config import Settings
        fresh_settings = Settings()
        self.provider = fresh_settings.ai_provider
        
        # Set default model based on provider
        if model_name:
            self.model_name = model_name
        elif self.provider == "minimax":
            self.model_name = "MiniMax-Text-01"
        else:
            self.model_name = "gemini-2.0-flash-lite"
        
        print(f"[Agent] Provider: {self.provider}, Model: {self.model_name}")
    
    async def generate(self, prompt: str) -> str:
        """Generate response from the model"""
        try:
            if self.provider == "minimax":
                return await self._generate_minimax(prompt)
            else:
                return await self._generate_gemini(prompt)
        except Exception as e:
            print(f"AI generation error: {e}")
            return self._get_fallback_response(prompt)
    
    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """Generate JSON response from the model"""
        try:
            if self.provider == "minimax":
                return await self._generate_minimax_json(prompt)
            else:
                return await self._generate_gemini_json(prompt)
        except Exception as e:
            print(f"AI JSON generation error: {e}")
            return self._get_fallback_json(prompt)
    
    # ============ MiniMax API ============
    
    async def _generate_minimax(self, prompt: str) -> str:
        """Generate response using MiniMax API"""
        # Re-import settings to get fresh config
        from app.config import Settings
        fresh_settings = Settings()
        
        if not fresh_settings.minimax_api_key:
            raise ValueError(f"MiniMax API Key not configured. Provider: {fresh_settings.ai_provider}")
        
        api_key = fresh_settings.minimax_api_key
        
        url = "https://api.minimax.chat/v1/text/chatcompletion_v2"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        messages = []
        if self.system_instruction:
            messages.append({
                "role": "system",
                "content": self.system_instruction
            })
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 8192,  # 增加到 8K 避免响应被截断
        }
        
        async with httpx.AsyncClient(timeout=90.0) as client:
            print(f"[MiniMax] Calling API with model: {self.model_name}")
            response = await client.post(url, headers=headers, json=payload)
            
            result = response.json()
            print(f"[MiniMax] Response status: {response.status_code}")
            
            # Check for errors
            if "base_resp" in result and result["base_resp"].get("status_code") != 0:
                error_msg = result["base_resp"].get("status_msg", "Unknown error")
                raise ValueError(f"MiniMax API error: {error_msg}")
            
            response.raise_for_status()
            
            # Extract text from MiniMax response
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                print(f"[MiniMax] Got response, length: {len(content)}")
                return content
            
            raise ValueError(f"Unexpected MiniMax response: {result}")
    
    async def _generate_minimax_json(self, prompt: str) -> Dict[str, Any]:
        """Generate JSON response using MiniMax API"""
        # Add JSON instruction to prompt - 强调要完整返回
        json_prompt = f"""{prompt}

重要提示：请严格以完整的 JSON 格式返回结果，确保 JSON 结构完整闭合。不要包含任何其他文字或 markdown 标记。"""
        
        response_text = await self._generate_minimax(json_prompt)
        
        if response_text is None:
            raise ValueError("MiniMax API returned None")
        
        # Clean up response - remove markdown code blocks if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"JSON decode error. Response: {response_text[:500]}")
            # 尝试修复不完整的 JSON
            fixed = self._try_fix_json(response_text)
            if fixed:
                return fixed
            raise
    
    def _try_fix_json(self, text: str) -> Optional[Dict[str, Any]]:
        """尝试修复不完整的 JSON"""
        import re
        
        # 尝试找到最后一个完整的属性并闭合 JSON
        # 找到最后一个 "key": "value" 或 "key": [...] 或 "key": number 的位置
        patterns = [
            r'("[\w]+"\s*:\s*"[^"]*")\s*,?\s*$',  # "key": "value"
            r'("[\w]+"\s*:\s*\d+\.?\d*)\s*,?\s*$',  # "key": number
            r'(\])\s*,?\s*$',  # ends with ]
            r'(\})\s*,?\s*$',  # ends with }
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                # 找到匹配，尝试在此处闭合 JSON
                pos = match.end()
                truncated = text[:pos].rstrip(',').rstrip()
                
                # 计算需要添加的闭合括号
                open_braces = truncated.count('{') - truncated.count('}')
                open_brackets = truncated.count('[') - truncated.count(']')
                
                if open_braces > 0 or open_brackets > 0:
                    closing = ']' * open_brackets + '}' * open_braces
                    fixed_json = truncated + closing
                    try:
                        result = json.loads(fixed_json)
                        print(f"[JSON Fix] Successfully fixed incomplete JSON")
                        return result
                    except:
                        pass
        
        return None
    
    # ============ Gemini API (REST) ============
    
    async def _generate_gemini(self, prompt: str) -> str:
        """Generate response using Gemini REST API"""
        from app.config import Settings
        fresh_settings = Settings()
        
        if not fresh_settings.gemini_api_key:
            raise ValueError("Gemini API Key not configured")
        
        api_key = fresh_settings.gemini_api_key
        
        # Combine system instruction with prompt
        full_prompt = prompt
        if self.system_instruction:
            full_prompt = f"{self.system_instruction}\n\n{prompt}"
        
        # Try both v1 and v1beta API versions
        url = f"https://generativelanguage.googleapis.com/v1/models/{self.model_name}:generateContent?key={api_key}"
        
        payload = {
            "contents": [{"parts": [{"text": full_prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.95,
                "maxOutputTokens": 4096,
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            result = response.json()
            
            if "error" in result:
                raise ValueError(f"Gemini API error: {result['error'].get('message', 'Unknown error')}")
            
            response.raise_for_status()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            
            raise ValueError(f"Unexpected Gemini response: {result}")
    
    async def _generate_gemini_json(self, prompt: str) -> Dict[str, Any]:
        """Generate JSON response using Gemini REST API"""
        # Add JSON instruction to prompt
        json_prompt = f"""{prompt}

请严格以 JSON 格式返回结果，不要包含任何其他文字或 markdown 标记。"""
        
        response_text = await self._generate_gemini(json_prompt)
        
        # Clean up response - remove markdown code blocks if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        return json.loads(response_text)
    
    # ============ Chat API ============
    
    async def chat(self, messages: List[Dict], user_message: str) -> str:
        """Chat with the model"""
        try:
            if self.provider == "minimax":
                return await self._chat_minimax(messages, user_message)
            else:
                return await self._chat_gemini(messages, user_message)
        except Exception as e:
            print(f"AI chat error: {e}")
            return self._get_fallback_response(user_message)
    
    async def _chat_minimax(self, history: List[Dict], user_message: str) -> str:
        """Chat using MiniMax API"""
        from app.config import Settings
        fresh_settings = Settings()
        
        if not fresh_settings.minimax_api_key:
            raise ValueError("MiniMax API Key not configured")
        
        api_key = fresh_settings.minimax_api_key
        
        url = "https://api.minimax.chat/v1/text/chatcompletion_v2"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        # Build messages
        messages = []
        if self.system_instruction:
            messages.append({
                "role": "system",
                "content": self.system_instruction
            })
        
        # Add history
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("parts", [{}])[0].get("text", "") if "parts" in msg else msg.get("content", "")
            if role == "model":
                role = "assistant"
            messages.append({
                "role": role,
                "content": content
            })
        
        # Add user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2048,
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            
            raise ValueError(f"Unexpected MiniMax response: {result}")
    
    async def _chat_gemini(self, history: List[Dict], user_message: str) -> str:
        """Chat using Gemini API"""
        import google.generativeai as genai
        
        if not settings.gemini_api_key:
            raise ValueError("Gemini API Key not configured")
        
        genai.configure(api_key=settings.gemini_api_key)
        
        model = genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=self.system_instruction,
        )
        
        # Build contents
        contents = list(history) + [{"role": "user", "parts": [{"text": user_message}]}]
        
        response = await model.generate_content_async(contents)
        return response.text
    
    @abstractmethod
    def _get_fallback_response(self, prompt: str) -> str:
        """Get fallback response when API fails"""
        pass
    
    @abstractmethod
    def _get_fallback_json(self, prompt: str) -> Dict[str, Any]:
        """Get fallback JSON when API fails"""
        pass
