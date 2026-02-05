"""
SQLite 到 MySQL 数据迁移脚本
使用方法: python scripts/migrate_sqlite_to_mysql.py

注意事项：
1. 执行前请先备份 SQLite 数据库
2. 确保 MySQL 数据库已创建且表结构已初始化
3. 修改下方配置信息
"""

import sqlite3
import pymysql
import sys
import os
from datetime import datetime

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ============ 配置区域 ============
# SQLite 数据库路径
SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "devnors.db")

# MySQL 配置 - 请修改为你的实际配置
MYSQL_CONFIG = {
    "host": "rm-xxx.mysql.rds.aliyuncs.com",  # RDS 地址
    "port": 3306,
    "user": "devnors_admin",                   # 数据库用户名
    "password": "YourPassword123",             # 数据库密码
    "database": "devnors",                     # 数据库名
    "charset": "utf8mb4",
    "autocommit": False
}

# 需要迁移的表（按依赖顺序）
TABLES = [
    "users",                      # 基础表，其他表依赖它
    "team_members",
    "user_profiles",
    "user_settings",
    "todos",
    "chat_messages",
    "memories",
    "personal_certifications",
    "enterprise_certifications",
    "ai_engine_configs",
    "api_api_keys",
    "audit_logs"
]

# ============ 迁移逻辑 ============

def get_table_count(cursor, table):
    """获取表记录数"""
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    return cursor.fetchone()[0]


def clear_mysql_table(cursor, table):
    """清空 MySQL 表（保留结构）"""
    cursor.execute(f"SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute(f"TRUNCATE TABLE `{table}`")
    cursor.execute(f"SET FOREIGN_KEY_CHECKS = 1")


def migrate_table(sqlite_cursor, mysql_cursor, mysql_conn, table):
    """迁移单个表"""
    print(f"\n📦 迁移表: {table}")
    
    # 获取 SQLite 数据
    try:
        sqlite_cursor.execute(f"SELECT * FROM {table}")
        rows = sqlite_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"  ⚠️ SQLite 表不存在或查询失败: {e}")
        return 0
    
    if not rows:
        print(f"  ⚠️ 表 {table} 为空，跳过")
        return 0
    
    # 获取列名
    columns = [description[0] for description in sqlite_cursor.description]
    placeholders = ", ".join(["%s"] * len(columns))
    column_names = ", ".join([f"`{col}`" for col in columns])
    
    # 清空 MySQL 目标表
    print(f"  🗑️ 清空 MySQL 表...")
    clear_mysql_table(mysql_cursor, table)
    
    # 构建插入语句
    insert_sql = f"INSERT INTO `{table}` ({column_names}) VALUES ({placeholders})"
    
    # 批量插入
    success_count = 0
    error_count = 0
    batch_size = 1000
    batch = []
    
    for row in rows:
        values = []
        for col in columns:
            val = row[col]
            # 处理特殊值
            if val is None:
                values.append(None)
            elif isinstance(val, str) and val == '':
                values.append('')
            else:
                values.append(val)
        batch.append(tuple(values))
        
        if len(batch) >= batch_size:
            try:
                mysql_cursor.executemany(insert_sql, batch)
                success_count += len(batch)
            except Exception as e:
                print(f"  ❌ 批量插入失败: {e}")
                error_count += len(batch)
            batch = []
    
    # 处理剩余数据
    if batch:
        try:
            mysql_cursor.executemany(insert_sql, batch)
            success_count += len(batch)
        except Exception as e:
            print(f"  ❌ 批量插入失败: {e}")
            error_count += len(batch)
    
    mysql_conn.commit()
    
    if error_count > 0:
        print(f"  ⚠️ 成功: {success_count}, 失败: {error_count}")
    else:
        print(f"  ✅ 成功迁移 {success_count} 条记录")
    
    return success_count


def verify_migration(sqlite_cursor, mysql_cursor):
    """验证迁移结果"""
    print("\n" + "=" * 50)
    print("📊 迁移验证")
    print("=" * 50)
    
    all_match = True
    for table in TABLES:
        try:
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            sqlite_count = sqlite_cursor.fetchone()[0]
        except:
            sqlite_count = 0
        
        try:
            mysql_cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
            mysql_count = mysql_cursor.fetchone()[0]
        except:
            mysql_count = 0
        
        status = "✅" if sqlite_count == mysql_count else "❌"
        if sqlite_count != mysql_count:
            all_match = False
        print(f"  {status} {table}: SQLite({sqlite_count}) -> MySQL({mysql_count})")
    
    return all_match


def main():
    """主函数"""
    print("=" * 50)
    print("🚀 Devnors 数据库迁移工具")
    print("   SQLite -> MySQL")
    print("=" * 50)
    
    # 检查 SQLite 文件
    if not os.path.exists(SQLITE_PATH):
        print(f"\n❌ SQLite 数据库不存在: {SQLITE_PATH}")
        sys.exit(1)
    
    print(f"\n📁 SQLite 路径: {SQLITE_PATH}")
    print(f"🎯 MySQL 目标: {MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{MYSQL_CONFIG['database']}")
    
    # 确认执行
    confirm = input("\n⚠️ 此操作将覆盖 MySQL 中的数据，是否继续？(yes/no): ")
    if confirm.lower() != 'yes':
        print("已取消迁移")
        sys.exit(0)
    
    # 连接数据库
    print("\n🔗 连接数据库...")
    
    try:
        sqlite_conn = sqlite3.connect(SQLITE_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()
        print("  ✅ SQLite 连接成功")
    except Exception as e:
        print(f"  ❌ SQLite 连接失败: {e}")
        sys.exit(1)
    
    try:
        mysql_conn = pymysql.connect(**MYSQL_CONFIG)
        mysql_cursor = mysql_conn.cursor()
        print("  ✅ MySQL 连接成功")
    except Exception as e:
        print(f"  ❌ MySQL 连接失败: {e}")
        print("\n请检查:")
        print("  1. MySQL 配置是否正确")
        print("  2. 网络是否可达")
        print("  3. 用户权限是否足够")
        sqlite_conn.close()
        sys.exit(1)
    
    # 执行迁移
    start_time = datetime.now()
    total_records = 0
    
    try:
        for table in TABLES:
            count = migrate_table(sqlite_cursor, mysql_cursor, mysql_conn, table)
            total_records += count
        
        # 验证
        all_match = verify_migration(sqlite_cursor, mysql_cursor)
        
    except Exception as e:
        print(f"\n❌ 迁移过程出错: {e}")
        mysql_conn.rollback()
        raise
    finally:
        sqlite_conn.close()
        mysql_conn.close()
    
    # 结果统计
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print("\n" + "=" * 50)
    print("🎉 迁移完成！")
    print("=" * 50)
    print(f"  📊 总记录数: {total_records}")
    print(f"  ⏱️ 耗时: {duration:.2f} 秒")
    print(f"  {'✅ 数据完整性验证通过' if all_match else '⚠️ 部分表数据不一致，请检查'}")


if __name__ == "__main__":
    main()
