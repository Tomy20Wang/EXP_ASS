import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FeatureSidebar } from "./components/FeatureSidebar";
import {
  getCategoryMeta,
  getFeatureCatalog,
  matchesFeatureSearch,
  type FeatureDefinition,
  type FeatureCategory
} from "./features/catalog";
import {
  getAppText,
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language,
} from "./i18n";

interface TreeSection {
  category: FeatureCategory;
  groups: Array<{
    name: string;
    features: FeatureDefinition[];
  }>;
}

const categoryOrder: FeatureCategory[] = ["image", "video", "batch"];

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
  const [language, setLanguage] = useState<Language>(getStoredLanguage);
  const featureCatalog = useMemo(() => getFeatureCatalog(language), [language]);
  const categoryMeta = useMemo(() => getCategoryMeta(language), [language]);
  const text = useMemo(() => getAppText(language), [language]);

  const [activeFeatureId, setActiveFeatureId] = useState(featureCatalog[0]?.id ?? "");
  const [expandedCategory, setExpandedCategory] = useState<FeatureCategory>(
    featureCatalog[0]?.category ?? "image"
  );
  const [isStepsModalOpen, setIsStepsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const searchSuggestions = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return featureCatalog.filter((feature) => matchesFeatureSearch(feature, normalized)).slice(0, 6);
  }, [deferredSearch, featureCatalog]);

  const treeSections = useMemo(() => buildTree(featureCatalog), [featureCatalog]);

  const activeFeature =
    featureCatalog.find((feature) => feature.id === activeFeatureId) ?? featureCatalog[0];

  function handleFeatureSelect(feature: FeatureDefinition) {
    startTransition(() => {
      setActiveFeatureId(feature.id);
      setExpandedCategory(feature.category);
      setIsStepsModalOpen(false);
    });
  }

  function handleCategorySelect(category: FeatureCategory) {
    startTransition(() => {
      setExpandedCategory(category);
      setIsStepsModalOpen(false);
      const firstFeatureInCategory = featureCatalog.find((feature) => feature.category === category);

      if (firstFeatureInCategory) {
        setActiveFeatureId(firstFeatureInCategory.id);
      }
    });
  }

  const activeCategory = activeFeature ? categoryMeta[activeFeature.category] : null;

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (!isStepsModalOpen && !isSettingsModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsStepsModalOpen(false);
        setIsSettingsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsModalOpen, isStepsModalOpen]);

  useEffect(() => {
    if (!featureCatalog.some((feature) => feature.id === activeFeatureId)) {
      setActiveFeatureId(featureCatalog[0]?.id ?? "");
      setExpandedCategory(featureCatalog[0]?.category ?? "image");
    }
  }, [activeFeatureId, featureCatalog]);

  return (
    <main className="app-shell">
      <FeatureSidebar
        text={text.sidebar}
        categoryMeta={categoryMeta}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        suggestions={searchSuggestions}
        sections={treeSections}
        expandedCategory={expandedCategory}
        onCategorySelect={handleCategorySelect}
        activeFeatureId={activeFeature?.id ?? ""}
        onFeatureSelect={handleFeatureSelect}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      <section className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="workspace-topbar-label">{text.workspace.open}</p>
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
              </div>

              <div className="workspace-doc-note">
                <div className="workspace-doc-note-head">
                  <p className="meta-label">{text.workspace.implementationNote}</p>
                  <button
                    className="note-link-button"
                    type="button"
                    onClick={() => setIsStepsModalOpen(true)}
                  >
                    {text.workspace.viewAllSteps}
                  </button>
                </div>
                <p className="meta-copy">{activeFeature?.docsSummary}</p>
              </div>
            </div>

            <div className="workspace-panel">
              <div className="tool-stage">{activeFeature?.render()}</div>
            </div>
          </div>
        </div>
      </section>

      {activeFeature && isStepsModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsStepsModalOpen(false)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="implementation-steps-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="meta-label">{text.workspace.implementationSteps}</p>
                <h3 id="implementation-steps-title">{activeFeature.title}</h3>
                <p className="meta-copy">{activeFeature.docsSummary}</p>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={() => setIsStepsModalOpen(false)}
              >
                {text.workspace.close}
              </button>
            </div>

            <ol className="implementation-modal-list">
              {activeFeature.implementationSteps.map((step, index) => (
                <li key={`${activeFeature.id}-modal-${step.title}`} className="implementation-step-item">
                  <span className="step-number">{index + 1}</span>
                  <div className="implementation-step-copy">
                    <p className="implementation-step-title">{step.title}</p>
                    <p className="meta-copy">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}

      {isSettingsModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="modal-card settings-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="meta-label">{text.sidebar.settings}</p>
                <h3 id="settings-modal-title">{text.settings.title}</h3>
                <p className="meta-copy">{text.settings.description}</p>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                {text.workspace.close}
              </button>
            </div>

            <div className="settings-group">
              <p className="settings-group-label">{text.settings.language}</p>
              <div className="settings-option-list">
                <button
                  className="settings-option-button"
                  data-active={language === "en" || undefined}
                  type="button"
                  onClick={() => setLanguage("en")}
                >
                  {text.settings.english}
                </button>
                <button
                  className="settings-option-button"
                  data-active={language === "zh" || undefined}
                  type="button"
                  onClick={() => setLanguage("zh")}
                >
                  {text.settings.chinese}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
