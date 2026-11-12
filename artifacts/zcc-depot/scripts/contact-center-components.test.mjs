import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  APP_GUIDE_URL, COMPONENT_GUIDE_URL, CONTACT_COMPONENTS,
  SIGN_IN_STEPS, componentConnections, nextSignInStep,
} from "../src/data/contact-center-components.ts";

test("the three selectable components have distinct identities and meaningful details", () => {
  assert.deepEqual(CONTACT_COMPONENTS.map(component => component.id), ["identity", "connect", "app"]);
  for (const component of CONTACT_COMPONENTS) {
    assert.ok(component.title && component.summary && component.description && component.boundary);
    assert.equal(component.points.length, 3);
  }
});

test("selection highlights only the relevant architecture paths", () => {
  assert.deepEqual(componentConnections("identity"), {
    identityConnect: true, connectApp: false, customerConnect: false, agentApp: false,
  });
  assert.deepEqual(componentConnections("connect"), {
    identityConnect: true, connectApp: true, customerConnect: true, agentApp: false,
  });
  assert.deepEqual(componentConnections("app"), {
    identityConnect: false, connectApp: true, customerConnect: false, agentApp: true,
  });
});

test("sign-in explains corporate identity before Zendesk SAML and the AWS targets", () => {
  assert.deepEqual(SIGN_IN_STEPS.map(step => step.id), ["corporate", "zendesk", "aws"]);
  assert.match(SIGN_IN_STEPS[0].subtitle, /Okta.*Entra ID.*Google Workspace/);
  assert.match(SIGN_IN_STEPS[0].description, /MFA and access policies/);
  assert.match(SIGN_IN_STEPS[1].description, /SAML 2\.0/);
  assert.match(SIGN_IN_STEPS[2].subtitle, /Amazon Connect.*Cognito.*AWS Management Console/);
});

test("the sign-in sequence advances safely and stops at its final stage", () => {
  assert.equal(nextSignInStep(0), 1);
  assert.equal(nextSignInStep(1), 2);
  assert.equal(nextSignInStep(2), 2);
  assert.equal(nextSignInStep(99), 2);
  assert.equal(nextSignInStep(-5), 0);
  assert.equal(nextSignInStep(NaN), 1);
});

test("the guide preserves pairing and identity-boundary caveats", () => {
  assert.match(CONTACT_COMPONENTS[1].boundary, /One Contact Center environment.*one Connect instance/);
  assert.match(CONTACT_COMPONENTS[0].boundary, /not a general SAML broker/);
  assert.match(CONTACT_COMPONENTS[0].description, /IdP-initiated SSO/);
});

test("the two official source links retain their exact article destinations", () => {
  assert.equal(COMPONENT_GUIDE_URL, "https://support.zendesk.com/hc/en-us/articles/9829206009242-Understanding-Contact-Center-components");
  assert.equal(APP_GUIDE_URL, "https://support.zendesk.com/hc/en-us/articles/9696121449114");
});

test("map placement survives button resets and wire orientation has separate sizing classes", () => {
  const css = readFileSync(new URL("../src/components/contact-center-components/components-guide.css", import.meta.url), "utf8");
  const map = readFileSync(new URL("../src/components/contact-center-components/component-map.tsx", import.meta.url), "utf8");
  assert.match(css, /\.ccg-layout>\.ccg-a-connect\{grid-area:connect\}/);
  assert.match(css, /\.ccg-layout>\.ccg-a-app\{grid-area:app\}/);
  assert.match(map, /ccg-orient-\$\{orient\}/);
  assert.doesNotMatch(map, /ccg-wire ccg-wire-\$\{orient\}/);
});
