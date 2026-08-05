/* Geräte-Sync über ein privates GitHub-Gist.
   Token wird NUR in localStorage gehalten – nie im Repo, nie im Backup-Export. */
window.Vamos = window.Vamos || {};

Vamos.sync = (function () {
  var FILE = "vamos-progress.json";

  function cfg() {
    try {
      return JSON.parse(localStorage.getItem("vamos.sync") || "{}");
    } catch (e) { return {}; }
  }
  function saveCfg(c) {
    localStorage.setItem("vamos.sync", JSON.stringify(c));
  }

  function api(path, method, body) {
    var c = cfg();
    if (!c.token) return Promise.reject(new Error("Kein GitHub-Token hinterlegt."));
    return fetch("https://api.github.com" + path, {
      method: method || "GET",
      headers: {
        "authorization": "Bearer " + c.token,
        "accept": "application/vnd.github+json"
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.message || ("GitHub HTTP " + r.status));
        return d;
      });
    });
  }

  /* Gist finden (falls auf diesem Gerät noch keine ID gespeichert ist). */
  function findGist() {
    var c = cfg();
    if (c.gistId) return Promise.resolve(c.gistId);
    return api("/gists?per_page=100").then(function (list) {
      var hit = (list || []).filter(function (g) { return g.files && g.files[FILE]; })[0];
      if (hit) {
        c.gistId = hit.id;
        saveCfg(c);
        return hit.id;
      }
      return null;
    });
  }

  function push() {
    var content = Vamos.store.exportAll();
    return findGist().then(function (id) {
      var files = {};
      files[FILE] = { content: content };
      if (id) {
        return api("/gists/" + id, "PATCH", { files: files });
      }
      return api("/gists", "POST", {
        description: "¡Vamos! Spanisch-Lernfortschritt (privat)",
        "public": false,
        files: files
      }).then(function (d) {
        var c = cfg();
        c.gistId = d.id;
        saveCfg(c);
        return d;
      });
    });
  }

  function pull() {
    return findGist().then(function (id) {
      if (!id) throw new Error("Noch kein Sync-Gist vorhanden – erst von einem Gerät hochladen.");
      return api("/gists/" + id);
    }).then(function (d) {
      var f = d.files && d.files[FILE];
      if (!f) throw new Error("Sync-Datei nicht gefunden.");
      if (f.truncated) {
        return fetch(f.raw_url).then(function (r) { return r.text(); });
      }
      return f.content;
    }).then(function (content) {
      Vamos.store.importAll(content);
    });
  }

  return { cfg: cfg, saveCfg: saveCfg, push: push, pull: pull };
})();
