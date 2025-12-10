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


def create_test_users():
    """Create test users with workspaces"""
    db: Session = SessionLocal()
    
    # User configs
    test_users = [
        {
            "email": "naum@example.com",
            "username": "naum",
            "full_name": "Naum Kozuvcanka",
            "password": "Kozuvcanka#1",
            "workspace_name": "My Workspace",
            "workspace_slug": "my-workspace"
        },
        {
            "email": "ljubo@example.com",
            "username": "ljubo",
            "full_name": "Ljubo",
            "password": "Ljubisha#1",
            "workspace_name": "Ljubo's Workspace",
            "workspace_slug": "ljubo-workspace"
        }
    ]
    
    try:
        created_users = []
        
        for user_config in test_users:
            # Check if user exists
            existing_user = db.query(User).filter(User.email == user_config["email"]).first()
            
            if existing_user:
                print(f"✅ User already exists: {user_config['email']}")
                print(f"   User ID: {existing_user.id}")
                
                # Check workspace
                workspace = db.query(Workspace).filter(Workspace.owner_id == existing_user.id).first()
                if workspace:
                    print(f"   Workspace: {workspace.name} (ID: {workspace.id})")
                print()
                continue
            
            # Create new user
            print(f"👤 Creating user: {user_config['email']}...")
            
            user = User(
                email=user_config["email"],
                username=user_config["username"],
                full_name=user_config["full_name"],
                hashed_password=hash_password(user_config["password"]),  # Fixed: hashed_password not password_hash
                is_active=True,
                is_verified=True
            )
            
            db.add(user)
            db.flush()  # Get user ID
            
            # Create default workspace
            print(f"📁 Creating workspace: {user_config['workspace_name']}...")
            
            workspace = Workspace(
                name=user_config["workspace_name"],
                slug=user_config["workspace_slug"],
                owner_id=user.id
            )
            
            db.add(workspace)
            db.commit()
            
            created_users.append({
                "email": user_config["email"],
                "password": user_config["password"],
                "user_id": str(user.id),
                "workspace_id": str(workspace.id)
            })
            
            print(f"✅ User created: {user_config['email']}")
            print()
        
        # Print summary
        if created_users:
            print("\n" + "="*60)
            print("🔑 LOGIN CREDENTIALS (NEW USERS):")
            print("="*60)
            for user in created_users:
                print(f"\n  Email:    {user['email']}")
                print(f"  Password: {user['password']}")
                print(f"  User ID:  {user['user_id']}")
                print(f"  Workspace: {user['workspace_id']}")
            print("="*60)
            print()
        else:
            print("ℹ️  All test users already exist\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error creating test users: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_test_users()

