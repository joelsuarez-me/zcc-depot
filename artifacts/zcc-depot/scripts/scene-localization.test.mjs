import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement, act } from "react";
import { create } from "react-test-renderer";
import { NarrationProvider, useNarration } from "../src/components/demo-nuggets/narration-provider.tsx";
import { SCENE_COPY, SCENE_ROLE_LABELS, sceneText } from "../src/components/demo-nuggets/scene-copy.ts";
import { CopilotScene } from "../src/components/demo-nuggets/copilot-scene.tsx";
import { VoiceQaScene } from "../src/components/demo-nuggets/voice-qa-scene.tsx";
import { VoiceAiScene } from "../src/components/demo-nuggets/voice-ai-scene.tsx";
import { VideoSharingScene } from "../src/components/demo-nuggets/video-sharing-scene.tsx";
import { DemoPlayer } from "../src/components/demo-nuggets/demo-player.tsx";
import { DEMO_NUGGETS, getDemoNuggets, DEMO_SCENE_TRANSLATIONS } from "../src/data/demo-nuggets.ts";
import { playbackFrame, stageStart } from "../src/lib/demo-playback.ts";
import { DEMO_SCRIPT_TRANSLATIONS } from "../../api-server/src/lib/demo-script-translations.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const scenes = [CopilotScene, VoiceQaScene, VoiceAiScene, VideoSharingScene];
const locales = ["en-US", "es-ES", "fr-FR"];
const noop = () => {};
const flatten = node => typeof node === "string" ? node : Array.isArray(node)
  ? node.map(flatten).join(" ") : node?.children ? flatten(node.children) : "";

test("every scene/stage translation preserves script identifiers, timing and product names", () => {
  for (const locale of locales) {
    const nuggets = getDemoNuggets(locale);
    assert.equal(nuggets, getDemoNuggets(locale), "localized objects stay stable across renders");
    for (const [i, nugget] of nuggets.entries()) {
      assert.equal(nugget.id, DEMO_NUGGETS[i].id);
      assert.equal(nugget.title, DEMO_NUGGETS[i].title, "product names are not translated");
      assert.deepEqual(nugget.stages.map(s => [s.id, s.durationMs]), DEMO_NUGGETS[i].stages.map(s => [s.id, s.durationMs]));
      if (locale !== "en-US") {
        assert.deepEqual(Object.keys(DEMO_SCRIPT_TRANSLATIONS[locale][nugget.id]), nugget.stages.map(s => s.id));
        assert.deepEqual(Object.keys(DEMO_SCENE_TRANSLATIONS[locale][nugget.id].stages), nugget.stages.map(s => s.id));
        nugget.stages.forEach((stage, j) => {
          assert.ok(stage.label.trim() && stage.description.trim());
          assert.notEqual(stage.label, DEMO_NUGGETS[i].stages[j].label);
          assert.notEqual(stage.description, DEMO_NUGGETS[i].stages[j].description);
        });
      }
    }
  }
  assert.deepEqual(Object.keys(SCENE_ROLE_LABELS), ["caller", "ai-agent", "human-agent", "narrator"]);
  for (const [english, translated] of Object.entries(SCENE_COPY)) {
    assert.equal(sceneText("en-US", english), english);
    assert.equal(translated.length, 2);
    for (const value of translated) assert.ok(value.trim(), `missing translation: ${english}`);
  }
});

function setup() {
  globalThis.document = new EventTarget();
  document.hidden = false;
  globalThis.window = new EventTarget();
  window.location = { search: "" };
  const frames = new Set();
  let frame = 0;
  globalThis.requestAnimationFrame = () => { frames.add(++frame); return frame; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  const calls = { speech: 0, play: 0 };
  globalThis.Audio = class extends EventTarget {
    pause() {} load() {} removeAttribute() {}
    play() { calls.play++; return Promise.resolve(); }
  };
  globalThis.__narrationAuth = { user: { id: "scene-test" }, isAuthenticated: true };
  globalThis.__narrationCatalog = { data: { voices: [], lines: [] } };
  const settings = { enabled: false, voices: {}, volume: 1, captions: true };
  globalThis.__narrationApi = {
    get: async () => settings, save: async value => value,
    speech: async () => { calls.speech++; throw new Error("Scene localization must not generate speech"); },
  };
  return { calls, frames };
}

test("all four scenes localize every stage, idle and completion without English UI leaking", async t => {
  const { calls } = setup();
  let n, i = 0, status = "idle", step = 0, fraction = .2;
  function Scene() {
    n = useNarration();
    const nugget = getDemoNuggets(n.scriptLocale)[i];
    const elapsed = stageStart(nugget.stages, step) + nugget.stages[step].durationMs * fraction;
    const pb = { ...playbackFrame(nugget.stages, elapsed), status, playing: false,
      complete: status === "complete", seekStep: noop, play: noop, replay: noop, pause: noop, reset: noop };
    return createElement(scenes[i], { pb });
  }
  const element = () => createElement(NarrationProvider, { onStop: noop }, createElement(Scene));
  let root;
  await act(async () => { root = create(element()); });
  t.after(async () => { await act(() => root.unmount()); });
  for (const locale of locales) {
    await act(() => n.setScriptLanguage(locale));
    for (i = 0; i < scenes.length; i++) {
      for (const mode of ["idle", "paused", "complete"]) {
        status = mode;
        for (step = 0; step < DEMO_NUGGETS[i].stages.length; step++) {
          for (fraction of [.2, .8]) {
            await act(() => root.update(element()));
            const json = root.toJSON();
            assert.equal(json.props.lang, locale);
            const text = flatten(json);
            assert.ok(text.length > 20);
            if (locale !== "en-US") {
              // Product names and proper names are allowed, but no untranslated
              // copy entry used by these scenes should remain in their output.
              for (const [english, translations] of Object.entries(SCENE_COPY)) {
                if (english.length < 8 || translations.includes(english)) continue;
                assert.ok(!text.includes(english), `${locale} / ${i} / ${step}: English leaked: ${english}`);
              }
            }
          }
        }
      }
    }
    i = 0; step = 0;
  }
  assert.deepEqual(calls, { speech: 0, play: 0 });
});

test("language changes update player stages while preserving seek controls and never start audio", async t => {
  const { calls, frames } = setup();
  let n;
  function Presentation() {
    n = useNarration();
    return createElement("div", null, ...getDemoNuggets(n.scriptLocale).map((nugget, i) =>
      createElement(DemoPlayer, { key: nugget.id, nugget, activeId: null, onActiveChange: noop,
        children: pb => createElement(scenes[i], { pb }) })));
  }
  let root;
  await act(async () => { root = create(createElement(NarrationProvider, { onStop: noop }, createElement(Presentation))); });
  t.after(async () => { await act(() => root.unmount()); assert.equal(frames.size, 0); });
  for (const locale of ["es-ES", "fr-FR", "en-US"]) {
    await act(() => n.setScriptLanguage(locale));
    for (const nugget of getDemoNuggets(locale)) {
      for (const stage of nugget.stages) {
        const button = root.root.findByProps({ "data-testid": `button-step-${nugget.id}-${stage.id}` });
        assert.ok(flatten(button).includes(stage.label));
        await act(() => button.props.onClick());
        assert.equal(root.root.findByProps({ "data-testid": `stage-${nugget.id}` }).props["data-step"], stage.id);
        assert.ok(flatten(root.toJSON()).includes(stage.description));
      }
    }
  }
  assert.deepEqual(calls, { speech: 0, play: 0 });
});
