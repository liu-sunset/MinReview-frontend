<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">管理端登录</h1>
        <p class="login-subtitle">MinReview 校园餐厅点评系统</p>
      </div>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            class="login-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            class="login-input"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item prop="captcha">
          <div class="captcha-container">
            <el-input
              v-model="loginForm.captcha"
              placeholder="验证码"
              size="large"
              prefix-icon="Picture"
              class="login-input captcha-input"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img v-if="captchaImageUrl" :src="captchaImageUrl" alt="验证码" />
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Picture } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../store'
import { captchaApi } from '../api/captcha'

// 路由实例
const router = useRouter()

// 管理员状态
const adminStore = useAdminStore()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const captchaImageUrl = ref('')

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度应为4-6个字符', trigger: 'blur' }
  ]
}

// 获取验证码图片
const getCaptchaImage = () => {
  try {
    captchaImageUrl.value = captchaApi.getCaptchaImageUrl()
  } catch (error) {
    ElMessage.error('获取验证码失败')
  }
}

// 刷新验证码
const refreshCaptcha = () => {
  getCaptchaImage()
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    // 表单验证
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    // 调用登录API
    await adminStore.login({
      username: loginForm.username,
      password: loginForm.password,
      captcha: loginForm.captcha
    })
    
    // 登录成功
    ElMessage.success('登录成功')
    
    // 跳转到管理端首页
    router.push('/admin/dashboard')
  } catch (error: any) {
    loading.value = false
    ElMessage.error(error.msg || '登录失败，请检查用户名和密码')
    // 登录失败后刷新验证码
    refreshCaptcha()
    loginForm.captcha = ''
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取验证码
onMounted(() => {
  getCaptchaImage()
})
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px 32px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 14px;
  color: #666666;
  margin: 0;
  font-weight: 400;
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.login-input {
  :deep(.el-input__wrapper) {
    border-radius: 12px;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #c0c0c0;
    }
    
    &.is-focus {
      border-color: #333333;
      box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.1);
    }
  }
  
  :deep(.el-input__inner) {
    color: #333333;
    
    &::placeholder {
      color: #999999;
    }
  }
  
  :deep(.el-input__prefix-inner) {
    color: #666666;
  }
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  background: #333333;
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: #555555;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.is-loading {
    background: #666666;
  }
}

.captcha-container {
  display: flex;
  gap: 10px;
  align-items: center;
  
  .captcha-input {
    flex: 1;
  }
  
  .captcha-image {
    width: 120px;
    height: 48px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #409eff;
      background: #ecf5ff;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 3px;
    }
    
    .captcha-loading {
      font-size: 12px;
      color: #909399;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-card {
    padding: 32px 24px;
  }
  
  .login-title {
    font-size: 24px;
  }
}
</style>