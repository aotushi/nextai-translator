import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeepSeek } from './deepseek'
import { fetchSSE, getSettings } from '../utils'
import { ISettings } from '../types'
import { IMessageRequest } from './interfaces'

vi.mock('../utils', () => ({
    defaultAPIURL: 'https://api.openai.com',
    defaultAPIURLPath: '/v1/chat/completions',
    fetchSSE: vi.fn(),
    getSettings: vi.fn(),
}))

describe('DeepSeek thinking control', () => {
    let settings: Partial<ISettings>
    let request: IMessageRequest

    beforeEach(() => {
        vi.clearAllMocks()
        settings = { deepSeekAPIModel: 'deepseek-flash', deepSeekAPIKey: 'test-api-key' }
        vi.mocked(getSettings).mockImplementation(async () => settings as ISettings)
        request = {
            rolePrompt: 'You are a translator.',
            commandPrompt: 'Translate hello into Chinese.',
            onMessage: vi.fn().mockResolvedValue(undefined),
            onError: vi.fn(),
            onFinished: vi.fn(),
            signal: new AbortController().signal,
        }
        vi.mocked(fetchSSE).mockImplementation(async (_url, options) => {
            await options.onMessage(JSON.stringify({ choices: [{ delta: { content: '你好' } }] }))
            await options.onMessage('[DONE]')
        })
    })

    it.each([
        [undefined, 'disabled'],
        [false, 'disabled'],
        [true, 'enabled'],
    ] as const)('sends the requested thinking mode when the setting is %s', async (enabled, expectedType) => {
        settings.thinkingEnabled = enabled

        await new DeepSeek().sendMessage(request)

        expect(fetchSSE).toHaveBeenCalledOnce()
        const [url, options] = vi.mocked(fetchSSE).mock.calls[0]
        const body = JSON.parse(options.body as string)
        expect(url).toBe('https://api.deepseek.com/v1/chat/completions')
        expect(body).toMatchObject({
            model: 'deepseek-flash',
            stream: true,
            thinking: { type: expectedType },
            messages: [{ role: 'user', content: 'You are a translator.\n\nTranslate hello into Chinese.' }],
        })
        expect(body).not.toHaveProperty('reasoning_effort')
        expect(request.onMessage).toHaveBeenCalledWith({ content: '你好', role: undefined })
        expect(request.onFinished).toHaveBeenCalledWith('stop')
        expect(request.onError).not.toHaveBeenCalled()
    })

    it('applies a saved mode change to the next request, including per-action model overrides', async () => {
        const engine = new DeepSeek()
        settings.thinkingEnabled = true
        await engine.sendMessage(request)

        settings.thinkingEnabled = false
        await engine.sendMessage({ ...request, modelOverride: 'deepseek-v4-pro' })

        const bodies = vi.mocked(fetchSSE).mock.calls.map(([, options]) => JSON.parse(options.body as string))
        expect(bodies[0]).toMatchObject({ model: 'deepseek-flash', thinking: { type: 'enabled' } })
        expect(bodies[1]).toMatchObject({ model: 'deepseek-v4-pro', thinking: { type: 'disabled' } })
    })
})
