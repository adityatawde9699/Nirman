/* Manual-style rendered UI walkthrough. Runs actual React components against FastAPI over stdio.
   Next navigation is replaced with an in-memory router; Happy DOM cannot verify visual layout. */
const path = require("node:path");
const fs = require("node:fs");
const Module = require("node:module");
const { spawn } = require("node:child_process");
const { createInterface } = require("node:readline");
const root = path.resolve(__dirname, "..");
const frontend = path.join(root, "frontend");
const req = Module.createRequire(path.join(frontend, "package.json"));
const ts = req("typescript");
require.extensions[".tsx"] = require.extensions[".ts"] = (m, file) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
require.extensions[".css"] = () => {};
let route = "/";
const listeners = new Set();
const React = req("react");
const router = {
  push: (p) => {
    route = p;
    for (const cb of listeners) cb();
  },
  replace: (p) => {
    route = p;
    for (const cb of listeners) cb();
  },
};
const originalLoad = Module._load;
Module._load = function (id, parent, ...rest) {
  if (id === "next/navigation")
    return {
      usePathname: () =>
        React.useSyncExternalStore(
          (cb) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
          },
          () => route.split("?")[0],
        ),
      useRouter: () => router,
      useSearchParams: () => new URLSearchParams(route.split("?")[1] || ""),
    };
  if (id === "next/link")
    return {
      __esModule: true,
      default: ({ href, children, onClick, ...props }) =>
        React.createElement(
          "a",
          {
            ...props,
            href,
            onClick: (e) => {
              e.preventDefault();
              onClick?.(e);
              router.push(href);
            },
          },
          children,
        ),
    };
  if (id === "next/dynamic")
    return {
      __esModule: true,
      default: (loader) => {
        const C = React.lazy(loader);
        return (props) =>
          React.createElement(
            React.Suspense,
            { fallback: React.createElement("p", null, "Loading graph…") },
            React.createElement(C, props),
          );
      },
    };
  if (id === "@xyflow/react")
    return originalLoad.call(
      this,
      path.join(frontend, "src/components/offline-flow.tsx"),
      parent,
      ...rest,
    );
  if (id === "@xyflow/react/dist/style.css") return {};
  if (id === "@radix-ui/react-slot" || id === "class-variance-authority")
    return originalLoad.call(
      this,
      path.join(frontend, "src/components/offline-primitives.tsx"),
      parent,
      ...rest,
    );
  if (id.startsWith("@/")) id = path.join(frontend, "src", id.slice(2));
  return originalLoad.call(this, id, parent, ...rest);
};
const pending = new Map();
let requestId = 0;
const bridge = spawn(
  path.join(root, "backend/.venv/bin/python"),
  ["-u", path.join(__dirname, "api_bridge.py")],
  { cwd: root, stdio: ["pipe", "pipe", "pipe"] },
);
bridge.stderr.on("data", (d) => process.stderr.write(d));
const ready = new Promise((resolve, reject) => {
  createInterface({ input: bridge.stdout }).on("line", (line) => {
    const r = JSON.parse(line);
    if (r.ready) resolve();
    else {
      pending.get(r.id)?.(r);
      pending.delete(r.id);
    }
  });
  bridge.on("error", reject);
});
async function apiRequest(url, options = {}) {
  await ready;
  const id = ++requestId;
  const item = {
    id,
    path: url.replace(/^\/api/, "/api"),
    method: options.method || "GET",
    headers: Object.fromEntries(new Headers(options.headers)),
  };
  if (options.body instanceof global.FormData) {
    item.data = {};
    for (const [k, v] of options.body.entries()) {
      if (k === "file")
        item.files = {
          name: v.name,
          type: v.type,
          content: Buffer.from(await v.arrayBuffer()).toString("base64"),
        };
      else item.data[k] = v;
    }
  } else if (options.body) item.body = JSON.parse(options.body);
  const response = await new Promise((resolve) => {
    pending.set(id, resolve);
    bridge.stdin.write(JSON.stringify(item) + "\n");
  });
  return {
    ok: response.status < 400,
    status: response.status,
    json: async () => response.body,
  };
}
(async () => {
  const { Window } = await import(
    path.join(frontend, "node_modules/happy-dom/lib/index.js")
  );
  const window = new Window({ url: "http://nirman.demo" });
  for (const key of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLInputElement",
    "HTMLSelectElement",
    "HTMLTextAreaElement",
    "HTMLButtonElement",
    "HTMLAnchorElement",
    "Node",
    "Event",
    "MouseEvent",
    "CustomEvent",
    "MutationObserver",
    "getComputedStyle",
    "localStorage",
    "File",
    "Blob",
    "FormData",
    "ResizeObserver",
  ]) {
    Object.defineProperty(global, key, {
      value:
        key === "window"
          ? window
          : key === "getComputedStyle"
            ? window.getComputedStyle.bind(window)
            : window[key],
      configurable: true,
      writable: true,
    });
  }
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  global.cancelAnimationFrame = clearTimeout;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  global.fetch = apiRequest;
  const { render, screen, waitFor, fireEvent, act, cleanup } = req(
    "@testing-library/react",
  );
  const userEvent = req("@testing-library/user-event").default.setup({
    document: window.document,
  });
  const Nirman = require(
    path.join(frontend, "src/components/nirman.tsx"),
  ).default;
  const steps = [];
  const log = (name) => {
    steps.push(name);
    console.log("PASS " + name);
  };
  const navigate = async (p) => {
    await act(async () => router.push(p));
  };
  const click = async (name) => {
    await userEvent.click(screen.getByRole("button", { name }));
  };
  const waitText = async (text) => {
    await waitFor(
      () => {
        if (!window.document.body.textContent.includes(text))
          throw Error("Waiting for " + text);
      },
      { timeout: 8000 },
    );
  };
  const fill = async (label, value) => {
    const el = screen.getByLabelText(label);
    await userEvent.clear(el);
    await userEvent.type(el, value);
  };
  try {
    await ready;
    render(React.createElement(Nirman));
    await waitText("Your ambition.");
    log("Landing page renders");
    await navigate("/login");
    await click("Enter applicant workspace");
    await waitText("Project overview");
    log("Applicant demo login");
    await navigate("/app/project/new");
    await waitText("A strong start for your business");
    await fill("Project name", "DOM Judging Manufacturing Unit");
    await fill("Company name", "Bharat Chemicals Pvt Ltd");
    await fill("Contact email", "judge@example.in");
    await click("Continue");
    await click("Continue");
    await fill("Site address", "Plot 12, Chakan MIDC, Pune");
    await click("Continue");
    await click("Continue");
    await click("Discover Required Approvals");
    await waitText("12 applicable approvals found");
    log("Five-step project wizard and approval discovery");
    await click("Dependency graph");
    await waitText("42");
    await waitText("Pollution Control Consent");
    log("Dependency graph renders and shows computed critical path");
    await navigate("/app/documents");
    await waitText("Good documents. Fewer delays.");
    await waitText("Required document checklist");
    const report = new window.File(
      ["%PDF-1.4\nJudging report"],
      "Project_Report.pdf",
      { type: "application/pdf" },
    );
    await userEvent.upload(
      window.document.querySelector("input[type=file]"),
      report,
    );
    await waitText("Ready for a closer look");
    await click("Run document validation");
    await waitText("Employee count differs from project profile");
    log("PDF upload, OCR fixture and inconsistency warning");
    await navigate("/app/approvals");
    await waitText("12 applicable approvals found");
    const pollutionCard = [
      ...window.document.querySelectorAll(".approval-card"),
    ].find((el) => el.textContent.includes("Pollution Control Consent"));
    await userEvent.click(pollutionCard.querySelector("button"));
    await click("Submit demo application");
    await waitFor(
      () => {
        if (screen.queryByRole("dialog")) throw Error("Submission pending");
      },
      { timeout: 8000 },
    );
    await navigate("/app/applications");
    await waitText("Bharat Chemicals Pvt Ltd");
    const appLink = [...window.document.querySelectorAll(".table-id")].find(
      (el) => el.closest("tr").textContent.includes("Bharat Chemicals Pvt Ltd"),
    );
    const aid = appLink.textContent;
    log("Application submitted and tracked: " + aid);
    await click("Open profile and switch demo role");
    await click("Government Officer");
    await waitText("Good governance. Clear decisions.");
    await navigate("/officer/applications/" + aid);
    await waitText("AI risk assessment");
    await waitText("Human decision required");
    log("Officer review shows applicant documents and risk factors");
    await click("Request Clarification");
    await click("Send query");
    await waitText("Clarification requested. Applicant notified.");
    log("Officer raises query");
    await click("Open profile and switch demo role");
    await click("Entrepreneur");
    await waitText("Project overview");
    await navigate("/app/documents");
    await waitText("Good documents. Fewer delays.");
    await userEvent.selectOptions(
      screen.getByLabelText("Document category"),
      "Environmental Report",
    );
    await userEvent.upload(
      window.document.querySelector("input[type=file]"),
      new window.File(
        ["%PDF-1.4\nUpdated report"],
        "Environmental_Report.pdf",
        { type: "application/pdf" },
      ),
    );
    await waitText("Environmental_Report.pdf");
    await navigate("/app/applications/" + aid);
    await waitText("Respond to query");
    await click("Respond to query");
    await fill(
      "Your response",
      "Updated environmental report attached for officer review.",
    );
    await click("Submit response");
    await waitText("Applicant Responded");
    log("Applicant uploads update and responds to query");
    await click("Open profile and switch demo role");
    await click("Government Officer");
    await waitText("Good governance. Clear decisions.");
    await navigate("/officer/applications/" + aid);
    await waitText("AI risk assessment");
    await click("Schedule Inspection");
    await click("Confirm schedule");
    await waitText("Inspection Scheduled");
    await navigate("/officer/inspections");
    await waitFor(
      () => {
        if (
          ![...window.document.querySelectorAll(".inspection-card")].some(
            (el) => el.textContent.includes(aid),
          )
        )
          throw Error("Waiting for new inspection");
      },
      { timeout: 8000 },
    );
    const inspectionCard = [
      ...window.document.querySelectorAll(".inspection-card"),
    ].find((el) => el.textContent.includes(aid));
    await userEvent.click(
      [...inspectionCard.querySelectorAll("button")].find((el) =>
        el.textContent.includes("Complete"),
      ),
    );
    await fill(
      "Inspection report",
      "Site inspected. Safety provisions checked. No unresolved findings.",
    );
    await click("Record completed inspection");
    await waitText("Inspection completed. Report saved.");
    log("Officer schedules and completes inspection");
    await navigate("/officer/applications/" + aid);
    await waitText("AI risk assessment");
    await click("Approve");
    await click("Confirm human decision");
    await waitText("Decision recorded: Approved");
    log("Explicit human officer approval");
    await click("Open profile and switch demo role");
    await click("Entrepreneur");
    await waitText("Project overview");
    await navigate("/app/applications/" + aid);
    await waitText("Approved");
    await navigate("/app/compliance");
    await waitText("Pollution Control Consent Renewal");
    log("Applicant tracks decision and generated renewal");
    await navigate("/app/schemes");
    await waitText("Maharashtra Industrial Promotion Subsidy");
    log("Profile-matched scheme recommendations");
    await userEvent.click(
      screen.getByRole("button", { name: /NIRMAN Assistant/ }),
    );
    await click("What documents are missing?");
    await waitText("SOURCE");
    await waitText("EXPLANATION");
    await click("Close assistant");
    log("Regulatory assistant supplies source, rule and explanation");
    await click("Open profile and switch demo role");
    await click("Administrator");
    await waitText("An accountable approval ecosystem");
    await navigate("/admin/rules");
    await waitText("Hazardous materials handling");
    const toggle = screen.getByRole("switch", {
      name: "Enable Hazardous materials handling",
    });
    await userEvent.click(toggle);
    await waitText("Rule disabled");
    log("Admin rule toggle persists");
    await navigate("/admin/audit-logs");
    await waitText("Decision Recorded");
    log("Audit log records the journey");
    const routeChecks = [
      ["/admin/approvals", "Approval catalogue"],
      ["/admin/departments", "Connected departments"],
      ["/admin/analytics", "Progress you can measure"],
    ];
    for (const [r, t] of routeChecks) {
      await navigate(r);
      await waitText(t);
      log("Route " + r);
    }
    await click("Open profile and switch demo role");
    await click("Government Officer");
    await waitText("Good governance. Clear decisions.");
    for (const [r, t] of [
      ["/officer/applications", "Application workbench"],
      ["/officer/review", "Application workbench"],
      ["/officer/queries", "Clarifications without the confusion"],
    ]) {
      await navigate(r);
      await waitText(t);
      log("Route " + r);
    }
    await click("Open profile and switch demo role");
    await click("Entrepreneur");
    await waitText("Project overview");
    for (const [r, t] of [
      ["/app/projects", "Your projects"],
      ["/app/project/p1", "Industrial profile"],
      ["/app/approvals/a2", "Pollution Control Consent"],
      ["/app/notifications", "The updates that move you forward"],
    ]) {
      await navigate(r);
      await waitText(t);
      log("Route " + r);
    }
    if (screen.queryByRole("dialog")) await click("Close dialog");
    await navigate("/register");
    await waitText("Begin your journey.");
    await fill("Full name", "UI Judging Applicant");
    await fill("Email address", "ui-judge@example.in");
    await click("Create applicant account");
    await waitText("Project overview");
    log("Applicant registration and empty workspace");
    fs.writeFileSync(
      path.join(root, "output/playwright/dom-walkthrough.json"),
      JSON.stringify(
        {
          mode: "Happy DOM with real FastAPI ASGI requests; not a browser/layout test",
          passed: steps,
        },
        null,
        2,
      ),
    );
    console.log("Rendered end-to-end journey passed.");
    cleanup();
    bridge.stdin.end();
    await window.happyDOM.close();
    process.exitCode = 0;
  } catch (e) {
    fs.writeFileSync(
      path.join(root, "output/playwright/dom-failure.html"),
      window.document.body.innerHTML,
    );
    console.error(e.message.slice(0, 1500));
    cleanup();
    bridge.kill();
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error(e);
  bridge.kill();
  process.exitCode = 1;
});
