import { useEffect, useMemo, useRef, useState } from "react";
import type { Portfolio, TemplateId } from "../portfolio/types";
import { ACCENTS } from "../lib/samples";
import { TEMPLATE_BY_ID, TEMPLATES } from "../portfolio/templates/meta";
import { renderPortfolio } from "../portfolio/render";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalIcon,
  GridIcon,
  MonitorIcon,
  PhoneIcon,
  SparkIcon,
  XIcon,
} from "./Icons";

interface StudioProps {
  portfolio: Portfolio | null;
  onChooseTemplate: (id: TemplateId) => void;
  onOpenGallery: () => void;
  onAccent: (accent: string) => void;
  onClose: () => void;
  onExport: () => void;
  onOpen: () => void;
  onCopy: () => void;
}

type Device = "desktop" | "mobile";

function EmptyStudio({
  onChooseTemplate,
  onOpenGallery,
}: Pick<StudioProps, "onChooseTemplate" | "onOpenGallery">) {
  return (
    <div className="studio-empty">
      <span className="studio-empty__mark">
        <SparkIcon width={20} height={20} />
      </span>
      <h2>An empty stage.</h2>
      <p>
        Nothing has been built yet. Describe your work in the chat and the studio will appear here,
        or pick a starting look.
      </p>
      <div className="studio-empty__grid">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            className="template-tile"
            onClick={() => onChooseTemplate(template.id)}
            title={`Start with ${template.name}`}
          >
            <span
              className="template-tile__art"
              style={{
                background: template.preview.background,
                color: template.preview.foreground,
              }}
            >
              <i style={{ background: template.preview.accent }} />
              <b>Aa</b>
              <em />
            </span>
            <span className="template-tile__name">{template.name}</span>
          </button>
        ))}
      </div>
      <button className="studio-empty__link" type="button" onClick={onOpenGallery}>
        Read the lookbook <span>→</span>
      </button>
    </div>
  );
}

export function Studio({
  portfolio,
  onChooseTemplate,
  onOpenGallery,
  onAccent,
  onClose,
  onExport,
  onOpen,
  onCopy,
}: StudioProps) {
  const [device, setDevice] = useState<Device>(() =>
    window.innerWidth < 720 ? "mobile" : "desktop",
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () =>
      setStage({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [portfolio]);

  const html = useMemo(() => (portfolio ? renderPortfolio(portfolio) : ""), [portfolio]);

  const meta = portfolio ? TEMPLATE_BY_ID[portfolio.template] : null;
  const simulatedWidth = device === "desktop" ? 1440 : 390;
  const chromeHeight = device === "desktop" ? 34 : 28;
  const contentWidth = Math.max(200, stage.width - 24);
  const deviceWidth = Math.min(simulatedWidth, contentWidth);
  const scale = stage.width ? Math.min(1, deviceWidth / simulatedWidth) : 0.45;
  const availableHeight = Math.max(220, stage.height - 24);
  const screenHeight = Math.max(300, availableHeight - chromeHeight);
  const iframeHeight = Math.round(screenHeight / scale);

  return (
    <aside className="studio">
      <header className="studio__head">
        <div className="studio__title">
          <SparkIcon width={15} height={15} />
          <b>Studio</b>
          {portfolio && (
            <span className="studio__live">
              <i />
              Live
            </span>
          )}
        </div>
        <div className="studio__head-actions">
          <div className="device-toggle" role="group" aria-label="Preview width">
            <button
              type="button"
              className={device === "desktop" ? "is-active" : ""}
              onClick={() => setDevice("desktop")}
              aria-pressed={device === "desktop"}
              title="Desktop preview"
            >
              <MonitorIcon width={14} height={14} />
            </button>
            <button
              type="button"
              className={device === "mobile" ? "is-active" : ""}
              onClick={() => setDevice("mobile")}
              aria-pressed={device === "mobile"}
              title="Mobile preview"
            >
              <PhoneIcon width={14} height={14} />
            </button>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close studio">
            <XIcon width={16} height={16} />
          </button>
        </div>
      </header>

      {!portfolio || !meta ? (
        <EmptyStudio onChooseTemplate={onChooseTemplate} onOpenGallery={onOpenGallery} />
      ) : (
        <>
          <div className="template-strip" role="tablist" aria-label="Portfolio template">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                role="tab"
                aria-selected={template.id === portfolio.template}
                className={`template-chip ${template.id === portfolio.template ? "is-active" : ""}`}
                onClick={() => onChooseTemplate(template.id)}
                title={template.description}
              >
                <i
                  style={{
                    background: template.preview.background,
                    boxShadow: `inset 0 0 0 1.5px ${template.preview.accent}`,
                  }}
                />
                {template.name}
              </button>
            ))}
          </div>

          <div className="studio__bar">
            <div className="swatches" aria-label="Accent colour">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch ${portfolio.accent.toLowerCase() === color ? "is-active" : ""}`}
                  style={{ background: color }}
                  onClick={() => onAccent(color)}
                  aria-label={`Use ${color}`}
                  aria-pressed={portfolio.accent.toLowerCase() === color}
                >
                  {portfolio.accent.toLowerCase() === color && <CheckIcon width={10} height={10} />}
                </button>
              ))}
              <label className="swatch swatch--custom" title="Custom colour">
                <input
                  type="color"
                  value={portfolio.accent}
                  onChange={(event) => onAccent(event.target.value)}
                  aria-label="Custom accent colour"
                />
                <span />
              </label>
            </div>
            <div className="studio__actions">
              <button type="button" className="ghost-button" onClick={onCopy} title="Copy blueprint JSON">
                <CopyIcon width={14} height={14} />
              </button>
              <button type="button" className="ghost-button" onClick={onOpen}>
                <ExternalIcon width={14} height={14} />
                Open
              </button>
              <button type="button" className="primary-button" onClick={onExport}>
                <DownloadIcon width={14} height={14} />
                Export
              </button>
            </div>
          </div>

          <div className="preview-stage" ref={stageRef}>
            <div
              className={`device device--${device}`}
              style={{ width: device === "desktop" ? "100%" : deviceWidth }}
            >
              <div className="device__chrome" style={{ height: chromeHeight }}>
                <span className="device__dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="device__url">
                  {portfolio.name.toLowerCase().replace(/\s+/g, "")}.studio
                </span>
                <span className="device__meta">
                  {device === "desktop" ? "1440px" : "390px"}
                </span>
              </div>
              <div className="device__screen" style={{ height: screenHeight }}>
                <iframe
                  title="Portfolio preview"
                  srcDoc={html}
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                  style={{
                    width: simulatedWidth,
                    height: iframeHeight,
                    transform: `scale(${scale})`,
                  }}
                />
              </div>
            </div>
          </div>

          <footer className="studio__foot">
            <div>
              <b>{meta.name}</b>
              <span>{meta.description}</span>
            </div>
            <button type="button" className="ghost-button ghost-button--icon" onClick={onOpenGallery}>
              <GridIcon width={14} height={14} />
              Lookbook
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}
