# Devnors 得若 - Mobile APP

全场景AI原生智能招聘平台移动端应用，基于 React Native + Expo 构建。

## 技术栈

- **框架**: React Native 0.81 + Expo SDK 54
- **语言**: TypeScript 5.9
- **路由**: Expo Router v6 (文件系统路由)
- **状态管理**: Zustand + TanStack React Query
- **样式**: NativeWind v4 (Tailwind CSS for RN)
- **网络**: Axios
- **安全存储**: expo-secure-store (JWT Token)
- **推送**: expo-notifications

## 项目结构

```
devnors-app/
├── app/                    # 页面路由 (Expo Router)
│   ├── (auth)/             # 认证页面 (登录/注册/角色选择)
│   ├── (candidate)/        # 候选人端 Tab 页面
│   ├── (employer)/         # 雇主端 Tab 页面
│   └── (common)/           # 通用二级页 (详情/设置等)
├── components/             # 可复用组件
│   ├── ui/                 # 基础 UI 组件
│   └── business/           # 业务组件
├── services/               # API 服务层
├── stores/                 # Zustand 状态管理
├── shared/                 # 共享类型定义
├── utils/                  # 工具函数
└── constants/              # 常量配置
```

## 开发指南

### 环境要求

- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- iOS: Xcode 15+ (macOS)
- Android: Android Studio

### 启动开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 启动 iOS 模拟器
npx expo start --ios

# 启动 Android 模拟器
npx expo start --android
```

### 连接后端

开发环境下，修改 `constants/config.ts` 中的 `API_BASE_URL`:

```typescript
// 如果使用真机，替换为电脑局域网 IP
export const API_BASE_URL = __DEV__
  ? 'http://192.168.x.x:8080/api/v1'
  : 'https://api.devnors.com/api/v1';
```

### 构建发布

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo
eas login

# 开发构建 (Dev Client)
eas build --profile development --platform ios

# 预览构建 (内部分发)
eas build --profile preview --platform all

# 正式构建 (App Store / Google Play)
eas build --profile production --platform all

# 提交到商店
eas submit --platform ios
eas submit --platform android
```

## 功能模块

| 模块 | 候选人端 | 雇主端 |
|------|---------|--------|
| 首页 | 推荐职位、流程统计 | 工作台仪表盘 |
| 职位 | 搜索/筛选/投递 | 发布/管理职位 |
| AI | AI智能投递 | AI智能匹配 |
| 人才 | - | 人才库搜索 |
| 消息 | 通知消息 | 通知消息 |
| 个人 | 简历/设置 | 企业/设置 |
| 通用 | AI助手、Token管理、流程详情 |
