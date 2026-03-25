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
          <div className="serp-meta-labels">
            {data.mock && (
              <span className="serp-mock-badge">
                Developer Sandbox
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="serp-grid" style={{ marginTop: '10px' }}>
        {/* Top Organic Results */}
        <div className="serp-panel">
          <h4 className="serp-panel-title">
            <TrendingUp size={14} style={{ color: "var(--green)" }} />
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
