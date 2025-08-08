import requests
import time
import json
import random

OLLA_API_URL = 'http://localhost:11434/v1/chat/completions'
MODEL_NAME = 'qwen2.5:3b'

POST_URL = 'http://localhost:8000/api/v1/new'

PROMPTS = [
    "Write a short test message about AI.",
    "Generate a random sentence about technology.",
    "Give me a funny sentence.",
    "Say something about the future of computers.",
    "Write a motivational quote.",

    "Explain blockchain technology in simple terms.",
    "Describe a futuristic smart city.",
    "Tell a joke about programmers.",
    "Give advice for learning to code efficiently.",
    "Write a positive affirmation for creativity.",

    "Predict how AI will change education.",
    "Describe an exciting invention of the next 10 years.",
    "Share a surprising fact about space exploration.",
    "Write a witty one-liner about coffee.",
    "Give a piece of advice for maintaining mental health.",

    "Describe the impact of renewable energy.",
    "Write a poetic line about technology and nature.",
    "Tell a short story about a robot learning emotions.",
    "Explain quantum computing in layman's terms.",
    "Share an inspirational quote about perseverance.",

    "Write a funny sentence involving a cat and a computer.",
    "Describe the benefits of virtual reality.",
    "Imagine a conversation between AI and humans in 2050.",
    "Give a tip for effective teamwork.",
    "Write a motivational message for starting a new project."
]


def generate_text(prompt):
    headers = {'Content-Type': 'application/json'}
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 512,
        "temperature": 0.7,
    }

    try:
        response = requests.post(OLLA_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        text = data['choices'][0]['message']['content']
        return text.strip()
    except Exception as e:
        print('Error generating text:', e)
        return None


def post_message(tag, channel, content):
    headers = {'Content-Type': 'application/json'}
    data = {
        "tag": tag,
        "channel": channel,
        "content": content
    }
    try:
        resp = requests.post(POST_URL, headers=headers, json=data)
        resp.raise_for_status()
        print(f"Posted message successfully, mid: {resp.json().get('mid')}")
    except Exception as e:
        print('Error posting message:', e)


def main():
    tag = 'auto_test'


    print('Starting generation and posting loop. Press Ctrl+C to stop.')

    try:
        while True:
            channel = random.choice([
                "Logs",
            ])
            prompt = random.choice(PROMPTS)
            prompt = "you can generate some random http logs"
            print(f'Generating text for prompt: "{prompt}"')
            text = generate_text(prompt)
            if text:
                print('Generated:', text)
                post_message(tag, channel, text)
            else:
                print('No text generated.')

            time.sleep(2)
    except KeyboardInterrupt:
        print('\nStopped by user.')


if __name__ == '__main__':
    main()
