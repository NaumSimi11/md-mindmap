#!/usr/bin/env python3
"""Test Redis Connection"""

import redis
import sys
import time

# Redis connection (NEW PORTS)
redis_client = redis.Redis(host='localhost', port=7379, password='mdreader_redis_2024', db=0, decode_responses=True)

print('🔌 Connecting to Redis...')

try:
    # Test 1: Ping
    redis_client.ping()
    print('✅ Connection successful!')
    print('')
    
    # Test 2: Server info
    print('📊 Redis Info:')
    info = redis_client.info()
    print(f'   Version: {info["redis_version"]}')
    print(f'   Mode: {info["redis_mode"]}')
    print(f'   Uptime: {info["uptime_in_seconds"]} seconds')
    print(f'   Connected clients: {info["connected_clients"]}')
    print(f'   Used memory: {round(info["used_memory"] / 1024 / 1024, 2)}M')
    print(f'   Total keys: {redis_client.dbsize()}')
    print('')
    
    # Test 3: SET/GET
    print('✏️  Testing SET/GET operations...')
    redis_client.set('test_key', 'test_value')
    value = redis_client.get('test_key')
    assert value == 'test_value', 'SET/GET failed'
    print('   ✅ SET/GET successful')
    print('')
    
    # Test 4: TTL
    print('⏱️  Testing TTL (expiration)...')
    redis_client.setex('ttl_key', 5, 'expires_soon')
    ttl = redis_client.ttl('ttl_key')
    print(f'   ✅ TTL set: {ttl} seconds remaining')
    print('')
    
    # Test 5: HASH
    print('📦 Testing HASH operations...')
    redis_client.hset('test_hash', mapping={'field1': 'value1', 'field2': 'value2', 'field3': 'value3'})
    hash_len = redis_client.hlen('test_hash')
    print(f'   ✅ HASH operations successful')
    print(f'   Stored {hash_len} fields')
    print('')
    
    # Test 6: LIST
    print('📋 Testing LIST operations...')
    redis_client.delete('test_list')
    redis_client.rpush('test_list', 'task1', 'task2', 'task3')
    list_len = redis_client.llen('test_list')
    first_item = redis_client.lpop('test_list')
    print(f'   ✅ LIST operations successful')
    print(f'   Queue length: {list_len}')
    print(f'   Popped item: {first_item}')
    print('')
    
    # Test 7: PUB/SUB capability check
    print('📡 Testing PUB/SUB capability...')
    pubsub = redis_client.pubsub()
    pubsub.subscribe('test_channel')
    print(f'   ✅ PUB/SUB channel created')
    pubsub.close()
    print('')
    
    # Cleanup
    print('🧹 Cleaning up test keys...')
    deleted = redis_client.delete('test_key', 'test_hash', 'test_list')
    print(f'   Deleted {deleted} test keys')
    print('')
    
    # Performance test
    print('⚡ Performance test...')
    start = time.time()
    for i in range(100):
        redis_client.set(f'perf_key_{i}', f'value_{i}')
    elapsed = time.time() - start
    ops_per_sec = int(100 / elapsed)
    print(f'   100 SET operations: {elapsed:.4f}s ({ops_per_sec} ops/sec)')
    redis_client.delete(*[f'perf_key_{i}' for i in range(100)])
    print('')
    
    print('🎉 All Redis tests passed!')
    print('')
    sys.exit(0)
    
except redis.exceptions.ConnectionError as e:
    print(f'\n❌ Connection Error:')
    print(f'   {e}')
    print('')
    print('💡 Make sure Redis is running:')
    print('   docker-compose ps redis')
    print('')
    sys.exit(1)
except Exception as e:
    print(f'\n❌ Test Error:')
    print(f'   {e}')
    sys.exit(1)
