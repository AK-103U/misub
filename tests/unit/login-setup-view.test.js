import { expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import Login from '../../src/components/modals/Login.vue';
import { useSessionStore } from '../../src/stores/session.js';

it('replaces the login form with setup instructions only while configuration is missing', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const session = useSessionStore();
    session.publicConfig.adminSetupRequired = true;
    const wrapper = mount(Login, { props: { login: vi.fn() }, global: { plugins: [pinia] } });
    expect(wrapper.text()).toContain('ADMIN_PASSWORD');
    expect(wrapper.find('form').exists()).toBe(false);
    session.publicConfig.adminSetupRequired = false;
    await nextTick();
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('ADMIN_PASSWORD');
    wrapper.unmount();
});
