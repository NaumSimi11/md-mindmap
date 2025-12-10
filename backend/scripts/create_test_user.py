#!/usr/bin/env python3
"""
Create Test User Script
Creates a test user for MDReader development
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.utils.security import hash_password


def create_test_user():
    """Create test user with workspace"""
    db: Session = SessionLocal()
    
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == "naum@example.com").first()
        
        if existing_user:
            print("✅ Test user already exists:")
            print(f"   Email: naum@example.com")
            print(f"   User ID: {existing_user.id}")
            
            # Check workspace
            workspace = db.query(Workspace).filter(Workspace.owner_id == existing_user.id).first()
            if workspace:
                print(f"   Workspace: {workspace.name} (ID: {workspace.id})")
            return
        
        # Create new user
        print("👤 Creating test user...")
        
        user = User(
            email="naum@example.com",
            username="naum",
            full_name="Naum Kozuvcanka",
            password_hash=hash_password("Kozuvcanka#1"),
            is_active=True,
            is_verified=True
        )
        
        db.add(user)
        db.flush()  # Get user ID
        
        # Create default workspace
        print("📁 Creating default workspace...")
        
        workspace = Workspace(
            name="My Workspace",
            slug="my-workspace",
            owner_id=user.id
        )
        
        db.add(workspace)
        db.commit()
        
        print("\n✅ Test user created successfully!")
        print("\n" + "="*60)
        print("🔑 LOGIN CREDENTIALS:")
        print("="*60)
        print(f"  Email:    naum@example.com")
        print(f"  Password: Kozuvcanka#1")
        print("="*60)
        print(f"\n📊 User ID:      {user.id}")
        print(f"📊 Workspace ID: {workspace.id}")
        print()
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error creating test user: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_test_user()

