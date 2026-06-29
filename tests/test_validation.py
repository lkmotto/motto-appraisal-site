"""Validation tests for motto-appraisal-site (multi-page static HTML site)."""

import json
import pathlib
from xml.etree import ElementTree

REPO = pathlib.Path(__file__).resolve().parent.parent


def test_index_html_exists_and_is_valid():
    """Verify index.html exists, has DOCTYPE, and has expected elements."""
    path = REPO / "index.html"
    assert path.is_file(), "Missing index.html"
    content = path.read_text(encoding="utf-8")
    assert len(content) > 2000, f"index.html too small ({len(content)} bytes)"
    assert "<!DOCTYPE html>" in content, "index.html missing DOCTYPE"
    assert "<html" in content, "index.html missing <html> tag"
    assert "</html>" in content, "index.html missing closing </html> tag"
    assert "<head>" in content or "<head " in content, "index.html missing <head>"
    assert "<body>" in content or "<body " in content, "index.html missing <body>"


def test_all_html_pages_have_doctype():
    """Verify every .html file in repo root has a DOCTYPE declaration."""
    for path in REPO.glob("*.html"):
        content = path.read_text(encoding="utf-8")
        assert "<!DOCTYPE html>" in content, f"{path.name} missing DOCTYPE declaration"
        assert "</html>" in content, f"{path.name} missing closing </html> tag"


def test_css_and_js_exist():
    """Verify styles.css, script.js, and hero-canvas.js exist and are non-empty."""
    for name in ["styles.css", "script.js", "hero-canvas.js"]:
        path = REPO / name
        assert path.is_file(), f"Missing: {name}"
        content = path.read_text(encoding="utf-8")
        assert len(content) > 100, f"{name} is too small ({len(content)} bytes)"


def test_netlify_toml_is_valid():
    """Verify netlify.toml exists and has build + redirect + headers sections."""
    path = REPO / "netlify.toml"
    assert path.is_file(), "Missing netlify.toml"
    content = path.read_text(encoding="utf-8")
    assert "[build]" in content, "netlify.toml missing [build]"
    assert "publish" in content, "netlify.toml missing publish"
    assert "[[redirects]]" in content, "netlify.toml missing [[redirects]]"
    assert "[[headers]]" in content, "netlify.toml missing [[headers]]"


def test_sitemap_xml_is_valid():
    """Verify sitemap.xml is well-formed XML with URL entries."""
    path = REPO / "sitemap.xml"
    assert path.is_file(), "Missing sitemap.xml"
    content = path.read_text(encoding="utf-8")
    tree = ElementTree.fromstring(content)
    namespaces = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = tree.findall("sm:url", namespaces)
    assert len(urls) >= 10, f"Expected >=10 URLs in sitemap, found {len(urls)}"


def test_readme_exists_and_describes_site():
    """Verify README.md exists and has meaningful content."""
    path = REPO / "README.md"
    assert path.is_file(), "Missing README.md"
    content = path.read_text(encoding="utf-8")
    assert len(content) > 100, f"README.md too small ({len(content)} bytes)"


def test_robots_txt_has_user_agent():
    """Verify robots.txt exists with User-agent directive."""
    path = REPO / "robots.txt"
    assert path.is_file(), "Missing robots.txt"
    content = path.read_text(encoding="utf-8")
    assert len(content) > 0, "robots.txt is empty"
    assert "User-agent" in content, "robots.txt missing User-agent"


def test_netlify_function_tally_apollo_exists():
    """Verify netlify/functions/tally-apollo.js exists with handler code."""
    path = REPO / "netlify" / "functions" / "tally-apollo.js"
    assert path.is_file(), "Missing tally-apollo.js function"
    content = path.read_text(encoding="utf-8")
    assert len(content) > 100, f"tally-apollo.js too small ({len(content)} bytes)"
    assert (
        "exports.handler" in content or "handler" in content.lower()
    ), "tally-apollo.js missing exported handler"


def test_site_webmanifest_is_valid_json():
    """Verify assets/site.webmanifest is valid JSON with expected keys."""
    path = REPO / "assets" / "site.webmanifest"
    assert path.is_file(), "Missing site.webmanifest"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert "name" in data, "webmanifest missing name"
    assert "icons" in data, "webmanifest missing icons"
    assert len(data["icons"]) > 0, "webmanifest has no icons"
