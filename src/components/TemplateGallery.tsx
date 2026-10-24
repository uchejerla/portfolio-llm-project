import type { CSSProperties } from "react";
import type { TemplateId } from "../portfolio/types";
import { TEMPLATES, type TemplateMeta } from "../portfolio/templates/meta";
import { CheckIcon, XIcon } from "./Icons";

function Thumb({ template }: { template: TemplateMeta }) {
  const { preview } = template;
  const style = {
    "--thumb-bg": preview.background,
    "--thumb-fg": preview.foreground,
    "--thumb-accent": preview.accent,
    fontFamily:
      preview.font === "serif"
        ? "'Instrument Serif', Georgia, serif"
        : preview.font === "mono"
          ? "'JetBrains Mono', monospace"
          : preview.font === "display"
            ? "'Anton', Impact, sans-serif"
            : "Inter, sans-serif",
  } as CSSProperties;

  return (
    <div className={`thumb thumb--${preview.layout}`} style={style}>
      <span className="thumb__nav">
        <i />
        <em />
        <em />
      </span>
      {preview.layout === "billboard" && (
        <>
          <span className="thumb__display">Aa</span>
          <div className="thumb__row">
            <i />
            <i />
            <i />
          </div>
        </>
      )}
      {preview.layout === "split" && (
        <>
          <span className="thumb__display">A</span>
          <div className="thumb__split">
            <span />
            <span />
          </div>
        </>
      )}
      {preview.layout === "stack" && (
        <>
          <span className="thumb__display">Aa</span>
          <span className="thumb__line" />
          <span className="thumb__line short" />
          <span className="thumb__block" />
        </>
      )}
      {preview.layout === "grid" && (
        <>
          <span className="thumb__display">01</span>
          <div className="thumb__grid">
            <i />
            <i />
            <i />
            <i />
          </div>
        </>
      )}
      {preview.layout === "index" && (
        <>
          <span className="thumb__display">Vol. 1</span>
          <div className="thumb__index">
            <i />
            <i />
            <i />
            <i />
          </div>
        </>
      )}
    </div>
  );
}

interface TemplateGalleryProps {
  active: TemplateId | null;
  onSelect: (id: TemplateId) => void;
  onClose: () => void;
}

export function TemplateGallery({ active, onSelect, onClose }: TemplateGalleryProps) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--gallery"
        role="dialog"
        aria-modal="true"
        aria-label="Portfolio templates"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            <span className="eyebrow">The lookbook</span>
            <h2>Ten ways to be seen.</h2>
            <p>
              One blueprint, ten treatments. Switch looks at any time — your words, projects and
              links come with you.
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close lookbook">
            <XIcon width={18} height={18} />
          </button>
        </header>

        <div className="lookbook">
          {TEMPLATES.map((template) => (
            <article
              key={template.id}
              className={`lookbook__item ${template.id === active ? "is-active" : ""}`}
            >
              <Thumb template={template} />
              <div className="lookbook__body">
                <div className="lookbook__heading">
                  <h3>{template.name}</h3>
                  {template.id === active ? (
                    <span className="lookbook__active">
                      <CheckIcon width={11} height={11} /> In use
                    </span>
                  ) : (
                    <span className="lookbook__tags">{template.tags[0]}</span>
                  )}
                </div>
                <p>{template.description}</p>
                <button type="button" onClick={() => onSelect(template.id)}>
                  {template.id === active ? "Keep this look" : "Use this look"} <span>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        <footer className="modal__foot">
          <span>All templates export as a single standalone HTML file.</span>
          <button type="button" className="ghost-button" onClick={onClose}>
            Back to the studio
          </button>
        </footer>
      </div>
    </div>
  );
}
