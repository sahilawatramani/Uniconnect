import json
import os
from urllib import error, request

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))


def get_llm_response(prompt: str) -> str:
    """Get a response from the local Ollama model."""
    payload = json.dumps(
        {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        }
    ).encode("utf-8")

    req = request.Request(
        f"{OLLAMA_BASE_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=OLLAMA_TIMEOUT) as response:
            body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Ollama returned HTTP {exc.code}: {details or exc.reason}") from exc
    except error.URLError as exc:
        raise RuntimeError(
            "Could not reach Ollama. Make sure the Ollama app is running and "
            f"serving at {OLLAMA_BASE_URL}."
        ) from exc

    text = (body.get("response") or "").strip()
    if not text:
        raise RuntimeError(f"Ollama returned an empty response: {body}")

    return text


def get_gemini_response(prompt: str) -> str:
    """Backward-compatible alias used by the route modules."""
    return get_llm_response(prompt)
