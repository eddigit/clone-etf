from playwright.sync_api import Page, expect, sync_playwright
import time

def test_adhesion_pages(page: Page):
    # Test Success Page
    print("Testing Adhesion Success Page...")
    page.goto("http://localhost:3000/adhesion/success?membership_id=123&paymentId=456")
    time.sleep(2) # Wait for confetti
    expect(page.get_by_text("Paiement Validé !")).to_be_visible()
    expect(page.get_by_text("Merci pour votre adhésion")).to_be_visible()
    page.screenshot(path="verification/adhesion_success.png")
    print("Success Page Screenshot taken.")

    # Test Error Page
    print("Testing Adhesion Error Page...")
    page.goto("http://localhost:3000/adhesion/error")
    expect(page.get_by_text("Paiement non abouti")).to_be_visible()
    page.screenshot(path="verification/adhesion_error.png")
    print("Error Page Screenshot taken.")

    # Test Cancel Page
    print("Testing Adhesion Cancel Page...")
    page.goto("http://localhost:3000/adhesion/cancel")
    expect(page.get_by_text("Paiement annulé")).to_be_visible()
    page.screenshot(path="verification/adhesion_cancel.png")
    print("Cancel Page Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_adhesion_pages(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
