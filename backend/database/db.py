from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import os

db = SQLAlchemy()

def init_db(app):
    """Initialize database connection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://library_user:library_password@localhost:5432/library_db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    return db

