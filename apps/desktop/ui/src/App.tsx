import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { FeatureSidebar } from "./components/FeatureSidebar";
import {
  categoryMeta,
  featureCatalog,
  matchesFeatureSearch,
  type FeatureDefinition,
  type FeatureCategory
} from "./features/catalog";

interface TreeSection {
  category: FeatureCategory;
  groups: Array<{
    name: string;
    features: FeatureDefinition[];
  }>;
}

const categoryOrder: FeatureCategory[] = ["image", "video"];

function buildTree(features: FeatureDefinition[]) {
  const grouped = new Map<FeatureCategory, Map<string, FeatureDefinition[]>>();

  for (const feature of features) {
    const byCategory = grouped.get(feature.category) ?? new Map<string, FeatureDefinition[]>();
    const byGroup = byCategory.get(feature.group) ?? [];

    byGroup.push(feature);
    byCategory.set(feature.group, byGroup);
    grouped.set(feature.category, byCategory);
  }

  return categoryOrder.map<TreeSection>((category) => ({
    category,
    groups: Array.from((grouped.get(category) ?? new Map()).entries()).map(
      ([name, groupFeatures]) => ({
        name,
        features: groupFeatures
      })
    )
  }));
}

function App() {
  const [activeFeatureId, setActiveFeatureId] = useState(featureCatalog[0]?.id ?? "");
  const [expandedCategory, setExpandedCategory] = useState<FeatureCategory>(
    featureCatalog[0]?.category ?? "image"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const searchSuggestions = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return featureCatalog.filter((feature) => matchesFeatureSearch(feature, normalized)).slice(0, 6);
  }, [deferredSearch]);

  const treeSections = useMemo(() => buildTree(featureCatalog), []);

  const activeFeature =
    featureCatalog.find((feature) => feature.id === activeFeatureId) ?? featureCatalog[0];

  function handleFeatureSelect(feature: FeatureDefinition) {
    startTransition(() => {
      setActiveFeatureId(feature.id);
      setExpandedCategory(feature.category);
    });
  }

  function handleCategorySelect(category: FeatureCategory) {
    startTransition(() => {
      setExpandedCategory(category);
      const firstFeatureInCategory = featureCatalog.find((feature) => feature.category === category);

      if (firstFeatureInCategory) {
        setActiveFeatureId(firstFeatureInCategory.id);
      }
    });
  }

  const activeCategory = activeFeature ? categoryMeta[activeFeature.category] : null;
  const activeKeywords = activeFeature ? activeFeature.keywords.slice(0, 4) : [];

  return (
    <main className="app-shell">
      <FeatureSidebar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        suggestions={searchSuggestions}
        sections={treeSections}
        expandedCategory={expandedCategory}
        onCategorySelect={handleCategorySelect}
        activeFeatureId={activeFeature?.id ?? ""}
        onFeatureSelect={handleFeatureSelect}
      />

      <section className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-topbar-label">Open EXP_ASS</p>
            <h1>{activeFeature?.title}</h1>
          </div>

          <div className="workspace-topbar-badge">
            {activeCategory?.label} / {activeFeature?.group}
          </div>
        </header>

        <div className="workspace-scroll">
          <div className="workspace-stage">
            <div className="workspace-head">
              <div>
                <p className="workspace-kicker">
                  {activeCategory?.label} / {activeFeature?.group}
                </p>
                <h2>{activeFeature?.title}</h2>
                <p className="workspace-copy">{activeFeature?.description}</p>

                <div className="keyword-row">
                  {activeKeywords.map((keyword) => (
                    <span key={keyword} className="keyword-pill">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="workspace-doc-note">
                <p className="meta-label">Implementation Note</p>
                <p className="meta-copy">{activeFeature?.docsSummary}</p>
              </div>
            </div>

            <div className="workspace-panel">
              <div className="tool-stage">{activeFeature?.render()}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
