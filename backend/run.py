#!/usr/bin/env python3
"""
Run script for the library management system backend.
Make sure to run this from the backend directory or set PYTHONPATH.
"""
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app

if __name__ == '__main__':
    print("Starting Library Management System Backend...")
    print("Server will run on http://0.0.0.0:8000")
    app.run(debug=True, host='0.0.0.0', port=8000)

