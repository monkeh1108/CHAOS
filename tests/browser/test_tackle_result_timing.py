
"""Verify the result follows the existing tackle fall without extending live play."""


def test_tackle_result_waits_for_landing(browser_session, standalone_html):
    clock = """
    <script>
    const frameQueue = [];
    let frameTime = 100;
    window.requestAnimationFrame = callback => frameQueue.push(callback);
    window.stepDisplay = delta => {
      frameTime += delta;
      for (const callback of frameQueue.splice(0)) callback(frameTime);
    };
    </script>
    """
    html = standalone_html.replace("</head>", clock + "</head>", 1)
    html = html.replace(
        "createGame({ attach: attachGameBrowser });",
        "createGame({ attach: attachGameBrowser }, 8933);",
        1,
    )
    with browser_session(headless=True) as browser:
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.set_content(html, wait_until="load")
        reports = page.evaluate(
            """() => {
              const game = GRIDIRON_DEBUG;
              const result = () => document.getElementById("overlay");
              const snap = () => document.getElementById("snap");
              const visible = () => result().classList.contains("visible");
              const require = (ok, message) => { if (!ok) throw Error(message); };
              const reports = [];
              stepDisplay(16);
              const initial = game.captureSnapshot();

              function verifyLanding(event, hz, play) {
                const down = game.getState();
                const runner = () => game.getState().players.find(p => p.key === event.landingRunner);
                require(down.phase === "dead" && runner().ground.stage === "fall",
                  "The rules already resolved and the fall is beginning");
                require(!visible() && snap().disabled, "No result during the fall");
                require(!document.getElementById("message").textContent.startsWith(event.heading + "."),
                  "The play-ending message also waits");
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                window.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
                require(game.getState().phase === "dead", "Early Enter cannot skip landing");

                const partner = () =>
                  game.getState().players.find(p => p.key === event.landingPartner);
                const falling = () =>
                  runner().ground?.stage === "fall" || partner()?.ground?.stage === "fall";
                let frames = 0;
                while (falling() && frames < 120) {
                  require(!visible(), "Result must wait for the down pose");
                  stepDisplay(1000 / hz);
                  frames++;
                }
                require(runner().ground?.stage === "winded", "Landing reached");
                require(!falling(), "Both recorded falls have landed");
                require(visible() && !snap().disabled, "Result appears on the down pose");
                require(document.getElementById("message").textContent.startsWith(event.heading + "."),
                  "Play-ending message appears with the result");
                require(game.getState().yard === down.yard, "The spot stays fixed");
                require(document.getElementById("resultText").textContent === event.heading,
                  "The original result is preserved");
                reports.push({ play, hz, seconds: frames / hz });
              }

              for (const [play, hz] of [["scrimmage", 30], ["return", 120]]) {
                let found = false;
                for (let seed = 431; seed < 445 && !found; seed++) {
                  if (play === "return") {
                    game.newGame();
                    game.debugFinishCoinToss("heads", "receive");
                    game.debugSeed(seed);
                    require(game.startKick(), "Start kickoff");
                  } else {
                    game.debugSeed(seed);
                    game.reset();
                    game.select("stretch");
                    game.snap();
                  }
                  for (let tick = 0; tick < 420 && game.getState().phase === "live"; tick++) {
                    const event = game.advanceTick([]).find(e => e.type === "resultShown");
                    if (!event) continue;
                    if (event.landingRunner) {
                      verifyLanding(event, hz, play);
                      found = true;
                    } else {
                      require(visible(), "Results without a fall appear immediately");
                    }
                  }
                }
                require(found, "Expected a recorded fall for " + play);
              }
              for (const [play, balance] of [["paired sack", .35], ["standing sack", 1]]) {
                game.restoreSnapshot(initial);
                game.debugFinishCoinToss("heads", "receive");
                game.reset();
                game.debugSeed(431);
                game.select("verticals");
                game.snap();
                for (const p of game.getState().players)
                  game.debugMovePlayer(p.key, p.team ? 106 : 17, p.team ? 48 : 2);
                game.debugMovePlayer("QB", 27, 26);
                game.debugMovePlayer("MLB", 27, 26.68);
                game.debugSetDefenderState("MLB", {
                  face: -Math.PI / 2, blocked: 0, stun: 0, tackleCooldown: 0, action: null,
                });
                game.debugSetBalance("MLB", balance);
                let resultEvent, wrap;
                for (let tick = 0; tick < 120 && game.getState().phase === "live"; tick++) {
                  const events = game.advanceTick([]);
                  resultEvent = events.find(e => e.type === "resultShown");
                  wrap = events.find(e => e.type === "wrapFinished");
                }
                require(resultEvent?.heading === "QUARTERBACK SACK", "Expected a sack");
                require(!game.getState().ballCarrier && !game.getState().passThrown,
                  "The sack uses implicit pre-pass possession");
                require(resultEvent.landingRunner === "QB", "The result identifies the QB");
                require(wrap?.runner === "QB" && wrap.wraps.some(x => x.defender === "MLB"),
                  "The completed grip identifies both participants");
                const paired = balance < 1;
                const defender = () => game.getState().players.find(p => p.key === "MLB");
                require((defender().ground?.stage === "fall") === paired, "Recorded defender outcome");
                require(resultEvent.landingPartner === (paired ? "MLB" : undefined),
                  "The result waits only for a recorded partner");
                verifyLanding(resultEvent, 120, play);
                require(!paired || defender().ground?.stage === "winded", "The defender landed");
                for (let frame = 0; frame < 150; frame++) stepDisplay(1000 / 120);
                require(!defender().ground && !game.getState().players.find(p => p.key === "QB").ground,
                  "Ordinary recovery clocks complete after the result");
              }

              game.reset();
              game.select("stretch");
              game.snap();
              game.debugWhistle("tackle");
              require(visible() && !snap().disabled, "Standing finish is immediate");
              return reports;
            }"""
        )
        assert [item["play"] for item in reports] == ["scrimmage", "return", "paired sack", "standing sack"]
        assert all(0.24 <= item["seconds"] <= 0.29 for item in reports), reports
        assert reports[2]["seconds"] > reports[3]["seconds"], reports
        assert not errors, errors
