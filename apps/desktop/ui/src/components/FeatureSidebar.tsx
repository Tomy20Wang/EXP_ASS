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
  onFeatureSelect: (feature: FeatureDefinition, clearSearch?: boolean) => void;
  searchHasMatches: boolean;
}

export function FeatureSidebar({
  searchQuery,
  onSearchQueryChange,
  suggestions,
  sections,
  expandedCategory,
  onCategorySelect,
  activeFeatureId,
  onFeatureSelect,
  searchHasMatches
}: FeatureSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="search-panel">
        <label className="search-label" htmlFor="tool-search">
          Find a tool
        </label>
        <input
          id="tool-search"
          className="search-input"
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Try: video resize, image, aspect ratio..."
        />

        {searchQuery.trim() ? (
          <div className="search-results">
            <p className="search-results-label">Suggestions</p>
            {suggestions.length > 0 ? (
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
            )}
          </div>
        ) : null}
      </div>

      <div className="tree-panel">
        <p className="tree-label">Tool Tree</p>

        {sections.length > 0 ? (
          sections.map((section) => (
            <section key={section.category} className="tree-section">
              <button
                className="tree-category-button"
                data-active={expandedCategory === section.category || undefined}
                type="button"
                onClick={() => onCategorySelect(section.category)}
              >
                <span className="tree-category-pill">{categoryMeta[section.category].accent}</span>
                <h2>{categoryMeta[section.category].label}</h2>
              </button>
              <p className="tree-category-copy">{categoryMeta[section.category].description}</p>

              {expandedCategory === section.category ? (
                section.groups.length > 0 ? (
                  section.groups.map((group) => (
                    <div key={`${section.category}-${group.name}`} className="tree-group">
                      <p className="tree-group-label">{group.name}</p>
                      <div className="tree-feature-list">
                        {group.features.map((feature) => (
                          <button
                            key={feature.id}
                            className="tree-feature-button"
                            data-active={activeFeatureId === feature.id || undefined}
                            type="button"
                            onClick={() => onFeatureSelect(feature, false)}
                          >
                            {feature.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-copy">No visible tools in this category.</p>
                )
              ) : null}
            </section>
          ))
        ) : (
          <div className="empty-tree">
            <p>No tools are visible in this category filter.</p>
            {searchQuery.trim() && !searchHasMatches ? (
              <p>Try a broader keyword like “video” or “resize”.</p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
