import type { Portfolio, TemplateId } from "./types";
import { renderCinema } from "./templates/cinema";
import { renderNoir } from "./templates/noir";
import { renderEditorial } from "./templates/editorial";
import { renderBrutal } from "./templates/brutal";
import { renderGallery } from "./templates/gallery";
import { renderTerminal } from "./templates/terminal";
import { renderAurora } from "./templates/aurora";
import { renderSwiss } from "./templates/swiss";
import { renderKinetic } from "./templates/kinetic";
import { renderAtelier } from "./templates/atelier";

const RENDERERS: Record<TemplateId, (portfolio: Portfolio) => string> = {
  cinema: renderCinema,
  noir: renderNoir,
  editorial: renderEditorial,
  brutal: renderBrutal,
  gallery: renderGallery,
  terminal: renderTerminal,
  aurora: renderAurora,
  swiss: renderSwiss,
  kinetic: renderKinetic,
  atelier: renderAtelier,
};

/** Render a full, standalone portfolio document for the selected template. */
export function renderPortfolio(portfolio: Portfolio): string {
  return (RENDERERS[portfolio.template] ?? renderCinema)(portfolio);
}
