-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户配置表（扩展 Supabase 内置的 auth.users 表）
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器，当新用户注册时自动创建对应的 profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 积分账户表
CREATE TABLE public.credit_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 积分交易记录表
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'bonus')),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建触发器，当新用户注册时自动创建积分账户
CREATE OR REPLACE FUNCTION public.create_credit_account() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_accounts (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_credit_account
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_credit_account();

-- 价格套餐表
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 支付订单表
CREATE TABLE public.payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan_id UUID REFERENCES public.pricing_plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 优惠券表
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 优惠券使用记录表
CREATE TABLE public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES public.coupons(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  order_id UUID REFERENCES public.payment_orders(id) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coupon_id, order_id)
);

-- 图像生成记录表
CREATE TABLE public.image_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  prompt TEXT NOT NULL,
  size TEXT NOT NULL,
  image_url TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 为所有表启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "用户只能查看自己的个人资料" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的个人资料" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能查看自己的积分账户" ON public.credit_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己的积分交易" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己的订单" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己的图像生成记录" ON public.image_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己的优惠券使用记录" ON public.coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

-- 价格套餐对所有人可见
CREATE POLICY "价格套餐对所有人可见" ON public.pricing_plans
  FOR SELECT USING (true);

-- 优惠券对所有人可见
CREATE POLICY "优惠券对所有人可见" ON public.coupons
  FOR SELECT USING (is_active = true);

-- 插入初始价格套餐
INSERT INTO public.pricing_plans (name, credits, price, is_popular, description)
VALUES 
  ('基础套餐', 100, 10.00, false, '适合初次尝试的用户'),
  ('标准套餐', 300, 25.00, true, '我们最受欢迎的套餐，节省16%'),
  ('专业套餐', 1000, 80.00, false, '适合重度用户，节省20%');

-- 创建扣费函数
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 获取当前余额
  SELECT balance INTO v_balance
  FROM public.credit_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- 检查余额是否足够
  IF v_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- 更新余额
  v_new_balance := v_balance - p_amount;
  
  UPDATE public.credit_accounts
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
  
  -- 记录交易
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    -p_amount,
    v_new_balance,
    'consumption',
    p_description,
    p_reference_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建添加积分函数
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- 获取当前余额
  SELECT balance INTO v_balance
  FROM public.credit_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- 更新余额
  v_new_balance := v_balance + p_amount;
  
  UPDATE public.credit_accounts
  SET 
    balance = v_new_balance,
    total_earned = total_earned + p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
  
  -- 记录交易
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    balance_after,
    type,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    p_amount,
    v_new_balance,
    p_type,
    p_description,
    p_reference_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;