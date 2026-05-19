import type { AppText } from "../i18n";
import type {
  CategoryMetaMap,
  FeatureDefinition,
  FeatureCategory,
} from "../features/catalog";

interface TreeGroup {
  name: string;
  features: FeatureDefinition[];
}

interface TreeSection {
  category: FeatureCategory;
  groups: TreeGroup[];
}

interface FeatureSidebarProps {
  text: AppText["sidebar"];
  categoryMeta: CategoryMetaMap;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  suggestions: FeatureDefinition[];
  sections: TreeSection[];
  expandedCategory: FeatureCategory;
  onCategorySelect: (category: FeatureCategory) => void;
  activeFeatureId: string;
  onFeatureSelect: (feature: FeatureDefinition) => void;
  onOpenSettings: () => void;
}

export function FeatureSidebar({
  text,
  categoryMeta,
  searchQuery,
  onSearchQueryChange,
  suggestions,
  sections,
  expandedCategory,
  onCategorySelect,
  activeFeatureId,
  onFeatureSelect,
  onOpenSettings
}: FeatureSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-card search-panel">
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
            placeholder={text.searchPlaceholder}
          />
        </div>

        {searchQuery.trim() ? (
          <div className="search-results">
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
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-copy">{text.noSuggestions}</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="sidebar-card tree-panel">
        {sections.map((section) => (
          <section key={section.category} className="tree-section">
            <button
              className="tree-category-button"
              data-active={expandedCategory === section.category || undefined}
              type="button"
              onClick={() => onCategorySelect(section.category)}
            >
              <h2>{categoryMeta[section.category].label}</h2>

              <span className="tree-chevron" aria-hidden="true">
                {expandedCategory === section.category ? "−" : "+"}
              </span>
            </button>

            {expandedCategory === section.category ? (
              <div className="tree-children">
                {section.groups.map((group) => (
                  <div key={`${section.category}-${group.name}`} className="tree-group">
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

      <div className="sidebar-footer">
        <button className="sidebar-settings-button" type="button" onClick={onOpenSettings}>
          {text.settings}
        </button>
      </div>
    </aside>
  );
}
