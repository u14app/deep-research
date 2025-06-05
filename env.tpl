# (Optional) Server API Access Password for enhanced security
ACCESS_PASSWORD=

# (Optional) Server-side Gemini API Key (Required for server API calls)
GOOGLE_GENERATIVE_AI_API_KEY=
# (Optional) Server-side Gemini API Proxy URL. Default, `https://generativelanguage.googleapis.com`
GOOGLE_GENERATIVE_AI_API_BASE_URL=
# (Deprecated) Server-side Gemini API Proxy URL. Default, `https://generativelanguage.googleapis.com`
API_PROXY_BASE_URL=

# (Optional) Server-side OpenRouter API Key (Required for server API calls)
OPENROUTER_API_KEY=
# (Optional) Server-side OpenRouter API Proxy URL. Default, `https://openrouter.ai`
OPENROUTER_API_BASE_URL=

# (Optional) Server-side OpenAI API Key (Required for server API calls)
OPENAI_API_KEY=
# (Optional) Server-side OpenAI API Proxy URL. Default, `https://api.openai.com`
OPENAI_API_BASE_URL=

# (Optional) Server-side Anthropic API Key (Required for server API calls)
ANTHROPIC_API_KEY=
# (Optional) Server-side Anthropic API Proxy URL. Default, `https://api.anthropic.com`
ANTHROPIC_API_BASE_URL=

# (Optional) Server-side DeepSeek API Key (Required for server API calls)
DEEPSEEK_API_KEY=
# (Optional) Server-side DeepSeek API Proxy URL. Default, `https://api.deepseek.com`
DEEPSEEK_API_BASE_URL=

# (Optional) Server-side XAI API Key (Required for server API calls)
XAI_API_KEY=
# (Optional) Server-side XAI API Proxy URL. Default, `https://api.x.ai`
XAI_API_BASE_URL=

# (Optional) Server-side Mistral API Key (Required for server API calls)
MISTRAL_API_KEY=
# (Optional) Server-side Mistral API Proxy URL. Default, `https://api.mistral.ai`
MISTRAL_API_BASE_URL=

# (Optional) Server-side Azure API Key (Required for server API calls)
AZURE_API_KEY=
# (Optional) Server-side Azure Resource Name. The resource name is used in the assembled URL: `https://{AZURE_RESOURCE_NAME}.openai.azure.com/openai/deployments`
AZURE_RESOURCE_NAME=

# (Optional) Server-side Compatible with OpenAI API Key (Required for server API calls)
OPENAI_COMPATIBLE_API_KEY=
# (Optional) Server-side Compatible with OpenAI API Proxy URL.
OPENAI_COMPATIBLE_API_BASE_URL=

# (Optional) Server-side pollinations.ai API Proxy URL. Default, `https://text.pollinations.ai/openai`
POLLINATIONS_API_BASE_URL=

# (Optional) Server-side Ollama API Proxy URL. Default, `http://0.0.0.0:11434`
OLLAMA_API_BASE_URL=

# (Optional) Server-side Tavily API Key (Required for server API calls)
TAVILY_API_KEY=
# (Optional) Server-side Tavily API Proxy URL. Default, `https://api.tavily.com`
TAVILY_API_BASE_URL=

# (Optional) Server-side Firecrawl API Key (Required for server API calls)
FIRECRAWL_API_KEY=
# (Optional) Server-side Firecrawl API Proxy URL. Default, `https://api.firecrawl.dev`
FIRECRAWL_API_BASE_URL=

# (Optional) Server-side Exa API Key (Required for server API calls)
EXA_API_KEY=
# (Optional) Server-side Exa API Proxy URL. Default, `https://api.exa.ai`
EXA_API_BASE_URL=

# (Optional) Server-side Bocha API Key (Required for server API calls)
BOCHA_API_KEY=
# (Optional) Server-side Bocha API Proxy URL. Default, `https://api.bochaai.com`
BOCHA_API_BASE_URL=

# (Optional) Server-side Searxng API Proxy URL. Default, `http://0.0.0.0:8080`
SEARXNG_API_BASE_URL=

# (Optional) MCP Server AI provider
# Possible values ​​include: google, openai, anthropic, deepseek, xai, mistral, azure, openrouter, openaicompatible, pollinations, ollama
MCP_AI_PROVIDER=
# (Optional) MCP Server search provider. Default, `model`
# Possible values ​​include: model, tavily, firecrawl, exa, bocha, searxng
MCP_SEARCH_PROVIDER=
# (Optional) MCP Server thinking model id, the core model used in deep research.
MCP_THINKING_MODEL=
# (Optional) MCP Server task model id, used for secondary tasks, high output models are recommended.
MCP_TASK_MODEL=

# (Optional) Disable server-side AI provider usage permissions
# Possible values ​​include: google, openai, anthropic, deepseek, xai, mistral, azure, openrouter, openaicompatible, pollinations, ollama
NEXT_PUBLIC_DISABLED_AI_PROVIDER=
# (Optional) Disable server-side search provider usage permissions
# Possible values ​​include: model, tavily, firecrawl, exa, bocha, searxng
NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER=
# (Optional) Customize the model list, add or delete models
NEXT_PUBLIC_MODEL_LIST=

# (Optional) Injected script code can be used for statistics or error tracking.
HEAD_SCRIPTS=
