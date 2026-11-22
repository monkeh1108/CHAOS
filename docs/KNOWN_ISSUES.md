# Known issues

## Legacy Node QA scripts fail on CRLF HTML

`qa_task001_rear_contact.js:40`, `qa_task003_possession_marker.js:52` and
`qa_task010_receiver_icons.js:55` assert that a marker containing a literal
LF occurs in raw HTML. Running the scripts against the CRLF Windows
standalone reproduces `assert.ok(labStart > 0)` before any gameplay assertions.
Pass an LF-only temporary copy of the same HTML as the first CLI argument to
get past the assertion. The existing files retain their original behavior.


Phase 2 normalizes line endings in the three test readers. The Phase 1 script names are `rear_pile_contact.test.js`,
`possession_marker.test.js` and `receiver_icons.test.js` in
`tests/integration/`.
## Browser suite baseline

The Playwright cases listed in the [refactor baseline](refactor/BASELINE.md)
can fail on the original standalone. The refactor keeps these tests in the
suite so future changes can be compared against the same assertions.

The Inside Zone fixture expects at least one combination block from an
unseeded setup. During Phase 3b, 12 of 60 controlled seeds produced zero
combination blocks on both the original and refactored builds, with matching
assignments for every tested seed.

The unseeded low-contact fixture can report minor leg contact where it
expects a trip. This appeared on earlier refactor branches. The Phase 3b
comparison with controlled steps and ten fixed seeds produced the same trip
outcome on the original and refactored builds.
