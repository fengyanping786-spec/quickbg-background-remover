<template>
  <div class="login-container">
    <div class="login-background">
      <div class="bg-shape bg-shape-1"></div>
      <div class="bg-shape bg-shape-2"></div>
      <div class="bg-shape bg-shape-3"></div>
    </div>
    
    <div class="login-box">
      <div class="login-header">
        <div class="logo-icon">💰</div>
        <h1>财务系统</h1>
        <p>小微企业财务管理平台</p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin" class="login-form">
        <el-form-item prop="username">
          <div class="input-wrapper">
            <el-icon class="input-icon"><User /></el-icon>
            <el-input 
              v-model="form.username" 
              placeholder="请输入用户名"
              size="large"
              clearable
            />
          </div>
        </el-form-item>
        
        <el-form-item prop="password">
          <div class="input-wrapper">
            <el-icon class="input-icon"><Lock /></el-icon>
            <el-input 
              v-model="form.password" 
              type="password" 
              placeholder="请输入密码"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            size="large"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="tips">
          <span class="tip-label">测试账号：</span>
          <span class="tip-value">admin / admin123</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  
  // 模拟登录成功
  setTimeout(() => {
    localStorage.setItem('token', 'mock-token-12345')
    localStorage.setItem('username', form.username || 'Admin')
    localStorage.setItem('user', JSON.stringify({ 
      username: form.username || 'Admin',
      realName: '管理员' 
    }))
    
    ElMessage.success('登录成功')
    loading.value = false
    router.push('/dashboard')
  }, 1000)
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1f2e 0%, #252b3b 100%);
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.bg-shape-1 {
  width: 400px;
  height: 400px;
  background: #667eea;
  top: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite;
}

.bg-shape-2 {
  width: 300px;
  height: 300px;
  background: #764ba2;
  bottom: -50px;
  right: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

.bg-shape-3 {
  width: 200px;
  height: 200px;
  background: #4facfe;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, 20px); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
}

.login-box {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1f2e;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.login-header p {
  font-size: 14px;
  color: #8b9dc3;
  letter-spacing: 1px;
}

.login-form {
  margin-top: 20px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 4px 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  background: #fff;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-icon {
  font-size: 18px;
  color: #8b9dc3;
  margin-right: 10px;
}

.input-wrapper :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.input-wrapper :deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s;
  margin-top: 10px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.tips {
  display: inline-block;
  padding: 8px 16px;
  background: #f5f7fa;
  border-radius: 20px;
}

.tip-label {
  color: #8b9dc3;
  font-size: 13px;
}

.tip-value {
  color: #667eea;
  font-size: 13px;
  font-weight: 500;
}
</style>