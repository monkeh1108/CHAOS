def test_dive_collision_live(browser_session, standalone_html):
    # The test advances motion explicitly. Real-time frames between Playwright
    # calls can also run AI and move the runner before the collision is sampled.
    html = standalone_html.replace(
        "<script>",
        "<script>window.requestAnimationFrame = () => 0;</script><script>",
        1,
    )
    args = ["--no-sandbox", "--enable-webgl", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"]
    with browser_session(headless=True, args=args) as browser:
        for width in (1120, 390):
            page = browser.new_page(viewport={"width": width, "height": 850})
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.set_content(html, wait_until="load")
            page.evaluate("""() => {
                const game = GRIDIRON_DEBUG;
                const random = Math.random;
                try {
                    Math.random = () => 431 / 4294967296;
                    game.newGame();
                    game.debugFinishCoinToss('heads', 'receive');
                } finally {
                    Math.random = random;
                }
                game.debugSeed(431);
                game.select('inside');
                game.snap();
            }""")
            assert page.evaluate("GRIDIRON_DEBUG.getMatch().phase") == "live"
            assert page.locator('#contactPreset option[value="kickdive"]').count() == 1
            for angle in ("front", "side", "diagonal", "miss"):
                event = page.evaluate("""angle => {
                    const game = GRIDIRON_DEBUG;
                    if (!game.debugSetupLowDive('RB', 'MLB', angle)) {
                        throw new Error('Dive setup failed: ' + angle);
                    }
                    game.debugMotionOnly(20);
                    return game.debugContactEvidence();
                }""", angle)
                if angle == "miss":
                    assert event["lowDiveContacts"] == 0, (width, angle, event)
                else:
                    assert event["lowDiveContacts"] > 0, (width, angle, event)
            assert not errors, errors
            page.close()
