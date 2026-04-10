FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源码
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "run", "start:prod"]