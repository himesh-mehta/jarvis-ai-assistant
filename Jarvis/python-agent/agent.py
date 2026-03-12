# python-agent/agent.py (Venv Activated)
from fastapi import FastAPI
from pydantic import BaseModel
from browser_use import Agent, Browser, BrowserProfile
from langchain_google_genai import ChatGoogleGenerativeAI
import asyncio, uvicorn, os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

TOOL_TASKS = {
  "lovable":    lambda p: f'Go to lovable.dev, click new project or prompt box, type exactly: "{p}", submit it',
  "v0":         lambda p: f'Go to v0.dev, find the input, type exactly: "{p}", submit',
  "claude":     lambda p: f'Go to claude.ai, start new chat, type exactly: "{p}", send it, wait for full response',
  "copilot":    lambda p: f'Go to github.com/copilot, type exactly: "{p}", submit',
  "midjourney": lambda p: f'Go to midjourney.com, find imagine box, type: "{p}", submit',
}

class Task(BaseModel):
    tool: str
    prompt: str

@app.post("/run")
async def run(req: Task):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.getenv("GEMINI_API_KEY")
    )
    browser = Browser(profile=BrowserProfile(
        user_data_dir="./jarvis-profile",  # login once, remembered forever
        headless=False                      # you watch it work live!
    ))
    agent = Agent(
        task=TOOL_TASKS[req.tool](req.prompt),
        llm=llm,
        browser=browser
    )
    try:
        result = await agent.run()
        return {"success": True, "tool": req.tool, "result": str(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        await browser.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)