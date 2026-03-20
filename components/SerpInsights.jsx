import { Search, Link as LinkIcon, HelpCircle, TrendingUp, BarChart, Target, Zap, Activity, ShieldCheck, Trophy } from "lucide-react";

export default function SerpInsights({ data }) {
  if (!data || (!data.organic && !data.relatedSearches)) return null;

  // Estimate Intent from results if not provided
  const hasCommercial = data.organic?.some(i => i.title.toLowerCase().includes('best') || i.title.toLowerCase().includes('vs'));
  const intent = hasCommercial ? "Commercial Research" : "Informational";

  return (
    <div className="serp-insights advanced-serp">
      <div className="serp-header">
        <div className="serp-header-icon">
          <Search size={16} strokeWidth={2.5} />
        </div>
        <div className="serp-header-text">
          <h3 className="serp-title">Advanced Search Intelligence</h3>
          <div className="serp-meta-labels">
            <span className="serp-intent-badge">
              <Target size={10} /> {intent}
            </span>
            {data.mock && (
              <span className="serp-mock-badge">
                Developer Sandbox
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="serp-advanced-stats">
        <div className="serp-stat">
          <div className="serp-stat-icon-wrap bg-amber-dim text-amber">
            <Zap size={13} strokeWidth={2.5} />
          </div>
          <div className="serp-stat-body">
            <span className="serp-stat-label">Difficulty</span>
            <span className="serp-stat-val">Low-Medium</span>
          </div>
        </div>
        <div className="serp-stat">
          <div className="serp-stat-icon-wrap bg-emerald-dim text-emerald">
            <ShieldCheck size={13} strokeWidth={2.5} />
          </div>
          <div className="serp-stat-body">
            <span className="serp-stat-label">Stability</span>
            <span className="serp-stat-val">High</span>
          </div>
        </div>
        <div className="serp-stat">
          <div className="serp-stat-icon-wrap bg-blue-dim text-blue">
            <Trophy size={13} strokeWidth={2.5} />
          </div>
          <div className="serp-stat-body">
            <span className="serp-stat-label">Organic Potential</span>
            <span className="serp-stat-val">Exceptional</span>
          </div>
        </div>
      </div>

      <div className="serp-grid">
        {/* Top Organic Results */}
        <div className="serp-panel">
          <h4 className="serp-panel-title">
            <TrendingUp size={14} style={{ color: "var(--green)" }} />
            SERP Ranking Landscape
          </h4>
          <ul className="serp-org-list">
            {data.organic?.slice(0, 3).map((item, i) => (
              <li key={i} className="serp-org-item">
                <div className="serp-rank-num">{i + 1}</div>
                <div className="serp-result-content">
                  <a href={item.link} target="_blank" rel="noreferrer" className="serp-link">
                    {item.title}
                  </a>
                  <p className="serp-snippet">{item.snippet}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Intelligence Stack */}
        <div className="serp-col-stack">
          {data.peopleAlsoAsk && data.peopleAlsoAsk.length > 0 && (
            <div className="serp-panel">
              <h4 className="serp-panel-title">
                <HelpCircle size={14} style={{ color: "var(--brand)" }} />
                PAA Discovery (Featured Snippet)
              </h4>
              <ul className="serp-paa-list">
                {data.peopleAlsoAsk.slice(0, 3).map((item, i) => (
                  <li key={i} className="serp-paa-item">
                    {item.question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.relatedSearches && data.relatedSearches.length > 0 && (
            <div className="serp-panel">
              <h4 className="serp-panel-title">
                <LinkIcon size={14} style={{ color: "var(--blue)" }} />
                Semantic Neighbors (LSIs)
              </h4>
              <div className="serp-tag-cloud">
                {data.relatedSearches.slice(0, 6).map((item, i) => (
                  <span key={i} className="serp-tag">
                    {item.query}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
