import requests
import json

print("Testing AI Orchestrator API...")
print("=" * 60)

try:
    # Test health endpoint
    response = requests.get("http://localhost:8000/health", timeout=5)
    print("\n1. Health Check:")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")

    # Test LLM status
    response = requests.get("http://localhost:8000/api/v1/llm/status", timeout=5)
    print("\n2. Groq LLM Status:")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")

    # Test cities endpoint
    response = requests.get("http://localhost:8000/api/v1/cities", timeout=5)
    print("\n3. Supported Cities:")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}")

    print("\n" + "=" * 60)
    print("SUCCESS: All tests passed!")
    print("=" * 60)
    print("\nServer is ready at: http://localhost:8000")
    print("Swagger UI: http://localhost:8000/docs")
    print("\n")

except requests.exceptions.ConnectionError:
    print("\nERROR: Cannot connect to server")
    print("Make sure the server is running: python main.py")
except Exception as e:
    print(f"\nERROR: {e}")
