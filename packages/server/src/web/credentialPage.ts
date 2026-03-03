type CredentialVariant = {
  key: string
  label: string
  schema: any
  hintMarkdown?: string | null
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderCredentialPage(params: {
  integrationId: string
  integrationType: string
  integrationLabel: string
  variants: CredentialVariant[]
  defaultVariantKey?: string | null
  hasCredentials: boolean
  postUrl: string
}): string {
  const title = `${params.integrationLabel} credentials`
  const variantsJson = JSON.stringify(params.variants || [])
  const defaultVariantKey = params.defaultVariantKey || (params.variants[0]?.key ?? '')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; padding: 24px; }
      .card { max-width: 760px; margin: 0 auto; border: 1px solid rgba(127,127,127,.25); border-radius: 12px; padding: 20px; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      .muted { opacity: 0.75; font-size: 13px; }
      .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin: 12px 0; }
      label { display:block; font-size: 13px; margin-bottom: 6px; opacity: 0.85; }
      select, input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(127,127,127,.35); background: transparent; }
      .field { margin: 12px 0; }
      .hint { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; opacity: 0.85; padding: 12px; border-radius: 10px; border: 1px solid rgba(127,127,127,.25); }
      .actions { display:flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
      button { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(127,127,127,.35); background: rgba(127,127,127,.12); cursor: pointer; }
      button.primary { background: #2563eb; border-color: #2563eb; color: white; }
      .status { margin-top: 10px; font-size: 13px; }
      .ok { color: #16a34a; }
      .err { color: #dc2626; }
      .badge { display:inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid rgba(127,127,127,.25); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="row" style="justify-content: space-between">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <div class="muted">Integration: <span class="badge">${escapeHtml(params.integrationType)}</span> &nbsp; ID: <span class="badge">${escapeHtml(params.integrationId)}</span></div>
        </div>
        <div class="badge">${params.hasCredentials ? 'Connected' : 'Not connected'}</div>
      </div>

      <div class="muted">Enter credentials below. These are stored encrypted at rest and never shown to the MCP client.</div>

      <div class="row">
        <div style="flex: 1; min-width: 260px">
          <label for="variant">Credential type</label>
          <select id="variant"></select>
        </div>
      </div>

      <div id="hint" class="hint" style="display:none"></div>

      <form id="form">
        <div id="fields"></div>
        <div class="actions">
          <button type="submit" class="primary">Save credentials</button>
        </div>
        <div id="status" class="status"></div>
      </form>
    </div>

    <script>
      const VARIANTS = ${variantsJson};
      const DEFAULT_VARIANT = ${JSON.stringify(defaultVariantKey)};
      const POST_URL = ${JSON.stringify(params.postUrl)};

      const elVariant = document.getElementById('variant');
      const elFields = document.getElementById('fields');
      const elHint = document.getElementById('hint');
      const elStatus = document.getElementById('status');
      const elForm = document.getElementById('form');

      function isSecretField(key) {
        const lower = String(key || '').toLowerCase();
        return lower.includes('token') || lower.includes('key') || lower.includes('secret') || lower.includes('password') || lower.includes('json');
      }

      function setStatus(msg, kind) {
        elStatus.textContent = msg || '';
        elStatus.className = 'status ' + (kind || '');
      }

      function renderFields(variantKey) {
        const v = VARIANTS.find(x => x.key === variantKey) || VARIANTS[0];
        elFields.innerHTML = '';

        const hint = v && v.hintMarkdown ? String(v.hintMarkdown) : '';
        if (hint.trim()) {
          elHint.style.display = 'block';
          elHint.textContent = hint;
        } else {
          elHint.style.display = 'none';
          elHint.textContent = '';
        }

        const props = (v && v.schema && v.schema.properties) ? v.schema.properties : {};
        const entries = Object.entries(props);
        if (!entries.length) {
          const div = document.createElement('div');
          div.className = 'muted';
          div.textContent = 'No credential fields for this variant.';
          elFields.appendChild(div);
          return;
        }

        for (const [key, prop] of entries) {
          const wrap = document.createElement('div');
          wrap.className = 'field';

          const label = document.createElement('label');
          label.setAttribute('for', 'f_' + key);
          label.textContent = (prop && prop.title) ? prop.title : key;
          wrap.appendChild(label);

          const input = document.createElement('input');
          input.id = 'f_' + key;
          input.name = key;
          input.type = isSecretField(key) ? 'password' : 'text';
          input.placeholder = 'env:MY_TOKEN or actual value';
          wrap.appendChild(input);

          if (prop && prop.description) {
            const d = document.createElement('div');
            d.className = 'muted';
            d.style.marginTop = '6px';
            d.textContent = prop.description;
            wrap.appendChild(d);
          }

          elFields.appendChild(wrap);
        }
      }

      function init() {
        elVariant.innerHTML = '';
        for (const v of VARIANTS) {
          const opt = document.createElement('option');
          opt.value = v.key;
          opt.textContent = v.label || v.key;
          elVariant.appendChild(opt);
        }
        elVariant.value = DEFAULT_VARIANT || (VARIANTS[0] ? VARIANTS[0].key : '');
        renderFields(elVariant.value);
      }

      elVariant.addEventListener('change', () => {
        setStatus('', '');
        renderFields(elVariant.value);
      });

      elForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setStatus('Saving…', '');

        const data = {};
        data.credentialVariant = elVariant.value;
        const inputs = elForm.querySelectorAll('input[name]');
        for (const input of inputs) {
          const v = String(input.value || '').trim();
          if (v) data[input.name] = v;
        }

        try {
          const resp = await fetch(POST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text || ('HTTP ' + resp.status));
          }
          setStatus('Credentials saved. You can go back to your chat now.', 'ok');
        } catch (err) {
          setStatus('Failed to save credentials: ' + (err && err.message ? err.message : String(err)), 'err');
        }
      });

      init();
    </script>
  </body>
</html>`
}

