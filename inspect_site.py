from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Visit the site
    page.goto('https://globehunter.replit.app')
    page.wait_for_load_state('networkidle')

    # Take full page screenshot
    page.screenshot(path='/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/homepage_full.png', full_page=True)

    # Take viewport screenshot
    page.screenshot(path='/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/homepage_viewport.png')

    # Get page title
    print(f"Page Title: {page.title()}")

    # Get all text content
    print("\n=== PAGE STRUCTURE ===\n")

    # Get navigation items
    nav_items = page.locator('nav a, header a').all_text_contents()
    print(f"Navigation items: {nav_items}")

    # Get all headings
    headings = page.locator('h1, h2, h3').all_text_contents()
    print(f"\nHeadings: {headings}")

    # Get all buttons
    buttons = page.locator('button').all_text_contents()
    print(f"\nButtons: {buttons}")

    # Get form inputs
    inputs = page.locator('input, select').all()
    print(f"\nForm inputs count: {len(inputs)}")
    for inp in inputs:
        placeholder = inp.get_attribute('placeholder') or ''
        name = inp.get_attribute('name') or ''
        input_type = inp.get_attribute('type') or 'text'
        print(f"  - {input_type}: {name} ({placeholder})")

    # Get all links
    links = page.locator('a').all()
    print(f"\nLinks count: {len(links)}")
    for link in links[:20]:  # First 20 links
        href = link.get_attribute('href') or ''
        text = link.text_content() or ''
        if text.strip():
            print(f"  - {text.strip()[:50]}: {href}")

    # Get main content sections
    print("\n=== MAIN CONTENT ===\n")
    content = page.content()

    # Save HTML for reference
    with open('/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/homepage.html', 'w') as f:
        f.write(content)

    print("HTML saved to homepage.html")

    # Get CSS classes used (for styling reference)
    classes = page.evaluate('''() => {
        const allElements = document.querySelectorAll('*');
        const classSet = new Set();
        allElements.forEach(el => {
            el.classList.forEach(c => classSet.add(c));
        });
        return Array.from(classSet).slice(0, 100);
    }''')
    print(f"\nCSS classes sample: {classes[:30]}")

    # Check for specific travel site elements
    print("\n=== TRAVEL SITE ELEMENTS ===\n")

    # Search form
    search_form = page.locator('form').first
    if search_form:
        print("Search form found")

    # Destination cards
    cards = page.locator('[class*="card"], [class*="Card"]').all()
    print(f"Cards found: {len(cards)}")

    # Phone numbers
    phone_links = page.locator('a[href^="tel:"]').all()
    for phone in phone_links:
        print(f"Phone CTA: {phone.text_content()} - {phone.get_attribute('href')}")

    # Footer
    footer = page.locator('footer').text_content()
    if footer:
        print(f"\nFooter content preview: {footer[:500]}...")

    browser.close()
    print("\n=== DONE ===")
