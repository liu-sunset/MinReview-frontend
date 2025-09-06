import axios from 'axios';

// 创建管理端axios实例
const adminApi = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
adminApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
adminApi.interceptors.response.use(
  response => {
    const { code, msg, data } = response.data;
    if (code === 1) {
      return { code, msg, data };
    } else {
      return Promise.reject({ code, msg });
    }
  },
  error => {
    console.error('管理端API请求错误:', error);
    
    // 处理网络错误
    if (!error.response) {
      return Promise.reject({ msg: '网络连接失败，请检查后端服务是否启动' });
    }
    
    // 处理401未授权错误
    if (error.response.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
      return Promise.reject({ msg: '登录已过期，请重新登录' });
    }
    
    // 处理其他HTTP状态码错误
    const errorData = error.response.data || { msg: '请求失败' };
    return Promise.reject(errorData);
  }
);

export default adminApi;