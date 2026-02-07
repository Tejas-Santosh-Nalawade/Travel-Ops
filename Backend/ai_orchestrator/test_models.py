#!/usr/bin/env python3
"""
Model Comparison Tool
Test different Groq models side-by-side to find the best fit
"""
import asyncio
import time
from groq import Groq
from config import settings

# Test models
MODELS_TO_TEST = [
    "mixtral-8x7b-32768",
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
]

# Test prompt
TEST_PROMPT = """You are a travel planner. Recommend transport from Pune to Mumbai (150km).
Budget: ₹10,000, Travelers: 2, Preference: balanced

Respond in JSON:
{
    "mode": "TRAIN/FLIGHT/BUS",
    "cost": 2400,
    "reasoning": "brief explanation"
}"""


async def test_model(model_name: str, client: Groq):
    """Test a single model"""
    print(f"\n{'='*60}")
    print(f"Testing: {model_name}")
    print(f"{'='*60}")

    try:
        start_time = time.time()

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a travel expert. Respond with JSON only."},
                {"role": "user", "content": TEST_PROMPT}
            ],
            temperature=0.3,
            max_tokens=300
        )

        end_time = time.time()
        duration = end_time - start_time

        result = response.choices[0].message.content
        tokens_used = response.usage.total_tokens

        # Extract JSON
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0].strip()
        elif "```" in result:
            result = result.split("```")[1].split("```")[0].strip()

        print(f"\n⏱️  Response Time: {duration:.2f}s")
        print(f"🔢 Tokens Used: {tokens_used}")
        print(f"\n📝 Response:")
        print(result)

        # Quality score (simple heuristic)
        quality_score = 0
        if "reasoning" in result.lower() and len(result) > 50:
            quality_score += 3
        if duration < 1.5:
            quality_score += 2
        if tokens_used < 200:
            quality_score += 1

        print(f"\n⭐ Score: {quality_score}/6")

        return {
            "model": model_name,
            "time": duration,
            "tokens": tokens_used,
            "quality": quality_score,
            "response": result
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "model": model_name,
            "time": 999,
            "tokens": 0,
            "quality": 0,
            "error": str(e)
        }


async def main():
    """Run comparison"""
    print("\n" + "="*60)
    print("🤖 GROQ MODEL COMPARISON FOR TRAVEL AI")
    print("="*60)

    if not settings.GROQ_API_KEY:
        print("\n❌ Error: GROQ_API_KEY not set in config.py")
        return

    client = Groq(api_key=settings.GROQ_API_KEY)

    results = []
    for model in MODELS_TO_TEST:
        result = await test_model(model, client)
        results.append(result)
        await asyncio.sleep(1)  # Rate limiting

    # Summary
    print("\n\n" + "="*60)
    print("📊 COMPARISON SUMMARY")
    print("="*60)

    print(f"\n{'Model':<30} {'Time':<10} {'Tokens':<10} {'Score'}")
    print("-" * 60)

    for r in results:
        if "error" not in r:
            print(f"{r['model']:<30} {r['time']:.2f}s      {r['tokens']:<10} {r['quality']}/6")
        else:
            print(f"{r['model']:<30} ERROR")

    # Recommendation
    print("\n" + "="*60)
    print("🎯 RECOMMENDATION")
    print("="*60)

    fastest = min(results, key=lambda x: x.get('time', 999))
    best_quality = max(results, key=lambda x: x.get('quality', 0))

    print(f"\n⚡ Fastest: {fastest['model']} ({fastest['time']:.2f}s)")
    print(f"🧠 Best Quality: {best_quality['model']} (Score: {best_quality['quality']}/6)")

    # Find balanced
    balanced = None
    best_balance_score = 0
    for r in results:
        if "error" not in r:
            # Balance score: quality * speed factor
            speed_factor = 2 / (r['time'] + 1)  # Faster = higher
            balance = r['quality'] * speed_factor
            if balance > best_balance_score:
                best_balance_score = balance
                balanced = r

    if balanced:
        print(f"\n⚖️  Most Balanced: {balanced['model']}")
        print(f"   - Speed: {balanced['time']:.2f}s")
        print(f"   - Quality: {balanced['quality']}/6")
        print(f"   - Balance Score: {best_balance_score:.2f}")

    print("\n" + "="*60)
    print("✅ Current Model: " + settings.GROQ_MODEL)
    print("="*60)

    if balanced and balanced['model'] == settings.GROQ_MODEL:
        print("\n🎉 Your current model is OPTIMAL! ✅")
    else:
        print(f"\n💡 Consider switching to: {balanced['model'] if balanced else 'N/A'}")

    print("\n📚 See MODEL_SELECTION.md for detailed analysis")
    print()


if __name__ == "__main__":
    asyncio.run(main())
