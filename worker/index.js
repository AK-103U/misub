import { onRequest } from '../functions/[[path]].js';
import { handleCronTrigger } from '../functions/modules/notifications.js';

export default {
    fetch(request, env, ctx) {
        return onRequest({ request, env, waitUntil: ctx.waitUntil.bind(ctx) });
    },

    async scheduled(_event, env) {
        await handleCronTrigger(env);
    },
};
