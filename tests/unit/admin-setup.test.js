// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handleApiRequest } from '../../functions/modules/api-router.js';
import { getCallbackToken } from '../../functions/modules/utils.js';

function freshEnv() {
    const values = new Map();
    return {
        MISUB_KV: {
            get: async (key) => values.get(key) ?? null,
            put: async (key, value) => values.set(key, value),
            delete: async (key) => values.delete(key),
        },
    };
}

function request(env, path, init) {
    return handleApiRequest(new Request(`https://example.test/api/${path}`, init), env);
}

function login(env, password) {
    return request(env, 'login', { method: 'POST', body: JSON.stringify({ password }) });
}

describe('post-deploy admin setup', () => {
    it('locks a fresh install, unlocks after setting the secret, and rejects sessions while unconfigured', async () => {
        const env = freshEnv();
        const status = async () => (await request(env, 'public_config')).json();
        expect((await status()).adminSetupRequired).toBe(true);
        expect((await login(env, '')).status).toBe(503);
        env.ADMIN_PASSWORD = crypto.randomUUID();
        expect((await status()).adminSetupRequired).toBe(false);
        const response = await login(env, env.ADMIN_PASSWORD);
        expect(response.status).toBe(200);
        const cookie = response.headers.get('Set-Cookie').split(';')[0];
        delete env.ADMIN_PASSWORD;
        expect(
            (await request(env, 'settings/password', { method: 'POST', headers: { cookie } }))
                .status
        ).toBe(401);
    });

    it('accepts an existing KV password without an environment secret', async () => {
        const env = freshEnv();
        const password = crypto.randomUUID();
        await env.MISUB_KV.put('SYSTEM_ADMIN_PASSWORD', password);
        expect((await login(env, password)).status).toBe(200);
    });

    it('uses a persistent per-installation callback key without COOKIE_SECRET', async () => {
        const env = freshEnv();
        const first = await getCallbackToken(env);
        expect(await getCallbackToken(env)).toBe(first);
        expect(await getCallbackToken(freshEnv())).not.toBe(first);
    });
});
