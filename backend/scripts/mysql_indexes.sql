-- ============================================
-- Devnors MySQL 索引优化脚本
-- 执行方法: mysql -u用户名 -p密码 数据库名 < mysql_indexes.sql
-- ============================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 团队成员索引
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- 用户资料索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(profile_type);

-- 用户设置索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- 任务表索引（高频查询）
CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_user_status ON todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);

-- 聊天消息索引（数据量大，索引很重要）
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_todo ON chat_messages(todo_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_todo ON chat_messages(user_id, todo_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- 记忆表索引
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope);
CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_user_scope ON memories(user_id, scope);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);

-- 个人认证索引
CREATE INDEX IF NOT EXISTS idx_personal_cert_user ON personal_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_cert_category ON personal_certifications(category);
CREATE INDEX IF NOT EXISTS idx_personal_cert_status ON personal_certifications(status);
CREATE INDEX IF NOT EXISTS idx_personal_cert_user_category ON personal_certifications(user_id, category);

-- 企业认证索引
CREATE INDEX IF NOT EXISTS idx_enterprise_cert_user ON enterprise_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_cert_category ON enterprise_certifications(category);
CREATE INDEX IF NOT EXISTS idx_enterprise_cert_status ON enterprise_certifications(status);

-- AI引擎配置索引
CREATE INDEX IF NOT EXISTS idx_ai_engine_user ON ai_engine_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_engine_task ON ai_engine_configs(task);

-- API密钥索引
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_api_keys(`key`);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_api_keys(is_active);

-- 审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action(100));

-- ============================================
-- 查看索引状态
-- ============================================
-- SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
-- FROM INFORMATION_SCHEMA.STATISTICS 
-- WHERE TABLE_SCHEMA = 'devnors';

-- ============================================
-- 分析表（优化查询计划）
-- ============================================
ANALYZE TABLE users;
ANALYZE TABLE todos;
ANALYZE TABLE chat_messages;
ANALYZE TABLE memories;
ANALYZE TABLE personal_certifications;

SELECT '✅ 索引创建完成！' AS result;
