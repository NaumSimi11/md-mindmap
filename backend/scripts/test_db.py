#!/usr/bin/env python3
"""Test PostgreSQL Database Connection"""

import psycopg2
import sys

# Database connection parameters (NEW PORTS)
DB_URL = "postgresql://mdreader:mdreader_dev_2024@localhost:7432/mdreader_dev"

print('🔌 Connecting to PostgreSQL...')

try:
    # Connect to database
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    print('✅ Connection successful!')
    print('')
    
    # Test 1: Get PostgreSQL version
    print('📊 PostgreSQL Version:')
    cursor.execute('SELECT version();')
    version = cursor.fetchone()[0]
    print(f'   {version.split(",")[0]}')
    print('')
    
    # Test 2: Check installed extensions
    print('🔧 Installed Extensions:')
    cursor.execute("""
        SELECT extname, extversion 
        FROM pg_extension 
        WHERE extname IN ('uuid-ossp', 'pg_trgm')
        ORDER BY extname;
    """)
    extensions = cursor.fetchall()
    for ext_name, ext_version in extensions:
        print(f'   - {ext_name} (v{ext_version})')
    print('')
    
    # Test 3: Database info
    print('💾 Database Info:')
    cursor.execute('SELECT current_database(), current_user, pg_database_size(current_database()), inet_server_port();')
    db_name, db_user, db_size, db_port = cursor.fetchone()
    print(f'   Database: {db_name}')
    print(f'   User: {db_user}')
    print(f'   Size: {db_size} bytes')
    print(f'   Port: {db_port}')
    print('')
    
    # Test 4: Write test
    print('✏️  Write Test:')
    cursor.execute('CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, data TEXT);')
    cursor.execute("INSERT INTO test_table (data) VALUES ('test') ON CONFLICT DO NOTHING;")
    cursor.execute('SELECT COUNT(*) FROM test_table;')
    count = cursor.fetchone()[0]
    print(f'   Records in test table: {count}')
    print('')
    
    print('🎉 All database tests passed!')
    print('')
    
    cursor.close()
    conn.close()
    sys.exit(0)
    
except Exception as e:
    print(f'\n❌ Connection Error:')
    print(f'   {e}')
    print('')
    print('💡 Make sure Docker containers are running:')
    print('   docker-compose ps')
    print('')
    sys.exit(1)
