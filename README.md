Here's a more detailed, professional version with improved structure, badges, and richer descriptions:

SEO Blog Agent
<div align="center">

An autonomous, AI-powered SEO strategist and blog writing agent.
Drop in any website URL — the agent researches, strategizes, and delivers a publication-ready, fully optimized blog post. No paid SERP APIs. No manual research. No fluff.

🚀 Quick Start · 📖 How It Works · 🗺️ Roadmap · 🐛 Issues

</div>

📊 Key Metrics
Metric	Value
Blog post length	1,800–2,500 words per run
Workflow steps	7 gated stages
AI models supported	2 (Claude & GPT-4o)
SEO deliverables per post	4 (Title, Description, Slug, Tags)
SERP data cost	$0 (custom DuckDuckGo scraper)
Human-in-the-loop checkpoints	3 (topic, outline, final review)
✨ Features
🤖 Dual-Model AI Engine
Choose the model that fits your workflow without changing any code. Toggle between:

Anthropic Claude (claude-opus-4-5) — leverages the native web_search tool for deep, grounded research

OpenAI GPT-4o (gpt-4o-search-preview) — integrated web search with broad reasoning capability

Both models are implemented via native REST API fetch calls — no bloated SDK wrappers.

🔎 Agentic Web Search — Grounded in Reality
Unlike prompt-only agents that hallucinate outdated facts, this agent actively browses the web at runtime to:

Audit your target website's content, tone, and niche

Identify and analyze real competitor pages

Validate keyword relevance against live search results

📊 Free Real-Time SERP Analytics
A custom-built DuckDuckGo HTML scraper powered by cheerio replaces paid SERP tools entirely. It pulls:

Live search rankings for target keywords

Competitor page snippets and metadata

Related search queries for semantic keyword expansion

Zero API keys. Zero monthly fees. 100% operational.

🚦 7-Step Gated Workflow
Step	Stage	What Happens	Output
1	Website Analysis	AI audits your site's niche, tone, audience, and content gaps	Strategic site profile
2	Competitor Research	Browses top-ranking competitor pages live	Competitive intelligence matrix
3	Topic Generation	Proposes 10 data-backed blog topics aligned to your audience	Curated topic list
4	Keyword Research	Maps primary/secondary keywords with search intent	Keyword + intent table
5	Blog Outline	Builds a structured H2/H3 content blueprint	Editable outline
6	Full Blog Post	Writes a 1,800–2,500 word Markdown article	Publication-ready post
7	SEO Output	Packages all on-page SEO metadata	Meta title, description, slug, tags
🎛️ Human-in-the-Loop Control Gates
The agent pauses at three critical decision points before proceeding, letting you:

Swap or customize the selected blog topic

Edit the outline structure before writing begins

Review and approve the final post before SEO packaging

You get the speed of AI with the judgment of a human editor.

🎨 Premium SaaS UI
No utility-class frameworks — every pixel is hand-crafted in Vanilla CSS:

Light-themed, distraction-free writing environment

Fluid step-transition animations

Dynamic competitor data matrix with visual hierarchy

Plus Jakarta Sans for headings, Inter for body text

Lucide icons throughout for a consistent, modern icon language

🛠️ Technical Stack
Layer	Technology	Purpose
Framework	Next.js 15 (App Router)	Full-stack React with API routes
Frontend	React 18 + Vanilla CSS	UI rendering, no Tailwind dependency
Icons	lucide-react	Consistent icon system
Web Scraping	cheerio	DuckDuckGo HTML parsing for SERP data
AI — Claude	Anthropic REST API	claude-opus-4-5 with web_search
AI — OpenAI	OpenAI REST API	gpt-4o-search-preview with search
Fonts	Plus Jakarta Sans, Inter	Google Fonts via Next.js font optimization
Environment	.env.local	Secure API key management
⚙️ Installation & Setup
Prerequisites
Before you begin, ensure you have:

Node.js v18+ installed (download here)

At least one API key — either Anthropic or OpenAI

1. Clone the Repository
bash
git clone https://github.com/Abhijeetsingh0022/SEO-Agent.git seo-agent
cd seo-agent
2. Install Dependencies
bash
npm install
3. Configure Environment Variables
Create a .env.local file in the project root directory:

text
# Required for Claude models
ANTHROPIC_API_KEY=sk-ant-api03-...

# Required for GPT-4o models
OPENAI_API_KEY=sk-proj-...
Note: You only need one key to get started. The UI model toggle will disable unavailable options automatically.

4. Start the Development Server
bash
npm run dev
Open http://localhost:3000 in your browser. The agent interface will load immediately.

🚀 How to Use
Enter your target website URL — paste the URL of the site you're creating content for and choose your AI model

Review the site analysis — the agent profiles your niche, tone, and audience; edit before continuing

Examine competitor insights — review live data on who's ranking and why

Choose your topic — pick from 10 AI-generated suggestions or type your own

Refine keyword strategy — review primary/secondary keywords and adjust intent targeting

Approve the outline — restructure, add, or remove sections before writing begins

Receive your complete post — get the full Markdown article plus all SEO metadata, ready to publish

📁 Project Structure
text
seo-agent/
├── app/
│   ├── api/                    # Next.js route handlers (one per workflow step)
│   │   ├── analyze/            # Step 1: Website analysis
│   │   ├── competitors/        # Step 2: Competitor research
│   │   ├── topics/             # Step 3: Topic generation
│   │   ├── keywords/           # Step 4: Keyword research + SERP scraping
│   │   ├── outline/            # Step 5: Blog outline
│   │   ├── blog/               # Step 6: Full blog post generation
│   │   └── seo/                # Step 7: SEO metadata output
│   ├── components/             # Reusable UI components
│   │   ├── StepCard/           # Individual workflow step wrapper
│   │   ├── Matrix/             # Competitor data visualization
│   │   └── TopicSelector/      # Topic selection input UI
│   ├── globals.css             # Global styles and design tokens
│   └── page.js                 # Root agent interface and state management
├── public/                     # Static assets
├── .env.local                  # API keys (gitignored)
├── next.config.js              # Next.js configuration
└── package.json
🗺️ Roadmap
CMS Publishing — Direct publish to WordPress, Webflow, and Ghost

Export Formats — Download posts as .md, .docx, or .html

Multi-Language Support — Generate blog posts in 10+ languages

Keyword Difficulty Scoring — Integrate open-source difficulty datasets

Session History — Save, revisit, and manage past blog projects

Bulk Mode — Queue multiple URLs for batch blog generation

Internal Linking Suggestions — Auto-suggest links from your existing content

🤝 Contributing
Contributions are welcome! To get started:

Fork the repository

Create a feature branch: git checkout -b feature/your-feature-name

Commit your changes: git commit -m 'feat: add your feature'

Push to your branch: git push origin feature/your-feature-name

Open a Pull Request

Please follow Conventional Commits for commit messages.

📄 License
MIT © 2026 Abhijeet Singh

<div align="center">
<sub>Built with ☕ and an unhealthy obsession with SEO by Abhijeet Singh</sub>
</div>

