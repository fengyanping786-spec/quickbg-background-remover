-- ============================================
-- 小微企业财务系统 - 数据库初始化脚本
-- 创建公共数据库和账套数据库
-- ============================================

-- 创建公共数据库
CREATE DATABASE finance_pub;

-- 连接到公共数据库
\c finance_pub;

-- ============================================
-- 公共表：用户、角色、账套
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disabled')),
    is_super_admin BOOLEAN DEFAULT FALSE,
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- 账套表
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    db_name VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    expired_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS sys_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_data JSONB,
    response_status INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- 插入默认数据
-- ============================================

-- 默认角色
INSERT INTO roles (code, name, description, permissions, is_active) VALUES
('admin', '管理员', '拥有全部权限，可管理系统配置和用户', 
 '["account:read","account:write","account:delete","voucher:read","voucher:write","voucher:approve","voucher:delete","invoice:read","invoice:write","invoice:delete","report:read","report:export","tax:read","tax:write","user:read","user:write","user:delete","tenant:read","tenant:write","settings:read","settings:write"]', 
 true),
('accountant', '记账员', '负责凭证录入、发票管理', 
 '["account:read","voucher:read","voucher:write","invoice:read","invoice:write","report:read"]', 
 true),
('viewer', '查看员', '只读财务报表', 
 '["account:read","voucher:read","invoice:read","report:read"]', 
 true);

-- 默认系统配置
INSERT INTO sys_config (config_key, config_value, description) VALUES
('tax_rate_default', '13', '默认税率'),
('voucher_need_approve', 'true', '凭证是否需要审核'),
('invoice_max_file_size', '10485760', '发票附件最大10MB'),
('backup_retention_days', '30', '备份保留天数');

-- 管理员用户 (密码: admin123)
INSERT INTO users (username, password, real_name, email, status, is_super_admin) VALUES
('admin', 'hashed:admin123', '系统管理员', 'admin@finance.com', 'active', true);

-- ============================================
-- 创建账套数据库示例
-- ============================================

-- 创建第一个账套数据库
CREATE DATABASE finance_001;

-- 连接账套数据库
\c finance_001;

-- 会计科目表
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'cost', 'expense')),
    level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
    parent_id UUID REFERENCES accounts(id),
    is_detail BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code)
);

-- 银行账户表
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'cash', 'wechat', 'alipay')),
    balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'CNY',
    bank_name VARCHAR(200),
    account_no VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 资金流水表
CREATE TABLE IF NOT EXISTS cash_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES bank_accounts(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    counterparty VARCHAR(200),
    remark TEXT,
    voucher_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 凭证主表
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    voucher_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted')),
    attach_count INTEGER DEFAULT 0,
    attachment TEXT,
    template_type VARCHAR(50),
    maker_id UUID,
    maker_name VARCHAR(50),
    checker_id UUID,
    poster_id UUID,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 凭证分录表
CREATE TABLE IF NOT EXISTS voucher_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('debit', 'credit')),
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 凭证模板表
CREATE TABLE IF NOT EXISTS voucher_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    description TEXT,
    items JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 发票表
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) NOT NULL,
    invoice_code VARCHAR(50),
    type VARCHAR(20) NOT NULL CHECK (type IN ('VAT_SPECIAL', 'VAT_NORMAL', 'RECEIPT')),
    amount DECIMAL(15, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    excluding_tax_amount DECIMAL(15, 2) DEFAULT 0,
    seller_name VARCHAR(200) NOT NULL,
    seller_tax_no VARCHAR(50),
    buyer_name VARCHAR(200),
    buyer_tax_no VARCHAR(50),
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'verified')),
    attachment TEXT,
    voucher_id UUID,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 税务记录表
CREATE TABLE IF NOT EXISTS tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('VAT', 'INCOME_TAX', 'SURTAX')),
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sales_amount DECIMAL(15, 2) DEFAULT 0,
    sales_tax DECIMAL(15, 2) DEFAULT 0,
    purchase_amount DECIMAL(15, 2) DEFAULT 0,
    purchase_tax DECIMAL(15, 2) DEFAULT 0,
    input_tax_credit DECIMAL(15, 2) DEFAULT 0,
    tax_due DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'paid')),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认会计科目
INSERT INTO accounts (code, name, type, level, is_detail) VALUES
-- 资产类 (1开头)
('1001', '银行存款', 'asset', 1, true),
('1002', '库存现金', 'asset', 1, true),
('1122', '应收账款', 'asset', 1, true),
('1403', '原材料', 'asset', 1, true),
('1601', '固定资产', 'asset', 1, true),
-- 负债类 (2开头)
('2001', '短期借款', 'liability', 1, true),
('2202', '应付账款', 'liability', 1, true),
('2211', '应付票据', 'liability', 1, true),
-- 所有者权益 (4开头)
('4001', '实收资本', 'equity', 1, true),
('4101', '资本公积', 'equity', 1, true),
('4103', '利润分配', 'equity', 1, true),
('4104', '本年利润', 'equity', 1, true),
-- 损益类 (5/6开头)
('5001', '主营业务收入', 'revenue', 1, true),
('6001', '主营业务成本', 'cost', 1, true),
('6601', '销售费用', 'expense', 1, true),
('6602', '管理费用', 'expense', 1, true),
('6603', '财务费用', 'expense', 1, true);

-- 插入默认凭证模板
INSERT INTO voucher_templates (code, name, category, description, items, is_active) VALUES
('TRIP', '差旅费报销', 'trip', '员工出差报销差旅费用', 
 '[{"accountCode":"6602","accountName":"差旅费","direction":"debit"},{"accountCode":"1002","accountName":"库存现金","direction":"credit"}]', 
 true),
('SALARY', '工资发放', 'salary', '员工工资发放', 
 '[{"accountCode":"6601","accountName":"工资","direction":"debit"},{"accountCode":"1002","accountName":"库存现金","direction":"credit"}]', 
 true),
('PURCHASE', '采购入库', 'purchase', '采购原材料入库', 
 '[{"accountCode":"1403","accountName":"原材料","direction":"debit"},{"accountCode":"2202","accountName":"应付账款","direction":"credit"}]', 
 true),
('SALES', '销售收款', 'sales', '销售商品收到货款', 
 '[{"accountCode":"1001","accountName":"银行存款","direction":"debit"},{"accountCode":"5001","accountName":"主营业务收入","direction":"credit"}]', 
 true),
('EXPENSE', '日常费用', 'other', '办公费等日常费用', 
 '[{"accountCode":"6603","accountName":"办公费","direction":"debit"},{"accountCode":"1002","accountName":"库存现金","direction":"credit"}]', 
 true);

-- 插入默认银行账户
INSERT INTO bank_accounts (code, name, type, balance) VALUES
('1001-001', '中国工商银行', 'bank', 0),
('1002-001', '库存现金', 'cash', 0);

-- ============================================
-- 完成
-- ============================================

SELECT '数据库初始化完成！' AS message;