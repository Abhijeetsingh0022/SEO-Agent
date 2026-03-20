import { Search, Link as LinkIcon, HelpCircle, TrendingUp } from "lucide-react";

export default function SerpInsights({ data }) {
  if (!data || (!data.organic && !data.relatedSearches)) return null;

  return (
    <div className="serp-insights">
      <div className="serp-header">
        <div className="serp-header-icon">
          <Search size={16} strokeWidth={2.5} />
        </div>
        <h3 className="serp-title">Live SERP Analytics</h3>
        {data.mock && (
          <span className="serp-mock-badge">
            Mock Data (Add API Key)
          </span>
        )}
      </div>

      <div className="serp-grid">
        {/* Top Organic Results */}
        <div className="serp-panel">
          <h4 className="serp-panel-title">
            <TrendingUp size={14} style={{ color: "var(--green)" }} />
            Top Ranking Competitors
          </h4>
          <ul className="serp-org-list">
            {data.organic?.slice(0, 3).map((item, i) => (
              <li key={i} className="serp-org-item">
                <a href={item.link} target="_blank" rel="noreferrer" className="serp-link">
                  {i + 1}. {item.title}
                </a>
                <p className="serp-snippet">{item.snippet}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* PAA / Related */}
        <div className="serp-col-stack">
          {data.peopleAlsoAsk && data.peopleAlsoAsk.length > 0 && (
            <div className="serp-panel">
              <h4 className="serp-panel-title">
                <HelpCircle size={14} style={{ color: "var(--brand)" }} />
                People Also Ask
              </h4>
              <ul className="serp-paa-list">
                {data.peopleAlsoAsk.slice(0, 3).map((item, i) => (
                  <li key={i} className="serp-paa-item">
                    "{item.question}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.relatedSearches && data.relatedSearches.length > 0 && (
            <div className="serp-panel">
              <h4 className="serp-panel-title">
                <LinkIcon size={14} style={{ color: "var(--blue)" }} />
                Related Queries
              </h4>
              <div className="serp-tag-cloud">
                {data.relatedSearches.slice(0, 5).map((item, i) => (
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
