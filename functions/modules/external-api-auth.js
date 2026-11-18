import { createExternalError, getExternalApiSettings } from './external-api-utils.js';

import { getAdminPassword } from './utils.js';

export async function authenticateExternalApiRequest(request, env, storageAdapter = null) {
    const settings = await getExternalApiSettings(env, storageAdapter);
    if (settings.enabled !== true) {
        return {
            ok: false,
            response: createExternalError('forbidden', 'External API is disabled', 403),
        };
    }

    const authorization = request.headers.get('Authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return {
            ok: false,
            response: createExternalError('unauthorized', 'Invalid or missing bearer token', 401),
        };
    }

    const token = match[1].trim();
    const tokens = Array.isArray(settings.tokens) ? settings.tokens : [];
    const matchedToken = tokens.find((item) => String(item?.token || '') === token);
    if (!matchedToken) {
        return {
            ok: false,
            response: createExternalError('unauthorized', 'Invalid or missing bearer token', 401),
        };
    }

    if (!(await getAdminPassword(env))) {
        return {
            ok: false,
            response: createExternalError('forbidden', 'Admin access is not configured', 403),
        };
    }

    return {
        ok: true,
        tokenName: matchedToken.name || 'default',
    };
}
