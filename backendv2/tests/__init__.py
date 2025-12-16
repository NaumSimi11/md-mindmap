"""
MDReader Backend v2 - Test Suite
==================================

Comprehensive test suite for all API endpoints and business logic.

Test Structure:
- conftest.py: Shared fixtures and setup
- test_auth.py: Authentication tests
- test_workspaces.py: Workspace CRUD tests
- test_documents.py: Document CRUD tests (Phase 1)
- test_folders.py: Folder CRUD tests (Phase 1)
- test_permissions.py: Authorization tests
- test_validation.py: Input validation tests
- test_error_handling.py: Error response tests
- test_contracts.py: API contract validation

Test Categories (Markers):
- @pytest.mark.unit: Fast, isolated unit tests
- @pytest.mark.integration: Tests requiring database
- @pytest.mark.slow: Tests taking > 1 second
- @pytest.mark.auth: Authentication tests
- @pytest.mark.workspace: Workspace tests
- @pytest.mark.contract: API contract validation

Coverage Target: 70%+
- Critical paths (auth, CRUD): 80%+
- Business logic: 70%+
- Error handling: 60%+
"""

__version__ = "2.0.0"
