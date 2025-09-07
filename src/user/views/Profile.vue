<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <h2>个人中心</h2>
      </div>
      <div class="profile-content">
        <div class="avatar-section">
          <el-avatar :size="100" :src="userInfo.avatarUrl || defaultAvatar" @error="handleAvatarError">
            <el-icon><User /></el-icon>
          </el-avatar>
          <el-upload
            class="avatar-uploader"
            action=""
            :http-request="uploadAvatar"
            :show-file-list="false"
            accept="image/*"
          >
            <el-button type="primary" size="small" class="upload-btn">更换头像</el-button>
          </el-upload>
        </div>
        
        <div class="info-section">
          <el-form :model="userInfo" label-width="80px">
            <el-form-item label="用户名">
              <el-input v-model="userInfo.name" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="userInfo.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="userInfo.gender">
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="注册时间">
              <el-input v-model="userInfo.createTime" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveUserInfo">保存信息</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { User } from '@element-plus/icons-vue';
import { useUserStore } from '../store/user';
import { userApi } from '../api/services';

const userStore = useUserStore();
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

interface UserInfo {
  id: number;
  name: string;
  phone: string;
  avatarUrl: string;
  gender: number;
  createTime: string;
}

const userInfo = reactive<UserInfo>({
  id: 0,
  name: '',
  phone: '',
  avatarUrl: '',
  gender: 1,
  createTime: ''
});

const loading = ref(false);

onMounted(async () => {
  await fetchUserInfo();
});

// 获取用户信息
async function fetchUserInfo() {
  if (!userStore.isLoggedIn || !userStore.userInfo?.id) {
    ElMessage.warning('请先登录');
    return;
  }
  
  loading.value = true;
  try {
    const response = await userApi.getUserInfo(userStore.userInfo.id);
    if (response.code === 1) {
      const data = response.data;
      Object.assign(userInfo, {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || '',
        gender: data.gender || 1,
        createTime: data.createTime || ''
      });
    } else {
      ElMessage.error(response.msg || '获取用户信息失败');
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    ElMessage.error('获取用户信息失败');
  } finally {
    loading.value = false;
  }
}

// 保存用户信息
async function saveUserInfo() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    return;
  }
  
  loading.value = true;
  try {
    const response = await userApi.updateUserInfo({
      id: userInfo.id,
      name: userInfo.name,
      phone: userInfo.phone,
      avatarUrl: userInfo.avatarUrl,
      gender: userInfo.gender
    });
    
    if (response.code === 1) {
      ElMessage.success('保存成功');
      // 更新store中的用户信息
      if (userStore.userInfo) {
        userStore.userInfo = {
          ...userStore.userInfo,
          name: userInfo.name,
          phone: userInfo.phone,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender
        };
      }
    } else {
      ElMessage.error(response.msg || '保存失败');
    }
  } catch (error) {
    console.error('保存用户信息失败:', error);
    ElMessage.error('保存用户信息失败');
  } finally {
    loading.value = false;
  }
}

// 上传头像
async function uploadAvatar(options: any) {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    return;
  }
  
  const file = options.file;
  if (!file) {
    ElMessage.warning('请选择图片');
    return;
  }
  
  // 检查文件类型
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.warning('请上传图片文件');
    return;
  }
  
  // 检查文件大小，限制为2MB
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.warning('图片大小不能超过2MB');
    return;
  }
  
  loading.value = true;
  try {
    // 先上传图片
    const uploadResponse = await userApi.uploadImage(file);
    if (uploadResponse.code !== 1) {
      ElMessage.error(uploadResponse.msg || '上传头像失败');
      return;
    }
    
    const imageUrl = uploadResponse.data;
    
    // 更新用户信息
    const response = await userApi.updateUserInfo({
      id: userInfo.id,
      name: userInfo.name,
      phone: userInfo.phone,
      avatarUrl: imageUrl,
      gender: userInfo.gender
    });
    
    if (response.code === 1) {
      ElMessage.success('头像更新成功');
      userInfo.avatarUrl = imageUrl;
      
      // 更新store中的用户信息
      if (userStore.userInfo) {
        userStore.userInfo = {
          ...userStore.userInfo,
          avatarUrl: imageUrl
        };
      }
    } else {
      ElMessage.error(response.msg || '更新头像失败');
    }
  } catch (error) {
    console.error('上传头像失败:', error);
    ElMessage.error('上传头像失败');
  } finally {
    loading.value = false;
  }
}

// 头像加载失败处理
function handleAvatarError() {
  userInfo.avatarUrl = defaultAvatar;
}
</script>

<style scoped lang="scss">
.profile-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.profile-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  
  h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }
}

.profile-content {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.avatar-uploader {
  margin-top: 10px;
}

.upload-btn {
  border-radius: 20px;
}

.info-section {
  flex: 1;
}
</style>