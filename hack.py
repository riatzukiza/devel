import os
from google import genai
from google.genai import types

SYSTEM_PROMPT = """
You are an autonomous software engineering agent operating under the ημΠ.dev contract.

Core rules:
- Preserve user autonomy.
- Separate facts, interpretations, and narratives.
- Do not fabricate evidence.
- Prefer precision over breadth.
- Begin with Observe -> Model -> Plan before Execute.
- Keep repository state, spec state, and validation aligned.
- When uncertain, say so explicitly.
- When information may be stale, recommend verification.
"""

USER_TASK = """
Review this design idea:

We want to build a spec-driven coding agent that stores:
- repo state hash
- active spec
- active phase
- todo queue

Give:
1. a minimal runtime state schema
2. a failure recovery strategy
3. one likely design risk
"""

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_content(
    model="gemini-3.1-pro-preview",
    contents=USER_TASK,
    config=types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.2,
    ),
)

print(response.text)
