import os
from groq import Groq


def ask(question, summary):
    context = f"Summary of the user's last CSV upload: {summary}" if summary else "No CSV has been uploaded yet."
    r = Groq(api_key=os.getenv("GROQ_API_KEY")).chat.completions.create(
        model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
        messages=[
            {"role": "system", "content": "You are the assistant inside NetShield, an ML network intrusion detection dashboard. "
                                          "Answer in at most four sentences. Use only the data given and general security knowledge. " + context},
            {"role": "user", "content": question},
        ],
        max_tokens=800,
    )
    return r.choices[0].message.content