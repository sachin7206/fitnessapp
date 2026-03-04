# AI Service Architecture

## Overview
The AI Service is a centralized microservice that handles all AI/ML operations in the FitnessApp.
It uses the **Google Gemini SDK** (`com.google.genai:google-genai`) to interact with Google's Generative AI models.

## Port: 8086

## Module Structure
```
ai-service/
├── ai-service-common/     # DTOs, interfaces (shared by SAL clients)
├── ai-service-rest/       # REST controllers + OpenAPI spec
├── ai-service-sal/        # SAL client library (used by other services)
└── ai-service-impl/       # Service implementation + Gemini SDK integration
```

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/nutrition/generate-plan` | Generate AI nutrition meal plan |
| POST | `/ai/nutrition/estimate-macros` | Estimate food macros from text |
| POST | `/ai/workout/generate-plan` | Generate AI workout exercises |
| GET  | `/ai/workout/motivational-quote` | Generate motivational quote |
| POST | `/ai/wellness/generate-plan` | Generate AI wellness plan |
| POST | `/ai/text/generate` | Generic text generation |
| GET  | `/ai/health` | Health check with AI availability |

## Configuration
All Gemini configuration is centralized in `application.yml`:
- `GEMINI_API_KEYS` - Comma-separated API keys (rotation on 429)
- `GEMINI_MODEL` - Model name (e.g., `gemma-3-27b-it`)

## Service Communication
Other services call AI Service via the **SAL (Service Abstraction Layer)** pattern:
1. Add `com.fitnessapp:ai-service-sal:1.0.0` dependency
2. Configure `AiServiceSalClient` bean with load-balanced RestTemplate
3. Call methods like `aiServiceSalClient.generateNutritionPlan(request)`

## Consuming Services
- **nutrition-service** → nutrition plan generation, macro estimation
- **exercise-service** → workout plan generation, motivational quotes
- **wellness-service** → wellness/yoga plan generation

## Class Diagram
```
AiController (REST)
    └── AiOperations (interface)
            └── AiService (implementation)
                    └── GeminiClientService (Gemini SDK wrapper)
                            └── GeminiConfig (API keys, model, timeouts)
```

## No Database Required
This is a stateless proxy service. No database is needed.

