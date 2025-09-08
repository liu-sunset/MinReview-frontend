import api from './index';

// 图形验证码相关接口
export const captchaApi = {
  // 获取图形验证码图片URL
  getCaptchaImageUrl: () => {
    // 直接返回图片URL，添加时间戳防止缓存
    return `${api.defaults.baseURL}/captcha/image?t=${Date.now()}`;
  },
  
  // 验证图形验证码
  verifyCaptcha: (code: string) => {
    return api.post('/captcha/verify', null, {
      params: { code }
    });
  }
}