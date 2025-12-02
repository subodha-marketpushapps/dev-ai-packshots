import LinkifyIt, { Match } from "linkify-it";
import React from "react";

// Define types for flexibility
type LinkType = "url" | "email" | "phone" | "text";
type RenderProps = {
  type: LinkType;
  content: string;
  href?: string;
  attributes?: Record<string, string | undefined>;
};
type RenderFunction = (props: RenderProps) => React.ReactNode | string;

// Configuration options
interface MarkTextOptions {
  styles?: React.CSSProperties | ((type: LinkType) => React.CSSProperties);
  render?: RenderFunction;
  target?: "_blank" | "_self" | string;
  rel?: string;
  extraPatterns?: Array<{
    test: RegExp | ((text: string) => boolean);
    type: string;
    href?: (match: string) => string;
  }>;
  sanitize?: (url: string) => string;
}

const defaultStyles: React.CSSProperties = {
  color: "inherit",
  textDecoration: "underline",
};

const defaultRender: RenderFunction = ({ type, content, href, attributes }) => {
  if (type === "text") return content;
  return (
    <a href={href} {...attributes} style={defaultStyles} key={content}>
      {content}
    </a>
  );
};

// Simple regex for phone numbers (matches digits with optional spaces, dashes, parentheses, or +)
const PHONE_REGEX = /\+?\d[\d\s()-]{7,}\d\b/g;

const markText = (
  text: string,
  options: MarkTextOptions = {}
): React.ReactNode[] | string => {
  if (!text) return text;

  const {
    styles = defaultStyles,
    render = defaultRender,
    target = "_blank",
    rel = "noopener noreferrer",
    extraPatterns = [],
    sanitize = (url) => url,
  } = options;

  // Initialize LinkifyIt
  const linkify = new LinkifyIt();
  const matches: Match[] | null = linkify.match(text);
  const parts: (React.ReactNode | string)[] = [];
  let lastIndex = 0;

  // Add phone number matches
  const phoneMatches: Match[] = [];
  let phoneMatch;
  while ((phoneMatch = PHONE_REGEX.exec(text))) {
    phoneMatches.push({
      index: phoneMatch.index,
      lastIndex: phoneMatch.index + phoneMatch[0].length,
      text: phoneMatch[0],
      url: `tel:${phoneMatch[0].replace(/[\s()-]/g, "")}`, // Normalize for tel:
      schema: "phone",
    } as Match);
  }

  // Combine linkify matches, phone matches, and custom patterns
  const allMatches = [
    ...(matches || []),
    ...phoneMatches,
    ...extraPatterns
      .map((pattern) => {
        const regex = pattern.test instanceof RegExp ? pattern.test : null;
        if (!regex) return [];
        const results: Match[] = [];
        let match;
        while ((match = regex.exec(text))) {
          results.push({
            index: match.index,
            lastIndex: match.index + match[0].length,
            text: match[0],
            url: pattern.href ? pattern.href(match[0]) : match[0],
            schema: pattern.type,
          } as Match);
        }
        return results;
      })
      .flat(),
  ].sort((a, b) => a.index - b.index);

  allMatches.forEach((match, index) => {
    // Add text before the match
    if (lastIndex < match.index) {
      parts.push(
        render({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      );
    }

    // Determine match type
    let type: LinkType = "text";
    let href: string | undefined;
    let content = match.text;

    if (
      match.schema === "http" ||
      match.schema === "https" ||
      linkify.test(match.url)
    ) {
      type = match.url.startsWith("mailto:")
        ? "email"
        : match.url.startsWith("tel:")
        ? "phone"
        : "url";
      href = sanitize(match.url);
    } else if (match.schema === "phone") {
      type = "phone";
      href = match.url;
    } else if (match.schema) {
      type = match.schema as LinkType;
      href = match.url ? sanitize(match.url) : undefined;
    }

    // Prepare attributes
    const attributes: Record<string, string | undefined> = {};
    if (href) {
      if (type === "url") {
        attributes.target = target;
        attributes.rel = rel;
      }
      if (typeof styles === "function") {
        attributes.style = JSON.stringify(styles(type));
      } else {
        attributes.style = JSON.stringify(styles);
      }
    }

    // Render the match
    parts.push(
      render({
        type,
        content,
        href,
        attributes,
      })
    );

    lastIndex = match.lastIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      render({
        type: "text",
        content: text.slice(lastIndex),
      })
    );
  }

  return parts;
};

export default markText;
