// Lever Autofill — fills application form fields from the synced profile.
// Heuristic, best-effort, and non-destructive (it never submits).

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "LEVER_AUTOFILL") {
    try {
      sendResponse({ filled: autofill(msg.profile) });
    } catch (e) {
      sendResponse({ filled: 0, error: String(e) });
    }
  }
  return true;
});

function autofill(profile) {
  const c = profile.contact || {};
  const nameParts = (c.fullName || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Ordered rules: [test(descriptor) -> value]. First match wins.
  const rules = [
    [(d) => /e-?mail/.test(d), c.email],
    [(d) => /(phone|mobile|tel|contact number)/.test(d), c.phone],
    [(d) => /(first name|given name|fname|forename)/.test(d), firstName],
    [(d) => /(last name|surname|family name|lname)/.test(d), lastName],
    [(d) => /linked-?in/.test(d), c.linkedin],
    [(d) => /git-?hub/.test(d), c.github],
    [(d) => /(portfolio|website|personal site|url)/.test(d) && !/linked|git/.test(d), c.website],
    [(d) => /(city|location|address|town)/.test(d), c.location],
    [
      (d) => /(full name|your name|candidate name|applicant name|^name$|\bname\b)/.test(d) &&
        !/(user|login|file|company|first|last|middle)/.test(d),
      c.fullName,
    ],
  ];

  const answers = Array.isArray(profile.customAnswers) ? profile.customAnswers : [];

  let filled = 0;
  const fields = document.querySelectorAll(
    "input, textarea, select"
  );

  for (const el of fields) {
    if (!isFillable(el)) continue;
    const d = descriptor(el);
    if (!d) continue;

    let value = "";
    for (const [test, v] of rules) {
      if (v && test(d)) {
        value = v;
        break;
      }
    }
    // Fall back to saved custom answers (e.g. work authorization).
    if (!value && answers.length) value = matchAnswer(d, answers);
    if (!value) continue;

    if (setFieldValue(el, value)) filled++;
  }
  return filled;
}

function isFillable(el) {
  if (el.disabled || el.readOnly) return false;
  if (el.type && ["password", "hidden", "file", "submit", "button", "checkbox", "radio"].includes(el.type)) {
    return false;
  }
  if (el.offsetParent === null && el.tagName !== "SELECT") return false; // not visible
  // Skip fields the user already filled.
  if (el.value && el.value.trim().length > 0) return false;
  return true;
}

function descriptor(el) {
  const parts = [
    el.getAttribute("autocomplete"),
    el.getAttribute("name"),
    el.id,
    el.getAttribute("aria-label"),
    el.getAttribute("placeholder"),
    labelText(el),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function labelText(el) {
  if (el.id) {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl) return lbl.textContent || "";
  }
  const wrap = el.closest("label");
  if (wrap) return wrap.textContent || "";
  return "";
}

function matchAnswer(d, answers) {
  let best = "";
  let bestScore = 0;
  for (const qa of answers) {
    const words = String(qa.question || "")
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 4);
    const score = words.reduce((n, w) => (d.includes(w) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = qa.answer || "";
    }
  }
  return bestScore > 0 ? best : "";
}

function setFieldValue(el, value) {
  if (el.tagName === "SELECT") {
    const opt = Array.from(el.options).find(
      (o) =>
        o.textContent.trim().toLowerCase() === value.toLowerCase() ||
        o.value.toLowerCase() === value.toLowerCase()
    );
    if (!opt) return false;
    el.value = opt.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // Use the native setter so React/Vue controlled inputs register the change.
  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}
