#!/usr/bin/env python3
"""
Test script to check available realtime models
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print(f"Using API key: {OPENAI_API_KEY[:20]}...")
print()

client = OpenAI(api_key=OPENAI_API_KEY)

# Try to create a realtime session with different models
models_to_try = [
    'gpt-4o-realtime-preview-2024-12-19',
    'gpt-4o-realtime-preview',
    'gpt-4-turbo',
    'gpt-4o',
]

for model in models_to_try:
    print(f"Trying model: {model}...")
    try:
        response = client.beta.realtime.sessions.create(
            model=model,
            modalities=['audio', 'text'],
        )
        print(f"SUCCESS with {model}!")
        print(f"   Session ID: {response.id}")
        print(f"   Model: {response.model}")
        print()
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "not found" in error_msg:
            print(f"Model not found: {model}")
        else:
            print(f"Error: {error_msg[:100]}")
        print()
