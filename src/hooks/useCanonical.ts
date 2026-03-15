import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://inkle.band";

function setMeta(name: string, content: string, attr = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function usePageMeta({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;

    const url = `${BASE_URL}${pathname === "/" ? "/" : pathname}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:url", url);
  }, [pathname, title, description]);
}
