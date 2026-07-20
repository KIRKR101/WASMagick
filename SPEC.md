# Task: build golden-image parity tests for magick-wasm

## Goal

For every ImageMagick operation exposed in the Svelte UI, verify that magick-wasm's output matches the output of the native ImageMagick CLI, within a defined tolerance.

This is a local, manually-run test suite — no CI integration.

## Prerequisites — do this first

1. Find the exact ImageMagick core version bundled by the installed `magick-wasm` package (check `node_modules/@imagemagick/magick-wasm/package.json`, its changelog, or the release notes for the installed version).
2. Report that version number back and **stop here**. Do not proceed to Step 2 (golden generation script) until a portable ImageMagick binary matching that version has been supplied and its path confirmed.
3. Once supplied, record the binary's path (e.g. `tooling/imagemagick/magick.exe`) and the version it reports (`magick.exe -version`) in `fixtures/golden/manifest.json` alongside every generated fixture, so version drift is traceable later.

No Docker dependency — all native-CLI invocations in this spec use the local portable binary's path directly rather than `docker run`.

## Directory layout to create

```
test/
  fixtures/
    source/              # small set of varied source images (see below)
    golden/               # CLI-generated expected outputs, one subfolder per operation
      resize/
      rotate/
      blur/
      modulate/
      crop/
      ...
  golden-gen/
    generate.sh           # script that regenerates golden/ from source/ via the portable CLI binary
  tooling/
    imagemagick/           # portable, version-pinned ImageMagick binary (supplied manually, checked in or gitignored per team preference)
  parity/
    *.test.ts             # one test file per operation, mirrors the Svelte call path
    compare.ts             # shared pixel-diff utility
```

## Step 1 — source fixture set

Generate or source a small set of test images covering:
- Even and odd pixel dimensions (e.g. 100×100 and 101×99)
- With and without alpha channel
- 8-bit and 16-bit depth if the UI exposes depth-affecting operations
- At least one image with an embedded ICC colour profile
- PNG and JPEG source formats (if both are supported input types in the UI)

Keep these under version control. Small (under ~200×200px) to keep the fixture set light.

## Step 2 — golden generation script

Write `golden-gen/generate.sh`. For each operation the Svelte UI exposes, run the *exact* CLI equivalent of the args the UI sends to magick-wasm, via the portable binary at `tooling/imagemagick/`, and write output into `fixtures/golden/<operation>/`.

Requirements:
- One CLI invocation per (source image × operation × parameter set) the UI supports.
- Script must be idempotent and re-runnable — this is the source of truth, regenerated whenever the UI's ImageMagick argument construction changes.
- Print the exact command used for each fixture into a manifest file (`fixtures/golden/manifest.json`) mapping fixture path → CLI args used, so future contributors can trace how each golden file was produced.

## Step 3 — enumerate operations to cover

Audit the codebase for every distinct ImageMagick call the Svelte app makes (search for magick-wasm API usage — resize, crop, rotate, modulate, blur, sharpen, colour/gamma adjustments, format conversion, composite/overlay, annotate/text if present, etc.). Produce a checklist of operation × parameter-variant combinations actually reachable from the UI. Each item on this checklist needs at least one golden fixture and one parity test.

Flag explicitly, rather than silently skip, any operation involving:
- Text rendering / fonts (`-annotate`, captions) — magick-wasm typically has no system fonts bundled, so this needs either an embedded font asset used identically in both CLI and WASM paths, or explicit exclusion from parity testing with a comment explaining why.
- Multi-threaded filters (certain blur/convolution kernels) where output can vary by a few units due to floating-point reduction order — these need a wider tolerance, not a bug report.

## Step 4 — pixel comparison utility

Build `parity/compare.ts`:
- Decode both expected and actual images to raw RGBA buffers.
- Use `pixelmatch` (or equivalent) for a per-pixel diff, with a configurable `threshold` (per-pixel channel tolerance) and `maxDiffPixels` (fraction of total pixels allowed to differ).
- Default thresholds: start strict (`threshold: 0.05`, `maxDiffPixels: 0`) and only loosen per-operation where a known-cause divergence is documented (e.g. JPEG re-encoding, threaded blur).
- On failure, write the diff image to a `test-results/` (or CI artifact) directory alongside expected/actual, so a human can visually inspect it without rerunning locally.

## Step 5 — parity test files

For each operation, write a test that:
1. Loads the relevant source fixture(s).
2. Calls the operation through the **actual Svelte component / store logic** that the UI uses — not a shortcut reimplementation. If the parameter-building logic lives in a shared utility function, call that function directly rather than duplicating the argument construction in the test.
3. Runs the result through `compare.ts` against the matching golden fixture.
4. Asserts diff is within threshold.

Test each operation in isolation (one operation per test), not only as part of a full multi-step user workflow — isolate failures to a specific transform rather than a pipeline.

## Step 6 — running it locally

- Add an npm script (e.g. `test:parity`) that runs the parity test suite on demand — no CI job, no scheduled job.
- On failure, write the `test-results/` diff artefacts locally so they can be opened and inspected directly, without needing a CI run to retrieve them.
- Regenerate goldens manually (`golden-gen/generate.sh`) whenever the UI's argument construction changes or the portable binary is updated — this is a manual step, not automated.

## Step 7 — documentation

Add a `test/parity/README.md` explaining:
- How to regenerate golden fixtures.
- The pinned ImageMagick version, where the portable binary lives, and how to update it when magick-wasm's bundled version changes.
- Known, accepted divergence points and their tolerances (fonts, threading, JPEG re-encoding), with the reasoning, so future contributors don't "fix" an expected tolerance.

## Definition of done

- Every ImageMagick operation reachable from the Svelte UI has at least one golden fixture and one passing parity test.
- Running `test:parity` locally surfaces any unexplained divergence beyond documented tolerances.
- README documents the pinned version and every accepted tolerance with its cause.
