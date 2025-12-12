#!/usr/bin/env python3
"""Wait for PostgreSQL database to be ready"""
import sys
import time
import psycopg2
import os

def wait_for_db(max_retries=30, retry_interval=2):
    """Wait for database to be ready"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://library_user:library_password@database:5432/library_db')
    
    # Parse database URL
    if database_url.startswith('postgresql://'):
        url = database_url.replace('postgresql://', '')
        if '@' in url:
            auth, host_db = url.split('@')
            user, password = auth.split(':')
            if ':' in host_db:
                host_port, db = host_db.split('/')
                if ':' in host_port:
                    host, port = host_port.split(':')
                else:
                    host = host_port
                    port = '5432'
            else:
                host = host_db.split('/')[0]
                port = '5432'
                db = host_db.split('/')[1]
        else:
            print("Invalid DATABASE_URL format")
            sys.exit(1)
    else:
        print("DATABASE_URL must start with postgresql://")
        sys.exit(1)
    
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=db
            )
            conn.close()
            print("Database is ready!")
            return True
        except psycopg2.OperationalError as e:
            if i < max_retries - 1:
                print(f"Waiting for database... (attempt {i+1}/{max_retries})")
                time.sleep(retry_interval)
            else:
                print(f"Database connection failed after {max_retries} attempts: {e}")
                sys.exit(1)
    
    return False

if __name__ == '__main__':
    wait_for_db()

