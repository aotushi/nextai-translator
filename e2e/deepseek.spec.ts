import { expect, test } from './fixtures'
import { getOptionsPageUrl } from './common'

test('DeepSeek thinking defaults off and can be saved in both states', async ({ page, context, extensionId }) => {
    await context.route('https://api.deepseek.com/v1/models', (route) =>
        route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ data: [{ id: 'deepseek-flash' }, { id: 'deepseek-v4-pro' }] }),
        })
    )
    await page.goto(getOptionsPageUrl(extensionId))
    await page.evaluate(async () => {
        await chrome.storage.sync.set({
            provider: 'DeepSeek',
            deepSeekAPIKey: 'test-api-key',
            deepSeekAPIModel: 'deepseek-flash',
            languageDetectionEngine: 'local',
            i18n: 'en',
            automaticCheckForUpdates: false,
            disableCollectingStatistics: true,
        })
    })
    await page.reload()
    const thinking = page.getByRole('checkbox', { name: 'Enable Thinking', exact: true })
    await expect(thinking).not.toBeChecked()

    for (const enabled of [true, false]) {
        await thinking.locator('xpath=ancestor::label[1]').click()
        await expect(thinking).toBeChecked({ checked: enabled })
        await page.getByRole('button', { name: 'Save', exact: true }).click()
        await expect
            .poll(() => page.evaluate(async () => (await chrome.storage.sync.get('thinkingEnabled')).thinkingEnabled))
            .toBe(enabled)
        await page.reload()
        await expect(thinking).toBeChecked({ checked: enabled })
    }

    const saved = await page.evaluate(async () =>
        chrome.storage.sync.get(['languageDetectionEngine', 'deepSeekAPIKey', 'deepSeekAPIModel'])
    )
    expect(saved).toEqual({
        languageDetectionEngine: 'local',
        deepSeekAPIKey: 'test-api-key',
        deepSeekAPIModel: 'deepseek-flash',
    })
})
