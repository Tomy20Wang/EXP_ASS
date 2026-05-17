import type { FeatureDefinition, FeatureCategory } from "../features/catalog";
import { categoryMeta } from "../features/catalog";

interface TreeGroup {
  name: string;
  features: FeatureDefinition[];
}

interface TreeSection {
  category: FeatureCategory;
  groups: TreeGroup[];
}

interface FeatureSidebarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  suggestions: FeatureDefinition[];
  sections: TreeSection[];
  expandedCategory: FeatureCategory;
  onCategorySelect: (category: FeatureCategory) => void;
  activeFeatureId: string;
  onFeatureSelect: (feature: FeatureDefinition) => void;
}

export function FeatureSidebar({
  searchQuery,
  onSearchQueryChange,
  suggestions,
  sections,
  expandedCategory,
  onCategorySelect,
  activeFeatureId,
  onFeatureSelect
}: FeatureSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <p className="sidebar-brand-label">EXP_ASS</p>
        <h1>Open EXP_ASS</h1>
        <p className="brand-copy">
          Search or browse the tool tree to open a workspace on the right.
        </p>
      </div>

      <div className="sidebar-projects">
        <p className="sidebar-section-label">Project</p>
        <button className="project-item" type="button">
          <span className="project-item-name">EXP_ASS</span>
          <span className="project-item-badge">Toolkit</span>
        </button>
      </div>

      <div className="sidebar-card search-panel">
        <label className="search-label sidebar-section-label" htmlFor="tool-search">
          Quick Search
        </label>

        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">
            /
          </span>
          <input
            id="tool-search"
            className="search-input"
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Try: video resize, image, aspect ratio..."
          />
        </div>

        <p className="search-helper">
          Search suggestions stay independent from the tree below.
        </p>

        <div className="search-results">
          <p className="search-results-label">Suggestions</p>
          {searchQuery.trim() ? (
            suggestions.length > 0 ? (
              <div className="suggestion-list">
                {suggestions.map((feature) => (
                  <button
                    key={feature.id}
                    className="suggestion-item"
                    type="button"
                    onClick={() => onFeatureSelect(feature)}
                  >
                    <span className="suggestion-title">{feature.title}</span>
                    <span className="suggestion-meta">
                      {categoryMeta[feature.category].label} / {feature.group}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No tools matched this search yet.</p>
            )
          ) : (
            <p className="empty-copy">Type a keyword to show matching tools.</p>
          )}
        </div>
      </div>

      <div className="sidebar-card tree-panel">
        <p className="tree-label sidebar-section-label">Tool Tree</p>

        {sections.map((section) => (
          <section key={section.category} className="tree-section">
            <button
              className="tree-category-button"
              data-active={expandedCategory === section.category || undefined}
              type="button"
              onClick={() => onCategorySelect(section.category)}
            >
              <div className="tree-category-meta">
                <span className="tree-category-pill">{categoryMeta[section.category].accent}</span>
                <div className="tree-category-copy-block">
                  <h2>{categoryMeta[section.category].label}</h2>
                  <p className="tree-category-copy">{categoryMeta[section.category].description}</p>
                </div>
              </div>

              <span className="tree-chevron" aria-hidden="true">
                {expandedCategory === section.category ? "−" : "+"}
              </span>
            </button>

            {expandedCategory === section.category ? (
              <div className="tree-children">
                {section.groups.map((group) => (
                  <div key={`${section.category}-${group.name}`} className="tree-group">
                    {section.groups.length > 1 ? (
                      <p className="tree-group-label">{group.name}</p>
                    ) : null}

                    <div className="tree-feature-list">
                      {group.features.map((feature) => (
                        <button
                          key={feature.id}
                          className="tree-feature-button"
                          data-active={activeFeatureId === feature.id || undefined}
                          type="button"
                          onClick={() => onFeatureSelect(feature)}
                        >
                          <span className="tree-feature-title">{feature.title}</span>
                          <span className="tree-feature-meta">{feature.group}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </aside>
  );
}
