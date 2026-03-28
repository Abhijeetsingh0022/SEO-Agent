# SEO Blog Agent

An advanced, AI-powered internal SEO strategist and blog writing agent built with **Next.js**. Paste any website URL and the agent autonomously researches, strategizes, and writes a fully SEO-optimized blog post — without a single paid API for search data.

> **Key Metrics at a Glance**
> - 📝 Generates **1,800–2,500 word** blog posts per run
> - 🔍 Scrapes **live SERP data** via DuckDuckGo (0 cost)
> - ⚙️ **7-step gated workflow** with human-in-the-loop checkpoints
> - 🤖 **2 AI models** supported (Claude & GPT-4o)
> - 📊 Outputs **4 SEO deliverables**: Meta Title, Meta Description, URL Slug, Tags

***

## Features

### 🤖 Dual-Model AI Engine
Toggle between two state-of-the-art models depending on your use case:
- **Anthropic Claude** (`claude-opus-4-5`) with native `web_search` tool
- **OpenAI GPT-4o** (`gpt-4o-search-preview`) with integrated web search

### 🔎 Agentic Web Search (No Hallucinations)
The agent doesn't rely on training data alone — it actively browses the web to analyze your target site, research live competitors, and validate keyword opportunities in real time.

### 📊 Free Real-Time SERP Analytics
A custom DuckDuckGo HTML scraper powered by `cheerio` pulls live ranking data, competitor snippets, and related search queries natively — **no paid SERP API keys required**.

### 🚦 7-Step Interactive Workflow

| Step | Action | Output |
|------|--------|--------|
| 1 | **Website Analysis** | Niche, audience, content gaps |
| 2 | **Competitor Research** | Live competitor site audit |
| 3 | **Topic Generation** | 10 targeted blog topic ideas |
| 4 | **Keyword Research** | Primary/secondary keywords + intent mapping |
| 5 | **Blog Outline** | Structured H2/H3 content blueprint |
| 6 | **Full Blog Post** | 1,800–2,500 word Markdown article |
| 7 | **SEO Output** | Meta title, description, slug, tags |

### 🎛️ Human-in-the-Loop Gates
The UI pauses at critical decision points — topic selection, outline approval — so you stay in control without micromanaging every step.

### 🎨 Premium SaaS UI
Built with a clean, light-themed aesthetic using **Plus Jakarta Sans**, fluid animations, and **Lucide icons** — zero Tailwind, pure CSS craftsmanship.

***

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Frontend | React + Vanilla CSS |
| Icons | `lucide-react` |
| Web Scraping | `cheerio` (DuckDuckGo HTML) |
| AI Integration | Native `fetch` → Anthropic & OpenAI REST APIs |
| Fonts | Plus Jakarta Sans, Inter |

***

## Installation & Setup

### Prerequisites
- Node.js **v18+**
- An **Anthropic** and/or **OpenAI** API key

### 1. Clone the Repository
```bash
git clone https://github.com/Abhijeetsingh0022/SEO-Agent.git seo-agent
cd seo-agent
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Anthropic API Key (for Claude models)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI API Key (for GPT-4o)
OPENAI_API_KEY=sk-proj-...
```
> You only need **one** key to get started. The UI lets you toggle between models.

### 4. Start the Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

***

## How to Use

1. **Enter your target website URL** in the input field and select your preferred AI model
2. **Approve or refine** the website analysis summary before proceeding
3. **Review competitor insights** pulled from live SERP data
4. **Select one of 10 generated topics** or customize your own
5. **Review and edit keyword strategy** before outline generation
6. **Approve the blog outline** — add, remove, or restructure sections
7. **Receive your complete blog post** with all SEO metadata ready to publish

***

## Project Structure

```
seo-agent/
├── app/
│   ├── api/          # Route handlers for each workflow step
│   ├── components/   # UI components (StepCard, Matrix, TopicSelector)
│   └── page.js       # Main agent interface
├── public/
├── .env.local        # Your API keys (not committed)
└── package.json
```

***

## Roadmap

- [ ] WordPress / Webflow direct publish integration
- [ ] Export to `.md` and `.docx` formats
- [ ] Multi-language blog generation
- [ ] Keyword difficulty scoring via open datasets
- [ ] Saved session history & project management

***

## License

MIT © [Abhijeet Singh](https://github.com/Abhijeetsingh0022)

***

Would you like me to also add a **demo GIF/screenshot section**, a **contributing guide**, or adjust the tone to be more developer-focused vs. marketer-friendly?
