-- Supabase数据库迁移脚本：为books表添加lexile、series、category字段
-- 在Supabase控制台的SQL编辑器中运行此脚本

-- 添加lexile字段（蓝思值）
ALTER TABLE books ADD COLUMN IF NOT EXISTS lexile TEXT;

-- 添加series字段（系列名）
ALTER TABLE books ADD COLUMN IF NOT EXISTS series TEXT;

-- 添加category字段（分类）
ALTER TABLE books ADD COLUMN IF NOT EXISTS category TEXT;

-- 验证字段已添加（可选）
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'books';

-- 查看现有书籍数量和蓝思值分布（可选）
-- SELECT
--   COUNT(*) as total_books,
--   COUNT(lexile) as books_with_lexile
-- FROM books;

-- 注释：
-- 1. 现有书籍的lexile、series、category字段将默认为NULL
-- 2. 新上传的书籍将自动填充这些字段
-- 3. 可以通过Supabase控制台手动更新现有书籍的蓝思值
