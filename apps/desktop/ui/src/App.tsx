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

  const visibleFeatures = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    return featureCatalog.filter((feature) => {
      return !normalized || matchesFeatureSearch(feature, normalized);
    });
  }, [deferredSearch]);

  const treeSections = useMemo(() => buildTree(visibleFeatures), [visibleFeatures]);

  const activeFeature =
    featureCatalog.find((feature) => feature.id === activeFeatureId) ?? featureCatalog[0];

  function handleFeatureSelect(feature: FeatureDefinition, clearSearch = true) {
    startTransition(() => {
      setActiveFeatureId(feature.id);
      setExpandedCategory(feature.category);
      if (clearSearch) {
        setSearchQuery("");
      }
    });
  }

  function handleCategorySelect(category: FeatureCategory) {
    startTransition(() => {
      setExpandedCategory(category);
      const firstVisibleInCategory = visibleFeatures.find((feature) => feature.category === category);
      const firstFeatureInCategory = featureCatalog.find((feature) => feature.category === category);
      const nextFeature = firstVisibleInCategory ?? firstFeatureInCategory;

      if (nextFeature) {
        setActiveFeatureId(nextFeature.id);
      }
    });
  }

  const activeCategory = activeFeature ? categoryMeta[activeFeature.category] : null;

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
        searchHasMatches={searchSuggestions.length > 0}
      />

      <section className="workspace">
        <div className="workspace-head">
          <div>
            <p className="workspace-kicker">
              {activeCategory?.label} / {activeFeature?.group}
            </p>
            <h2>{activeFeature?.title}</h2>
            <p className="workspace-copy">{activeFeature?.description}</p>
          </div>

          <div className="workspace-doc-note">
            <p className="meta-label">Implementation Note</p>
            <p className="meta-copy">{activeFeature?.docsSummary}</p>
          </div>
        </div>

        <div className="workspace-panel">{activeFeature?.render()}</div>
      </section>
    </main>
  );
}

export default App;
