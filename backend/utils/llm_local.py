import subprocess

def ask_ollama(prompt: str, model: str = "llama3.2") -> str:
    try:
        completed_process = subprocess.run(
            ["ollama", "run", model],
            input=prompt,
            capture_output=True,
            text=True,
            check=True,
        )
        return completed_process.stdout.strip()
    except Exception as e:
        return f"Erreur Ollama : {str(e)}"
