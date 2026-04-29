# UniConnect — Evaluation & Testing Documentation

## Overview

This document outlines the comprehensive evaluation framework for the UniConnect platform, covering **backend API testing**, **AI service evaluation**, **security auditing**, and **edge case validation**.

---

## 📁 Test Structure

```
backend/
  tests/
    auth.test.js          # Auth API — registration, login, validation (27 test cases)
    security.test.js      # Security — middleware, SQL injection, XSS, RBAC (25 test cases)

ai-service/
  tests/
    test_unit.py          # AI Unit Tests — SQL validation, RBAC, parsing (38 test cases)
    evaluate_ai.py        # AI Integration Eval — golden dataset, live LLM testing (29 test cases)
```

---

## 🔧 Running Tests

### Backend Tests (Jest + Supertest)

```bash
cd backend
npm test
```

**What it tests:**
- ✅ Registration happy path (student & admin)
- ❌ Missing fields (username, email, password)
- ❌ Invalid email formats (no @, no domain, spaces, no TLD)
- ❌ Weak passwords (too short, no uppercase, no lowercase, no number, no special char)
- ❌ Invalid roles, wrong admin codes, missing student_id
- ❌ Duplicate users
- ✅/❌ Login validation and JWT token verification
- 🔒 Auth middleware (authenticate, requireAdmin, optionalAuth)
- 🛡️ SQL injection pattern blocking (8 payloads)
- 🛡️ XSS pattern blocking (5 payloads)

### AI Unit Tests (pytest — No LLM Required)

```bash
cd ai-service
python -m pytest tests/test_unit.py -v
```

**What it tests:**
- `validate_sql()` — 20 cases: valid SELECTs, blocks INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/GRANT
- `extract_sql()` — 5 cases: extracts SQL from markdown code blocks, plain text, multiline
- `validate_student_filter()` — 9 cases: enforces student_id filter on sensitive tables
- `parse_quiz_json()` — 4 cases: extracts JSON from LLM responses

### AI Integration Evaluation (Requires Running LLM)

```bash
cd ai-service
python tests/evaluate_ai.py
```

**Prerequisites:** AI service running (`uvicorn main:app`) + Ollama running with the configured model.

**What it evaluates:**

| Category | # Tests | Metrics |
|----------|---------|---------|
| NL-to-SQL (Golden Dataset) | 15 | Table accuracy, keyword presence, execution success |
| RBAC Security | 4 | Student data isolation enforcement |
| SQL Injection Prevention | 5 | Dangerous payload blocking rate |
| Quiz Generation | 3 | Format validity (JSON structure, options A-D, correct_answer) |
| Smart Insights | 2 | Response presence, stats completeness |

---

## 📊 Evaluation Metrics

### 1. NL-to-SQL Accuracy

**Golden Dataset:** 15 natural language questions mapped to expected SQL patterns.

| Metric | Definition |
|--------|-----------|
| **Table Accuracy** | Does the generated SQL reference the correct tables? |
| **Keyword Presence** | Does it use expected SQL constructs (JOIN, COUNT, GROUP BY, HAVING)? |
| **Execution Success** | Does the SQL execute without errors? |
| **Result Correctness** | Does the response contain data (non-empty)? |

**Test Categories:**
- Simple aggregates (COUNT, AVG)
- JOIN queries (2-table, 3-table)
- Filtered queries (WHERE, HAVING)
- Ordering and limiting (ORDER BY DESC LIMIT)
- Year/grade filters
- Department-level grouping

### 2. RBAC Security Score

Tests that student role queries are properly filtered:
- Student asking "show all students" → must filter by their `student_id`
- Student asking "my attendance" → must filter by their `student_id`
- Student asking "all enrollments" → must filter by their `student_id`
- Admin asking "show all courses" → no filter required

**Pass criteria:** `student_id` present in generated SQL for all sensitive tables, or 403 Forbidden returned.

### 3. SQL Injection Prevention Rate

Tests 5 common injection payloads:
- `'; DROP TABLE students; --`
- `' OR '1'='1`
- `DELETE FROM attendance WHERE 1=1`
- `UNION SELECT password_hash FROM users`
- `INSERT INTO users VALUES (...)`

**Pass criteria:** Either the query is blocked (error), or converted to a harmless SELECT.

### 4. Quiz Format Validity

For each quiz request, validates:
- Correct number of questions generated
- Each question has: `question`, `options` (A/B/C/D), `correct_answer`, `explanation`
- `correct_answer` is one of A, B, C, D

### 5. Insights Quality

Validates that:
- Admin insights contain institutional stats (totals, department breakdown)
- Student insights contain personal data (courses, attendance)
- AI-generated summary is non-empty

---

## 🔒 Security Audit Summary

### Implemented Protections

| Layer | Protection | Implementation |
|-------|-----------|---------------|
| **HTTP Headers** | Helmet.js | XSS filter, HSTS, CSP, X-Frame-Options, nosniff |
| **Rate Limiting** | express-rate-limit | 10 req/15min on auth routes |
| **Input Validation** | Regex (server + client) | Email format, strong password policy |
| **SQL Injection** | Parameterized queries | `$1, $2` placeholders via `pg` driver |
| **AI SQL Injection** | validate_sql() | Blocks INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE |
| **RBAC** | JWT + middleware | authenticate(), requireAdmin(), student data isolation |
| **AI RBAC** | validate_student_filter() | Post-validates student_id in generated SQL |
| **Password Storage** | bcrypt | 10 salt rounds |

### Password Policy

```
Minimum 8 characters
At least 1 uppercase letter (A-Z)
At least 1 lowercase letter (a-z)
At least 1 digit (0-9)
At least 1 special character (@$!%*?&)
```

### Edge Cases Tested

- Empty string inputs
- SQL injection in email/password fields
- XSS payloads in form fields
- Expired JWT tokens
- Tampered JWT tokens
- Token signed with wrong secret
- Non-admin accessing admin routes
- Student accessing other students' data
- Invalid roles during registration
- Duplicate username/email registration

---

## 🧪 Edge Case Matrix

| Category | Edge Case | Expected Result | Test ID |
|----------|-----------|----------------|---------|
| Email | Missing @ | 400 Bad Request | auth.test.js |
| Email | No domain after @ | 400 Bad Request | auth.test.js |
| Email | Spaces in email | 400 Bad Request | auth.test.js |
| Email | No TLD | 400 Bad Request | auth.test.js |
| Password | < 8 chars | 400 Bad Request | auth.test.js |
| Password | No uppercase | 400 Bad Request | auth.test.js |
| Password | No lowercase | 400 Bad Request | auth.test.js |
| Password | No digit | 400 Bad Request | auth.test.js |
| Password | No special char | 400 Bad Request | auth.test.js |
| Auth | No Bearer token | 401 Unauthorized | security.test.js |
| Auth | Expired token | 401 Unauthorized | security.test.js |
| Auth | Wrong secret | 401 Unauthorized | security.test.js |
| RBAC | Student → admin route | 403 Forbidden | security.test.js |
| RBAC | No user object | 403 Forbidden | security.test.js |
| SQL | DROP TABLE | Blocked | test_unit.py |
| SQL | DELETE injection | Blocked | test_unit.py |
| SQL | INSERT injection | Blocked | test_unit.py |
| SQL | UNION attack | Blocked | test_unit.py |
| SQL | GRANT privilege | Blocked | test_unit.py |
| AI RBAC | Student sees all data | Filtered/403 | evaluate_ai.py |

---

## 📈 Sample Output

### Backend Tests
```
PASS  tests/auth.test.js
  POST /api/auth/register
    ✅ should register a new student successfully
    ✅ should register an admin with valid admin_code
    ❌ should reject missing username
    ❌ should reject invalid email format
    ❌ should reject weak password
    ...
  POST /api/auth/login
    ❌ should reject missing credentials
    ❌ should reject non-existent email
    ...

Test Suites: 2 passed, 2 total
Tests:       52 passed, 52 total
```

### AI Evaluation
```
  📊 NL-to-SQL EVALUATION (Golden Dataset)
  NL-to-SQL Accuracy: 13/15 (86.7%)

  🔒 RBAC SECURITY EVALUATION
  RBAC Security: 4/4 (100.0%)

  🛡️ SQL INJECTION PREVENTION
  Injection Prevention: 5/5 (100.0%)

  📝 QUIZ GENERATION EVALUATION
  Quiz Format Validity: 3/3 (100.0%)

  💡 SMART INSIGHTS EVALUATION
  Insights Quality: 2/2 (100.0%)
```
