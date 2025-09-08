import { defineStore } from 'pinia';
import { userApi } from '../api/services';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    userId: (state) => state.userInfo?.id || 0,
    userName: (state) => state.userInfo?.name || '',
    avatarUrl: (state) => state.userInfo?.avatarUrl || ''
  },
  actions: {
    // 登录
    async login(name: string, password: string, captcha: string) {
      try {
        console.log('发送登录请求:', { name, password, captcha });
        const res = await userApi.login({ name, password, captcha });
        console.log('登录响应:', res);
        if (res.code === 1) {
          this.token = res.data.token;
          this.userInfo = res.data.userInfo;
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo));
          return Promise.resolve(res);
        } else {
          return Promise.reject({ msg: res.msg || '登录失败' });
        }
      } catch (error: any) {
        console.error('登录请求错误:', error);
        return Promise.reject(error);
      }
    },
    // 注册
    async register(name: string, password: string, captcha: string) {
      try {
        console.log('发送注册请求:', { name, password, captcha });
        const res = await userApi.register({ name, password, captcha });
        console.log('注册响应:', res);
        if (res.code === 1) {
          return Promise.resolve(res);
        } else {
          return Promise.reject({ msg: res.msg || '注册失败' });
        }
      } catch (error: any) {
        console.error('注册请求错误:', error);
        return Promise.reject(error);
      }
    },
    // 登出
    async logout() {
      try {
        await userApi.logout();
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        // 清除状态
        this.token = '';
        this.userInfo = {};
        return Promise.resolve();
      } catch (error: any) {
        console.error('登出请求错误:', error);
        return Promise.reject(error);
      }
    }
  }
});