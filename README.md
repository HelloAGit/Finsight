# Finsight Video Agent

A conversational financial video agent powered by Google Gemini and OpenAI.

> **Disclaimer:** This is an educational financial analysis application, not a regulated financial advisory service. Nothing it produces is financial, investment, tax, or legal advice.

## Project objective

A lightweight financial assistant that allows users to:

- Enter business financial information through a form.
- Ask questions using text or speech.
- Enable their webcam with explicit consent.
- Capture and analyse a webcam frame using Google Gemini.
- Generate financial explanations and recommendations using OpenAI.
- Receive spoken responses from the assistant.
- View calculated financial metrics in a modern financial dashboard.

## Configuration

This project requires two API keys:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Financial explanations and recommendations (OpenAI) |
| `GEMINI_API_KEY` | Webcam frame analysis (Google Gemini) |

Setup:

1. Copy the template: `cp .env.example .env`
2. Fill in your keys in `.env`.
3. Never commit `.env` (it is listed in `.gitignore`).

Get keys from [OpenAI](https://platform.openai.com/api-keys) and [Google AI Studio](https://aistudio.google.com/app/apikey).

## Privacy

The webcam is only enabled after explicit user consent. Frames are captured on demand and sent to Gemini for analysis only.

## License

See [LICENSE](LICENSE).
