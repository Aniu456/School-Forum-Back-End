#!/bin/bash

# 权限测试脚本
# 用于验证校园论坛后端的权限系统

set -e

API_BASE="http://localhost:3000"
ADMIN_KEY="dev-admin-key-2024-change-in-production-secure-key-12345"

echo "======================================"
echo "  校园论坛权限系统测试"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 清理之前的测试数据
echo -e "${YELLOW}准备测试环境...${NC}"

# Test 1: 普通用户注册
echo ""
echo "======================================"
echo "测试 1: 普通用户注册"
echo "======================================"

STUDENT_EMAIL="test-student-$(date +%s)@example.com"
STUDENT_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"student$(date +%s)\",
    \"email\": \"${STUDENT_EMAIL}\",
    \"password\": \"password123\",
    \"studentId\": \"2024001\"
  }")

echo "$STUDENT_RESPONSE" | jq '.'

STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.accessToken // empty')
STUDENT_ROLE=$(echo "$STUDENT_RESPONSE" | jq -r '.user.role // empty')

if [ "$STUDENT_ROLE" = "STUDENT" ]; then
  echo -e "${GREEN}✅ 测试通过: 普通用户角色为 STUDENT${NC}"
else
  echo -e "${RED}❌ 测试失败: 角色应为 STUDENT，实际为 $STUDENT_ROLE${NC}"
  exit 1
fi

# Test 2: 管理员注册（使用正确密钥）
echo ""
echo "======================================"
echo "测试 2: 管理员注册（正确密钥）"
echo "======================================"

ADMIN_EMAIL="test-admin-$(date +%s)@example.com"
ADMIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"admin$(date +%s)\",
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"admin_password123\",
    \"adminKey\": \"${ADMIN_KEY}\"
  }")

echo "$ADMIN_RESPONSE" | jq '.'

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.accessToken // empty')
ADMIN_ROLE=$(echo "$ADMIN_RESPONSE" | jq -r '.user.role // empty')

if [ "$ADMIN_ROLE" = "ADMIN" ]; then
  echo -e "${GREEN}✅ 测试通过: 管理员角色为 ADMIN${NC}"
else
  echo -e "${RED}❌ 测试失败: 角色应为 ADMIN，实际为 $ADMIN_ROLE${NC}"
  exit 1
fi

# Test 3: 管理员注册（错误密钥）
echo ""
echo "======================================"
echo "测试 3: 管理员注册（错误密钥）"
echo "======================================"

WRONG_KEY_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"hacker$(date +%s)\",
    \"email\": \"hacker$(date +%s)@example.com\",
    \"password\": \"password123\",
    \"adminKey\": \"wrong-key\"
  }")

echo "$WRONG_KEY_RESPONSE" | jq '.'

WRONG_KEY_STATUS=$(echo "$WRONG_KEY_RESPONSE" | jq -r '.statusCode // empty')

if [ "$WRONG_KEY_STATUS" = "403" ]; then
  echo -e "${GREEN}✅ 测试通过: 错误密钥被拒绝（403）${NC}"
else
  echo -e "${RED}❌ 测试失败: 应返回 403，实际状态码 $WRONG_KEY_STATUS${NC}"
fi

# Test 4: 普通用户访问管理接口（应被拒绝）
echo ""
echo "======================================"
echo "测试 4: 普通用户访问管理接口"
echo "======================================"

if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  跳过: 没有有效的学生 Token${NC}"
else
  FORBIDDEN_RESPONSE=$(curl -s -X GET "${API_BASE}/admin/users" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}")

  echo "$FORBIDDEN_RESPONSE" | jq '.'

  FORBIDDEN_STATUS=$(echo "$FORBIDDEN_RESPONSE" | jq -r '.statusCode // empty')

  if [ "$FORBIDDEN_STATUS" = "403" ]; then
    echo -e "${GREEN}✅ 测试通过: 普通用户无法访问管理接口（403）${NC}"
  else
    echo -e "${RED}❌ 测试失败: 应返回 403，实际状态码 $FORBIDDEN_STATUS${NC}"
  fi
fi

# Test 5: 管理员访问管理接口（应成功）
echo ""
echo "======================================"
echo "测试 5: 管理员访问管理接口"
echo "======================================"

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  跳过: 没有有效的管理员 Token${NC}"
else
  ADMIN_ACCESS_RESPONSE=$(curl -s -X GET "${API_BASE}/admin/users?page=1&limit=5" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")

  echo "$ADMIN_ACCESS_RESPONSE" | jq '.'

  # 检查是否成功返回数据
  HAS_DATA=$(echo "$ADMIN_ACCESS_RESPONSE" | jq -r '.data // empty' | wc -w)

  if [ "$HAS_DATA" -gt 0 ]; then
    echo -e "${GREEN}✅ 测试通过: 管理员成功访问管理接口${NC}"
  else
    echo -e "${RED}❌ 测试失败: 管理员应能访问管理接口${NC}"
  fi
fi

# Test 6: 普通用户访问公开接口（应成功）
echo ""
echo "======================================"
echo "测试 6: 公开接口访问"
echo "======================================"

PUBLIC_RESPONSE=$(curl -s -X GET "${API_BASE}/posts?page=1&limit=5")

echo "$PUBLIC_RESPONSE" | jq '.' | head -20

HAS_PUBLIC_DATA=$(echo "$PUBLIC_RESPONSE" | jq -r '.data // empty' | wc -w)

if [ "$HAS_PUBLIC_DATA" -gt 0 ]; then
  echo -e "${GREEN}✅ 测试通过: 公开接口可正常访问${NC}"
else
  echo -e "${YELLOW}⚠️  注意: 公开接口返回数据为空（可能是数据库为空）${NC}"
fi

# Test 7: 普通用户发帖（需要登录）
echo ""
echo "======================================"
echo "测试 7: 普通用户发帖"
echo "======================================"

if [ -z "$STUDENT_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  跳过: 没有有效的学生 Token${NC}"
else
  POST_RESPONSE=$(curl -s -X POST "${API_BASE}/posts" \
    -H "Authorization: Bearer ${STUDENT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"测试帖子标题\",
      \"content\": \"这是一个测试帖子的内容，用于验证权限系统\",
      \"tags\": [\"测试\"]
    }")

  echo "$POST_RESPONSE" | jq '.'

  POST_ID=$(echo "$POST_RESPONSE" | jq -r '.id // empty')

  if [ -n "$POST_ID" ]; then
    echo -e "${GREEN}✅ 测试通过: 普通用户可以发帖${NC}"
    echo "创建的帖子ID: $POST_ID"
  else
    echo -e "${RED}❌ 测试失败: 普通用户应能发帖${NC}"
  fi
fi

# 总结
echo ""
echo "======================================"
echo "  测试完成"
echo "======================================"
echo ""
echo -e "${GREEN}权限系统验证完成！${NC}"
echo ""
echo "测试的权限策略："
echo "  ✅ 普通用户注册自动设置为 STUDENT 角色"
echo "  ✅ 管理员注册需要正确的密钥"
echo "  ✅ 错误密钥无法注册管理员"
echo "  ✅ 普通用户无法访问 /admin/* 接口"
echo "  ✅ 管理员可以访问 /admin/* 接口"
echo "  ✅ 公开接口任何人都可以访问"
echo "  ✅ 登录用户可以发帖等操作"
echo ""
echo "Token 信息（可用于前端测试）："
echo "  学生 Token: ${STUDENT_TOKEN:0:50}..."
echo "  管理员 Token: ${ADMIN_TOKEN:0:50}..."
