import os
from abc import ABC, abstractmethod

class BaseLLMProvider(ABC):
    @abstractmethod
    def chat_generate(self, messages: list[dict]) -> dict:
        pass

class LiteLLMProvider(BaseLLMProvider):
    def chat_generate(self, messages: list[dict]) -> dict:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return {"content": "[MOCK LiteLLM / GPT-4] Refined output generated internally because OPENAI_API_KEY is missing.\n\n" + str(messages), "tokens": 125}
        
        try:
            import litellm
            response = litellm.completion(model="gpt-4o-mini", messages=messages, max_tokens=1500, temperature=0.7)
            content = response.choices[0].message.content.strip()
            # Approximation of token counting if usage not strictly defined natively
            tokens = response.get("usage", {}).get("total_tokens", len(content.split()) * 1.5)
            return {"content": content, "tokens": int(tokens)}
        except Exception as e:
            return {"content": f"[LiteLLM Error]: {str(e)}", "tokens": 0}

class GroqProvider(BaseLLMProvider):
    def chat_generate(self, messages: list[dict]) -> dict:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            return {"content": "[MOCK GROQ / LLaMA 3] High-speed refinement payload generated offline because GROQ_API_KEY is missing.\n\n" + str(messages), "tokens": 80}
        
        try:
            import litellm
            response = litellm.completion(model="groq/llama3-8b-8192", messages=messages, max_tokens=1500, temperature=0.6)
            content = response.choices[0].message.content.strip()
            tokens = response.get("usage", {}).get("total_tokens", len(content.split()) * 1.3)
            return {"content": content, "tokens": int(tokens)}
        except Exception as e:
            return {"content": f"[Groq Error]: {str(e)}", "tokens": 0}

class OllamaProvider(BaseLLMProvider):
    def chat_generate(self, messages: list[dict]) -> dict:
        import requests
        try:
            # We standardize on the OpenAI-compatible /v1/chat/completions endpoint local to Ollama.
            # Alternatively /api/chat. Both absorb standard messages lists.
            resp = requests.post("http://localhost:11434/api/chat", json={
                "model": "llama3",
                "messages": messages,
                "stream": False
            }, timeout=45)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("message", {}).get("content", "")
                tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)
                return {"content": content, "tokens": tokens}
            return {"content": f"[Ollama Error] Local node responded with: {resp.status_code}", "tokens": 0}
        except Exception as e:
            return {"content": f"[Ollama Down] Failed connecting to local Ollama node via /api/chat.\n{str(e)}", "tokens": 0}

class ProviderFactory:
    @staticmethod
    def get_provider(name: str) -> BaseLLMProvider:
        match = name.lower()
        if match == "groq":
            return GroqProvider()
        elif match == "ollama":
            return OllamaProvider()
        else:
            return LiteLLMProvider()
