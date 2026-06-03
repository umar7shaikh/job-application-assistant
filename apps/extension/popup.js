const $ = (id) => document.getElementById(id);

async function load() {
  const { appUrl, profile, profileName } = await chrome.storage.local.get([
    "appUrl",
    "profile",
    "profileName",
  ]);
  if (appUrl) $("appUrl").value = appUrl;
  if (profile) {
    $("who").textContent = `Synced: ${profileName || "your profile"}`;
  }
}

function setStatus(el, msg, kind) {
  const node = $(el);
  node.textContent = msg;
  node.className = "status" + (kind ? " " + kind : "");
}

$("sync").addEventListener("click", async () => {
  const appUrl = $("appUrl").value.replace(/\/+$/, "");
  await chrome.storage.local.set({ appUrl });
  setStatus("syncStatus", "Syncing…");
  try {
    const res = await fetch(`${appUrl}/api/profile/export`, {
      credentials: "include",
    });
    if (res.status === 401) {
      setStatus("syncStatus", "Not logged in — open the app and sign in first.", "err");
      return;
    }
    if (res.status === 404) {
      setStatus("syncStatus", "No resume found — add one in the app.", "err");
      return;
    }
    if (!res.ok) {
      setStatus("syncStatus", `Failed (${res.status}).`, "err");
      return;
    }
    const data = await res.json();
    await chrome.storage.local.set({
      profile: data.profile,
      profileName: data.name,
    });
    $("who").textContent = `Synced: ${data.name || "your profile"}`;
    setStatus("syncStatus", "Profile synced ✓", "ok");
  } catch (e) {
    setStatus("syncStatus", "Couldn't reach the app. Check the URL.", "err");
  }
});

$("fill").addEventListener("click", async () => {
  const { profile } = await chrome.storage.local.get(["profile"]);
  if (!profile) {
    setStatus("fillStatus", "Sync your profile first.", "err");
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, {
      type: "LEVER_AUTOFILL",
      profile,
    });
    const n = resp?.filled ?? 0;
    setStatus("fillStatus", `Filled ${n} field${n === 1 ? "" : "s"}. Review before submitting.`, n ? "ok" : "");
  } catch (e) {
    setStatus("fillStatus", "Can't autofill here (try reloading the page).", "err");
  }
});

load();
