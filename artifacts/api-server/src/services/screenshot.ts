import puppeteer from "puppeteer";
import { execFileSync } from "child_process";
import { logger } from "../lib/logger.js";
import { assertSsrfSafe, assertUrlSsrfSafeAsync, hostnameAppearsPrivate } from "../lib/ssrf-guard.js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Resolve system Chromium once at startup (Nix-installed or env override)
function resolveChromiumPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  try {
    return execFileSync("which", ["chromium"], { encoding: "utf8" }).trim();
  } catch {
    try {
      return execFileSync("which", ["chromium-browser"], { encoding: "utf8" }).trim();
    } catch {
      return undefined; // fall back to puppeteer's bundled Chrome
    }
  }
}

const SYSTEM_CHROMIUM = resolveChromiumPath();
if (SYSTEM_CHROMIUM) {
  logger.info({ executablePath: SYSTEM_CHROMIUM }, "Using system Chromium");
} else {
  logger.warn("System Chromium not found, falling back to Puppeteer bundled Chrome");
}

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

export interface ElementPosition {
  selector: string;
  text: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface DetectedCarousel {
  container: string;
  slideCount: number;
  hasNavArrows: boolean;
  context: string;
}

export interface ScreenshotResult {
  filePath: string;
  publicUrl: string;
  width: number;
  height: number;
  htmlContent: string;
  pageTitle: string;
  metaDescription: string;
  links: { text: string; href: string }[];
  headings: { level: string; text: string }[];
  ctaButtons: { text: string; type: string }[];
  hasHeroSection: boolean;
  hasSocialProof: boolean;
  hasTrustSignals: boolean;
  bodyText: string;
  elementPositions: ElementPosition[];
  viewportSnapshots: string[];
  detectedCarousels: DetectedCarousel[];
}

const EXTRACT_PAGE_DATA_SCRIPT = `(() => {
  const pageTitle = document.title || "";
  const metaDesc =
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") || "";

  const headings = [];
  document.querySelectorAll("h1, h2, h3, h4").forEach((h) => {
    const text = h.textContent?.trim() || "";
    if (text) {
      headings.push({ level: h.tagName.toLowerCase(), text: text.substring(0, 200) });
    }
  });

  const links = [];
  document.querySelectorAll("a").forEach((a) => {
    const text = a.textContent?.trim() || "";
    const href = a.href || "";
    if (text && href) {
      links.push({ text: text.substring(0, 100), href: href.substring(0, 200) });
    }
  });

  const ctaButtons = [];
  document
    .querySelectorAll("button, a.btn, .btn, .cta, [class*='cta'], [class*='button']")
    .forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (text) {
        ctaButtons.push({ text: text.substring(0, 100), type: el.tagName.toLowerCase() });
      }
    });

  const h1El = document.querySelector("h1");
  const hasHeroSection = !!(
    document.querySelector('[class*="hero"]') ||
    document.querySelector('[class*="banner"]') ||
    document.querySelector('[class*="jumbotron"]') ||
    document.querySelector('[class*="header-main"]') ||
    document.querySelector('[class*="intro"]') ||
    document.querySelector('[id*="hero"]') ||
    document.querySelector('[id*="banner"]') ||
    (h1El && (
      h1El.nextElementSibling ||
      h1El.closest("section") ||
      h1El.closest("header") ||
      h1El.closest('[class*="hero"]') ||
      h1El.closest('[class*="top"]')
    ))
  );

  const socialProofKeywords = /review|testimonial|rating|customer|client|trust|users|companies|businesses|success|case study/i;
  const hasSocialProof = socialProofKeywords.test(document.body.innerText);

  const trustKeywords = /secure|ssl|privacy|guarantee|refund|verified|certified|award|partner|featured in/i;
  const hasTrustSignals = trustKeywords.test(document.body.innerText);

  const bodyText = document.body.innerText?.substring(0, 5000) || "";

  const carouselSelectors = [
    '[class*="carousel"]', '[class*="slider"]', '[class*="swiper"]',
    '[class*="splide"]', '[class*="glide"]', '[class*="owl"]',
    '[data-slick]', '[data-carousel]', '[data-slider]',
  ];
  const detectedCarousels = [];
  carouselSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      const slideCount =
        el.querySelectorAll('[class*="slide"], [class*="item"]:not(li > li), li[class], li[aria-label]').length || 0;
      if (slideCount < 2) return;
      const hasNavArrows = !!el.querySelector(
        '[class*="prev"], [class*="next"], [class*="arrow"], [aria-label*="Previous"], [aria-label*="Next"], [aria-label*="prev"], [aria-label*="next"]'
      );
      const nearbyHeading =
        el.closest("section")?.querySelector("h2, h3")?.textContent?.trim().substring(0, 80) || "";
      detectedCarousels.push({
        container:
          el.tagName.toLowerCase() +
          (el.className ? " ." + String(el.className).split(" ").filter(Boolean)[0] : ""),
        slideCount,
        hasNavArrows,
        context: nearbyHeading,
      });
    });
  });

  return {
    pageTitle,
    metaDescription: metaDesc,
    links: links.slice(0, 50),
    headings: headings.slice(0, 30),
    ctaButtons: ctaButtons.slice(0, 20),
    hasHeroSection,
    hasSocialProof,
    hasTrustSignals,
    bodyText,
    htmlContent: document.documentElement.outerHTML.substring(0, 50000),
    detectedCarousels: detectedCarousels.slice(0, 10),
  };
})()`;

export async function captureScreenshot(url: string, analysisId: string): Promise<ScreenshotResult> {
  ensureScreenshotsDir();

  logger.info({ url, analysisId }, "Starting screenshot capture");

  const { pinnableIp } = await assertSsrfSafe(url);
  const targetHostname = new URL(url).hostname.toLowerCase();

  const hostResolverRules = pinnableIp
    ? `MAP ${targetHostname} ${pinnableIp}`
    : undefined;

  const browser = await puppeteer.launch({
    headless: true,
    ...(SYSTEM_CHROMIUM ? { executablePath: SYSTEM_CHROMIUM } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--mute-audio",
      ...(hostResolverRules ? [`--host-resolver-rules=${hostResolverRules}`] : []),
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setRequestInterception(true);
    page.on("request", (interceptedRequest) => {
      const reqUrl = interceptedRequest.url();
      let reqHostname: string;
      try {
        reqHostname = new URL(reqUrl).hostname.toLowerCase();
      } catch {
        interceptedRequest.abort("blockedbyclient");
        return;
      }

      if (hostnameAppearsPrivate(reqHostname)) {
        interceptedRequest.abort("blockedbyclient");
        return;
      }

      if (reqHostname === targetHostname) {
        interceptedRequest.continue();
        return;
      }

      assertUrlSsrfSafeAsync(reqUrl)
        .then(() => interceptedRequest.continue())
        .catch(() => interceptedRequest.abort("blockedbyclient"));
    });

    try {
      await page.goto(url, {
        waitUntil: "load",
        timeout: 45000,
      });
    } catch (err) {
      // Timeout or partial load — continue with whatever rendered
      logger.warn({ url, err }, "Page load timed out or errored, continuing with partial content");
    }

    // Wait for JS-rendered content and lazy-loaded images
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pageData = await page.evaluate(EXTRACT_PAGE_DATA_SCRIPT);

    // Snapshot 1: above-the-fold view (JPEG for smaller Claude payload)
    const snap1 = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 80, clip: { x: 0, y: 0, width: 1280, height: 800 } });

    const pageHeightForScroll = await page.evaluate("document.body.scrollHeight");
    const scrollableHeight = Math.min(pageHeightForScroll, 8000);

    // Take scrolled viewport snapshots to cover content below the fold
    const scrolledSnaps: string[] = [];
    const scrollStep = 800;
    const maxScrollSnaps = 5;
    for (let i = 1; i <= maxScrollSnaps; i++) {
      const scrollY = scrollStep * i;
      if (scrollY >= scrollableHeight) break;
      await page.evaluate(`window.scrollTo(0, ${scrollY})`);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const snap = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 80, clip: { x: 0, y: 0, width: 1280, height: 800 } });
      scrolledSnaps.push(snap as string);
    }
    // Scroll back to top before full-page capture
    await page.evaluate("window.scrollTo(0, 0)");

    const viewportSnapshots = [snap1 as string, ...scrolledSnaps];
    logger.info({ snapshotCount: viewportSnapshots.length, scrolledSnaps: scrolledSnaps.length }, "Viewport snapshots captured");

    // Measure the full page height at the NATURAL viewport (1280x800).
    // Do NOT change the viewport height — sites using height:100vh or
    // min-height:100vh would balloon those sections to fill the new
    // viewport, making hero images huge and hiding page content.
    const fullHeight = await page.evaluate("document.body.scrollHeight");

    const elementPositions = await page.evaluate(`(() => {
      const pageHeight = ${JSON.stringify(fullHeight)};
      const results = [];
      const pageWidth = 1280;

      const capture = (selector, els) => {
        els.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const scrollY = window.scrollY;
          const absTop = rect.top + scrollY;
          const text = (el.textContent || "").trim().substring(0, 120);
          if (!text || rect.width < 10 || rect.height < 5) return;
          results.push({
            selector,
            text,
            xPct: Math.round((rect.left / pageWidth) * 100),
            yPct: Math.round((absTop / pageHeight) * 100),
            widthPct: Math.round((rect.width / pageWidth) * 100),
            heightPct: Math.round((rect.height / pageHeight) * 100),
          });
        });
      };

      capture("h1", Array.from(document.querySelectorAll("h1")));
      capture("h2", Array.from(document.querySelectorAll("h2")));
      capture("h3", Array.from(document.querySelectorAll("h3")));
      capture("nav", Array.from(document.querySelectorAll("nav, header")));
      capture("cta", Array.from(document.querySelectorAll("a.btn, .btn, button, [class*='cta'], [class*='button']")));
      capture("img", Array.from(document.querySelectorAll("img[alt]")));
      capture("footer", Array.from(document.querySelectorAll("footer")));

      return results.slice(0, 40);
    })()`);

    const fileName = `${analysisId}_${crypto.randomBytes(4).toString("hex")}.png`;
    const filePath = path.join(SCREENSHOTS_DIR, fileName);

    // fullPage:true stitches the page at the natural 800px viewport height,
    // so vh-based elements stay correctly sized.
    await page.screenshot({
      path: filePath,
      fullPage: true,
    });

    logger.info({ filePath, height: fullHeight }, "Screenshot captured");

    return {
      filePath,
      publicUrl: `/api/screenshots/${fileName}`,
      width: 1280,
      height: fullHeight,
      htmlContent: pageData.htmlContent,
      pageTitle: pageData.pageTitle,
      metaDescription: pageData.metaDescription,
      links: pageData.links,
      headings: pageData.headings,
      ctaButtons: pageData.ctaButtons,
      hasHeroSection: pageData.hasHeroSection,
      hasSocialProof: pageData.hasSocialProof,
      hasTrustSignals: pageData.hasTrustSignals,
      bodyText: pageData.bodyText,
      elementPositions,
      viewportSnapshots,
      detectedCarousels: pageData.detectedCarousels,
    };
  } finally {
    await browser.close();
  }
}
