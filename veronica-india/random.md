# 🌍 Complete Universe Map - MoveOps Database

I've explored the entire simulated universe! Here's a comprehensive breakdown of all tables, their relationships, and the world inside:

---

## 📊 **Database Overview**

This is **MoveOps**, a B2B employee relocation services company. The database integrates **9 major business services** with **28 tables** total.

---

## 🏗️ **Schema Architecture & Table Relationships**

### **1. AIRTABLE Schema** - Content Management
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **bases** | id, name | `appMoveOpsOps001` - "MoveOps Operations" | Airtable workspace containers |
| **tables** | id, name, base_id, description, fields, views | 3 tables: Relocations, Stipend Transactions, Client Accounts | Custom business process workflows |
| **records** | id, table_id, fields, created_time, modified_time | Client account data: Canopy Health, GreenStack Energy, PivotPoint Labs | Individual workflow records |

**Relationships:** `bases` → `tables` → `records`

---

### **2. CALENDAR Schema** - Event Management
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **events** | event_id, title, start_datetime, end_datetime, tag, description, location, attendees | *Empty currently* | Schedule/meeting management |

---

### **3. CONTACTS Schema** - Core Personnel Directory
| Table | Columns | Sample Data | Purpose |
|-------|---------|------------|---------|
| **contacts** | contact_id, first_name, last_name, is_user, gender, age, nationality, city_living, country, status, job, description, phone, email, address | **Elena Rostova** (CEO), **Priya Chakrabarti** (Executive Assistant), **Marcus Thorne** (Head of Finance), **Hana Kim** (Accountant), **Alejandro Fuentes** (Financial Analyst) | MoveOps internal team + personal details |

---

### **4. CRM Schema** - Customer Relationship Management
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **crm_companies** | id, name, contact_ids, domain, address, city, state, country, zip, phone, industry, annualrevenue, numberofemployees, description, type | **Canopy Health** (620 emp, $85M revenue), **Vectral Systems** (280 emp, $45M), **GreenStack Energy** (340 emp, $62M), **PivotPoint Labs** (32 emp, $8.5M), **BrightLoop Analytics** (145 emp, $28M) | MoveOps client companies |
| **crm_contacts** | id, full_name, email, company_id, company, jobtitle, phone, mobilephone, address, city, state, country, zip | **Patricia Langford** (Canopy HR Director), **Rachel Whitfield** (Vectral VP People), **Derek Hollis** (GreenStack People Ops), **Sam Delgado** (PivotPoint CEO) | HR decision-makers at client companies |
| **crm_deals** | id, dealname, dealstage, company_id, amount, closedate, description, pipeline | 5 active Q2 2026 relocation deals ($5.8K-$13.5K each) | Sales pipeline: relocation contracts & revenue tracking |
| **crm_leads** | id, full_name, email, company_id, company, jobtitle, phone, industry, leadsource, rating, notes | **Derek Ashworth** (Veridian Software), **Sandra Okonkwo** (Helix Biosciences), **Marcus Levin** (Clearpath Financial), **Priya Nambiar** (Arcadia Consulting), **Rachel Huang** (Driftwood Analytics) | Prospect outreach (cold/warm leads) |
| **crm_engagements** | id, engagement_type, body, contact_ids, company_ids, title, description, phone | 5 relocation coordination notes from April 2026 | Activity log: relocation status updates, vendor coordination, risk assessments |

**Relationships:** `crm_companies` ←→ `crm_contacts` (via company_id), `crm_companies` ← `crm_deals` (via company_id), `crm_leads` link to prospects

---

### **5. EMAIL Schema** - Email Communications
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **emails** | email_id, folder, sender, recipients_json, subject, content, cc_json, parent_id, attachments_json, timestamp, is_read | Catalina (AM) & Mina (Coordinator) outreach emails (SENT folder) | Email archive with folder organization |
| **mailboxes** | id, name, role, total_emails, unread_emails, total_threads | *Empty* | Email account configuration |
| **threads** | id, email_ids_json | *Empty* | Email conversation grouping |
| **jmap_emails** | id, thread_id, mailbox_ids_json, from_json, to_json, subject, sent_at, received_at, text_body_json, html_body_json, attachments_json, keywords_json | *Not populated yet* | RFC 8621 JMAP standard format for email |

**Relationships:** `jmap_emails` → `threads` → `mailboxes`

---

### **6. LINEAR Schema** - Project Management & Issue Tracking
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **linear_teams** | id, name, key, description, is_archived, created_at, updated_at | **Engineering** (ENG), **Operations** (OPS), **Team Relocations** (TEAM_RELOC) | Internal team structure |
| **linear_users** | id, email, name, display_name, is_active, created_at, updated_at | **Samira Tariq** (Engineering Manager), **Lena Björkström** (Backend), **Dmitri Volkov** (Fullstack), **Chloe Vance** (Ops), **Fatimah Al-Rashidi** (Relocation Coordinator) | Team member accounts |
| **linear_projects** | id, team_id, name, description, lead_id, priority, state, start_date, target_date | **Expense Auto-Categorizer** (ENG, high priority), **BrightLoop/Canopy/GreenStack Relocations** (Team Relocs) | Product initiatives & client projects |
| **linear_issues** | id, project_id, team_id, parent_id, assignee_id, state_id, number, title, description, priority, estimate, due_date | 5 epics for expense categorization system (ENG-201 to ENG-204), sub-issue ENG-205 assigned to Lena | Work tickets & feature breakdown |
| **linear_comments** | id, issue_id, author_id, parent_id, body, is_edited, created_at | Technical discussion on categorization engine architecture, policy rules, testing strategy | Issue discussion & decision log |
| **linear_team_memberships** | id, team_id, user_id, created_at | Engineers in ENG team, Ops staff in OPS team | Team roster assignment |

**Relationships:** `linear_teams` ← `linear_projects` & `linear_team_memberships`, `linear_issues` → `linear_comments` → `linear_users`, `linear_issues` have parent-child hierarchy

---

### **7. PUBLIC Schema** - System Auditing
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **_changelog** | id, timestamp, schema_name, table_name, operation, row_id, summary, changed_fields | *Empty* | Audit trail for all CREATE/UPDATE/DELETE operations |

---

### **8. QUICKBOOKS Schema** - Financial Accounting
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **customers** | Id, DisplayName, CompanyName, Active, Taxable, Balance, BillAddr, PrimaryEmailAddr | **Canopy Health** ($5,047 balance), **Vectral Systems** ($5,397), **GreenStack Energy** ($7,289), **PivotPoint Labs** ($5,803), **BrightLoop Analytics** ($0 balance) | QB customer records (maps to CRM companies) |
| **vendors** | Id, DisplayName, CompanyName, Active, Vendor1099, Balance, BillAddr, PrimaryEmailAddr | **UrbanNest** (temp housing), **Atlas Travel** ($1,226 owed), **Swift Relocations** ($11,010 owed), **AWS** ($0), **Heartland Movers** ($12,800 owed) | Service provider/vendor registry |
| **accounts** | Id, Name, AccountType, AccountSubType, Classification, Description, CurrentBalance | **Cloud Infrastructure** ($42,870), **Employee Stipend Expense** ($14,235.50), **Relocation Moving Services** ($38,400), **Contingent Liability - Damage Claims** ($90,000), **DOT Penalties** ($50,000 accrual) | Chart of accounts |
| **invoices** | Id, DocNumber, TxnDate, DueDate, TotalAmt, Balance, CustomerRef, Line | 5 invoices: Canopy Abdi ($5,047), Vectral Tran ($5,397), GreenStack Venkatesh ($7,289), PivotPoint Kovac ($5,803), Terraform Enterprise ($462,500) | Sales invoices to clients |
| **bills** | Id, DocNumber, TxnDate, DueDate, TotalAmt, Balance, VendorRef, Line | Heartland, Swift, AWS bills ($2,150-$42,870 each) | Vendor payables |
| **items** | Id, Name, Type, UnitPrice, Description, IncomeAccountRef, ExpenseAccountRef | **Standard Relocation** ($4,500), **Premium Relocation** ($7,500), **Equipment Stipend** ($500), **Rush Surcharge** ($750) | Service line items for invoicing |

**Relationships:** `customers` (invoice to), `vendors` (payment from), `invoices` → `Line.ItemRef` → `items`, all use `accounts` for GL posting

---

### **9. SLACK Schema** - Team Communication
| Table | Columns | Key Data | Purpose |
|-------|---------|----------|---------|
| **slack_channels** | id, name, is_channel, is_private, is_im, is_mpim, num_members, topic, purpose, members_json | **#general**, **#customer-engagement**, **#engineering**, **#executive**, **#finance** | Team discussion channels |
| **slack_users** | id, name, real_name, display_name, email, is_bot, is_admin, deleted, timezone | **Elena Rostova** (admin), **Priya Chakrabarti**, **Marcus Thorne**, **Hana Kim**, **Alejandro Fuentes** | Team member Slack accounts |
| **slack_messages** | ts, channel_id, type, user_id, text, thread_ts, reply_count, reactions_json, files_json, created_at | Q1 2026 AM objectives posted in #customer-engagement; Canopy Health relocation announcements | Team conversations & status updates |

**Relationships:** `slack_messages` → `slack_users` (author), `slack_channels` (container), `slack_channels` → `slack_users` (members_json)

---

## 🔗 **Cross-Schema Relationships**

```
┌─────────────────────────────────────────────────────────────┐
│                      CORE BUSINESS FLOW                       │
└─────────────────────────────────────────────────────────────┘

CONTACTS (Staff)
    ├─→ LINEAR (Projects & Issues) — Engineering roadmap
    │       └─→ LINEAR_COMMENTS (Discussions)
    │
    ├─→ SLACK (Communication) — Team coordination
    │
    ├─→ EMAIL (Outreach) — Sales & operations
    │
    └─→ CRM (Customer Management)
            ├─→ CRM_COMPANIES (Clients)
            │       ├─→ CRM_CONTACTS (HR Contacts)
            │       │
            │       ├─→ CRM_DEALS (Sales Pipeline) 
            │       │       └─→ QUICKBOOKS_INVOICES (Billing)
            │       │
            │       └─→ CRM_ENGAGEMENTS (Coordination Notes)
            │
            └─→ CRM_LEADS (Prospects for Outreach)

AIRTABLE (Workflow Management)
    └─→ CLIENT_ACCOUNTS, RELOCATIONS, STIPEND_TRANSACTIONS

QUICKBOOKS (Financial Records)
    ├─→ CUSTOMERS (Invoice to)
    ├─→ VENDORS (Pay)
    ├─→ INVOICES & BILLS (Transactions)
    ├─→ ITEMS (Line items)
    └─→ ACCOUNTS (General Ledger)
```

---

## 📈 **Key Business Context**

### **Current Operations (Q1-Q2 2026)**

**Active Clients & Relocations:**
- **Canopy Health**: 4 active employees relocating to Chicago (~$9.2K invoice)
  - Dr. Yusuf Abdi (Minneapolis → Chicago)
  - Lily Marchetti (Nashville → Chicago)
  - Dr. Renata Kovacs (Nashville → Toronto, cross-border with visa complexity)
  - Marcus Webb (Detroit → Chicago, special lab equipment handling)
  - Tyler Okonkwo (Philadelphia → Denver)
  
- **Vectral Systems**: 2 relocations to Denver (~$5.4K)
- **GreenStack Energy**: 2 relocations to Seattle (~$7.3K, includes lab equipment surcharge)
- **PivotPoint Labs**: 1 relocation to Austin (~$5.8K) - COMPLETED
- **BrightLoop Analytics**: 2 relocations to Boston (~$11.4K) - First client, strong growth potential

### **Engineering Initiatives (Q1 2026)**
- **Expense Auto-Categorizer System** (ENG project)
  - Epic: Core Categorization Engine (ENG-201)
  - Sub-task: CategoryMatcher module (ENG-205) assigned to Lena Björkström
  - Target: Replace manual email-based expense review with automated system
  - Success metrics: 95%+ categorization accuracy, <4 hour turnaround

### **Sales Pipeline**
- **Lead Stage**: 5 warm prospects (Veridian, Helix Bio, Clearpath, Arcadia, Driftwood)
- **Deal Stage**: 5 Q2 2026 deals in various stages (Inquiry → Closed Won)
- **AM Coverage**: 
  - Mina (West Coast startups)
  - Catalina (Midwest enterprise)
  - Emeka (Southeast accounts)

### **Financial Status**
- **Accounts Receivable**: $23,536 (5 customer invoices)
- **Accounts Payable**: $33,360 (vendor bills, mostly moving services & AWS)
- **Contingent Liabilities**: 
  - $90,000 for damage claims on transported equipment
  - $50,000 DOT penalty accrual (PHMSA hazmat compliance inquiry)

---

## 🔐 **Data Quality Notes**

- **Calendar**: No events recorded yet (prepared but unused)
- **Email**: Only sent emails captured (INBOX, DRAFT, TRASH empty)
- **Changelog**: System ready but no operations logged yet
- **Airtable Records**: 3 records only (Client Accounts table)
- **Slack Activity**: Recent Q1 2026 coordination messages (late January through April)

---

This is a **fully integrated B2B SaaS operation** where sales, operations, engineering, and finance work together to manage employee relocations for enterprise clients! 🚀