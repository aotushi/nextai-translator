# DeepSeek translation without thinking

In NextAI Translator settings:

1. Choose **DeepSeek** as the provider and enter your DeepSeek API key.
2. Select **deepseek-flash** from the model list.
3. Leave **Enable Thinking** off for faster everyday translations. Turn it on when you want the model to reason before answering.
4. Choose **Local** for language detection to avoid a separate online detection request.
5. Click **Save**.

The thinking preference is saved with the other settings. It applies to DeepSeek requests, including actions that override the model. Switching the preference uses a separate translation cache, so a result from the other mode is not reused.

DeepSeek controls thinking per request; it is not an account-wide setting in the DeepSeek console. This build sends `thinking.type` as `disabled` or `enabled`, matching the checkbox. Older settings without this preference default to disabled.

See [DeepSeek's thinking-mode documentation](https://api-docs.deepseek.com/guides/thinking_mode/).

## Install the browser extension locally

Install dependencies with `pnpm install --frozen-lockfile`, then run:

```sh
node scripts/build-edge.mjs
```

Open `edge://extensions`, enable **Developer mode**, click **Load unpacked**, and select `dist/browser-extension/chromium` inside this repository. Keep that folder in place; Edge loads the extension from it. After rebuilding, click **Reload** on the extension card.

When replacing an existing installation, pass its manifest to retain the public key and extension ID:

```sh
node scripts/build-edge.mjs --identity-from /path/to/existing/manifest.json --version 0.6.2.1
```

Back up the existing extension data before installation; do not uninstall the old extension first. API keys belong in browser settings, never in the repository or extension package. The builder reads only the existing public manifest, not browser settings or API keys.
