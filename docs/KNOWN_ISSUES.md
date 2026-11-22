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
