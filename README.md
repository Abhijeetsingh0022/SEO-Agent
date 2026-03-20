# SEO Blog Agent

An advanced, AI-powered internal SEO strategist and blog writing agent built with **Next.js**. It takes a target website URL and autonomously generates high-quality, fully SEO-optimized blog content using a structured, gated 7-step process with live web search capabilities.

![SEO Agent Overview](public/globe.svg)

## Features

- **Dual-Model Support**: Easily toggle between **Anthropic Claude** (`claude-opus-4-5` with `web_search`) and **OpenAI GPT-4o** (`gpt-4o-search-preview` with web search).
- **Agentic Web Search**: The AI actually searches the web to analyze the target site, find competitors, and research live keyword data—reducing hallucinations and ensuring up-to-date content.
- **7-Step Interactive Workflow**:
  1. **Website Analysis**: Analyzes the niche, audience, and existing content.
  2. **Competitor Research**: Browses live competitor sites.
  3. **Topic Generation**: Suggests 10 relevant blog topics.
  4. **Keyword Research**: Identifies primary/secondary keywords and intent.
  5. **Blog Outline**: Creates a detailed structured outline.
  6. **Full Blog Post**: Writes a comprehensive, 1800–2500 word Markdown post.
  7. **SEO Output**: Generates Meta Title, Meta Description, URL Slug, and tags.
- **Real-Time SERP Analytics**: Evaluates search competitors using a custom, 100% free DuckDuckGo HTML scraper (`cheerio`) to pull live ranking data, snippets, and related search queries natively during the keyword research phase, eliminating the need for paid SERP API keys.
- **Focus-Driven UI Enhancements**: Features visually distinct, dynamic matrices for competitor data and refined topic selection inputs.
- **Human-in-the-Loop "Gates"**: The UI pauses for user approval/modification before critical steps (like choosing a topic or approving an outline).
- **Beautiful SaaS UI**: Designed with a premium, light-themed standard SaaS aesthetic featuring fluid animations, Lucide icons, and Plus Jakarta Sans.

---

## Technical Stack
- Framework: Next.js (App Router)
- Frontend: React + Vanilla CSS (No Tailwind)
- Icons: `lucide-react`
- AI SDKs: Native fetch implementation for both Anthropic & OpenAI REST APIs
- Fonts: _Plus Jakarta Sans_ & _Inter_

---

## Installation & Setup

1. **Get the Code & Open Terminal**:
   - **Mac/Linux**: Open your Terminal.
   - **Windows**: Open Command Prompt (`cmd`), PowerShell, or Git Bash.
   
   Clone the repository:
   ```bash
   git clone <your-repository-url> seo-agent
   cd seo-agent
   ```
   *(If you downloaded the `.zip` file instead, right-click and extract it, then open your terminal and `cd path\to\seo-agent`).*

2. **Install dependencies**:
   In your terminal, run the exact same command on both Mac and Windows:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   # Add Anthropic API Key for Claude models
   ANTHROPIC_API_KEY=sk-ant-api03-...

   # Add OpenAI API Key for GPT-4o
   OPENAI_API_KEY=sk-proj-...
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use the Agent

1. **Enter a Target URL**: On the home page, select your preferred AI model (Claude or GPT-4o) and enter the website URL you want to write content for.
2. **Phase 1 (Analysis)**: The AI will use web search to analyze your site and top competitors.
3. **Phase 2 (Ideation - Gate 1)**: The AI generates 10 topic ideas. **Action Required**: The app will pause. You must review the list, type your chosen topic (or a custom one), and submit it to proceed.
4. **Phase 3 (Outlining - Gate 2)**: The AI performs keyword research and builds a detailed blog outline. **Action Required**: Review the outline. You can approve it by typing "Looks good", or request changes (e.g., "Add a section on pricing").
5. **Phase 4 (Generation)**: The AI writes the full, formatted 2000+ word blog post and generates final SEO metadata (Title, Description, URL Slug).
6. **Export**: Once complete, use the **Copy All Content** or **Download as Markdown** buttons at the bottom of the page to export your SEO-ready post directly to your CMS!

---

## Architecture

- **`app/api/seo/route.js`**: The Next.js API route that handles secure communication with the LLM providers. It includes a custom loop for Anthropic to handle tool use (`web_search`).
- **`hooks/useSEOWorkflow.js`**: The brains of the frontend. Manages the 7-step sequence, maintains conversation state, handles user gate inputs, and automatically advances steps.
- **`components/`**: Reusable UI blocks including `HeroSection`, `StepCard`, `StepTracker`, and a custom markdown generator.
- **`lib/constants.js`**: Stores the system prompt and the hardcoded AI instructions for each of the 7 steps.

---

### License
This tool is built for internal, autonomous SEO operations. 
