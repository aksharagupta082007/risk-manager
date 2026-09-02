import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("HUGGINGFACE_API_KEY")
print(f"Loaded key: {'Yes' if api_key else 'No'}")

url = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct"
headers = {"Authorization": f"Bearer {api_key}"}
payload = {"inputs": "Hello", "parameters": {"max_new_tokens": 10}}
resp = requests.post(url, headers=headers, json=payload, timeout=10)
print(f"Status Code: {resp.status_code}")
print(f"Response: {resp.text}")
