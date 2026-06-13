# Communication Hub PoC — Database Schema

## 1. users (nhân viên nội bộ)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| name | string | |
| email | string UNIQUE | dùng login + **Sender Identification** (match `From` header Gmail) |
| password | string hashed | |
| role | enum | admin(Umino) / member |
| slack_id | string nullable UNIQUE | để @mention + **Sender Identification** (match Slack `user_id`) |
| chatwork_id | string nullable UNIQUE | ID tài khoản Chatwork + **Sender Identification** (match CW `account_id`) |
| is_active | boolean default true | thay vì hard-delete |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **Vai trò trong Sender Identification (§3.1 Bước 2a):** Khi nhận tin nhắn, hệ thống match external_id (email/chatwork_id/slack_id) với bảng `users`. Nếu match → `sender_type = 'internal'` + gắn `sender_user_id`. Không match → `sender_type = 'external'` (khách hàng).

> **Lưu ý bảo mật:** `config` trong `message_sources` chứa API keys/tokens — sử dụng Laravel `$casts = ['config' => 'encrypted:array']` để mã hóa ở application layer. Tuy nhiên với PoC có thể dùng jsonb bình thường, production cần chuyển sang encrypted.

## 2. message_sources (tích hợp các nguồn tin nhắn)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| provider | enum | chatwork / gmail / slack |
| name | string | "Chatwork Group A", "Gmail Support" |
| provider_source_id | string nullable | ID từ nguồn: slack_channel_id, chatwork_room_id |
| config | jsonb | lưu key xoay vòng (token, app_id, v.v.) — **cần encrypted trong production** |
| auto_map_type | enum | project / client / none (1 nhóm = 1 project/client) |
| mapped_project_id | bigint FK → projects nullable ON DELETE SET NULL | nếu auto_map_type = project |
| mapped_client_id | bigint FK → clients nullable ON DELETE SET NULL | nếu auto_map_type = client |
| is_active | boolean | |
| priority | int | thứ tự quét |
| last_sync_at | timestamp nullable | |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **Extensibility**: `config` dùng jsonb → thêm loại nguồn tin nhắn mới không cần sửa schema.

## 3. clients (đại diện khách hàng — công ty/tổ chức)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| display_name | string | tên công ty/tổ chức hiển thị |
| primary_email | string nullable UNIQUE | email chính (liên hệ chung) — nullable vì auto-create từ Person Dedup có thể chưa biết email |
| notes | text nullable | ghi chú thêm về khách hàng |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **Thay đổi quan trọng:** Khách hàng (client) đại diện cho một **công ty/tổ chức**. Một client có thể có nhiều **nhân viên liên hệ** (client_contacts). Thông tin cá nhân người gửi được lưu ở bảng `client_contacts`, không phải ở `clients`.

## 3b. client_contacts (nhân viên liên hệ của khách hàng)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| client_id | bigint FK → clients ON DELETE CASCADE | |
| display_name | string | tên hiển thị (VD: "Tanaka-san") |
| role | string nullable | chức vụ (VD: "Project Manager") |
| primary_email | string nullable | email cá nhân |
| notes | text nullable | ghi chú riêng |
| is_active | boolean default true | ngưng liên hệ thì set false |
| verification_status | enum default 'unverified' | unverified (auto-created bởi Person Dedup) / verified (Umino đã xác nhận) |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **Mục đích:** Một khách hàng (công ty) có thể có nhiều nhân viên liên hệ. VD: Công ty ABC có Tanaka-san (PM), Suzuki-san (Developer). Khi AI hoặc Umino xem tin nhắn, biết chính xác **ai** trong công ty khách hàng đang gửi.

## 3c. client_contact_external_ids (định danh đa kênh cho từng người liên hệ)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| client_contact_id | bigint FK → client_contacts ON DELETE CASCADE | |
| channel | enum | gmail / chatwork / slack |
| external_id | string | ID từ nguồn (email, chatwork account_id, slack user_id) |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **UNIQUE(channel, external_id)** — DB tự chống duplicate khi concurrent ingest. Khi ingest: `INSERT ... ON CONFLICT DO NOTHING` → nếu conflict thì lấy `client_contact_id` existing → suy ra `client_id` qua relation.

> **Thay đổi thiết kế:** Bảng cũ `client_external_ids` (map theo client) được thay bằng bảng này (map theo client_contact). Lý do: Cùng 1 công ty nhưng nhiều nhân viên, mỗi người có email/ID kênh riêng. Person Dedup sẽ match ở cấp contact → tự động liên kết client.

## 3d. client_external_ids (định danh đa kênh cấp công ty — dùng cho nguồn chung)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| client_id | bigint FK → clients ON DELETE CASCADE | |
| channel | enum | gmail / chatwork / slack |
| external_id | string | ID dùng cho kênh chung (VD: chatwork room_id, slack channel_id — khi cả công ty dùng chung 1 kênh) |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **UNIQUE(channel, external_id)** — Dùng cho trường hợp nguồn tin nhắn map trực tiếp tới client (VD: `message_sources.auto_map_type = client`). Thuật toán Person Dedup: **Ưu tiên match `client_contact_external_ids` trước** (cấp cá nhân) → Nếu không match → Thử match `client_external_ids` (cấp công ty).

## 4. projects

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| name | string | |
| description | text | |
| status | enum | active / archived |
| core_brief | jsonb | thông tin cứng do Admin nhập (brief, requirements...) |
| synthesized_knowledge | jsonb | kiến thức động do AI tổng hợp từ chat |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

## 5. project_knowledge_updates

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| project_id | bigint FK → projects ON DELETE CASCADE | |
| content | text | nội dung update từ AI |
| category | enum | decision / change / issue / note / other — để AI tổng hợp (Job 12) biết merge vào nhóm nào |
| status | enum | pending / processed / rejected |
| processed_at | timestamp nullable | thời điểm Job 12 đã xử lý |
| source_message_id | bigint FK → messages ON DELETE SET NULL | tin nhắn gốc tạo ra update |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

## 5b. project_knowledge_history

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| project_id | bigint FK → projects ON DELETE CASCADE | |
| content | text | snapshot synthesized_knowledge tại thời điểm archived |
| version | int | số thứ tự snapshot, tăng dần |
| archived_at | timestamp | thời điểm lưu snapshot |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

## 6. threads (gom cuộc trò chuyện)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| project_id | bigint FK → projects nullable ON DELETE SET NULL | |
| client_id | bigint FK → clients nullable ON DELETE SET NULL | nullable: chưa xác định được client hoặc merged thread |
| title | string | tự động hoặc user đặt |
| first_message_at | timestamp | |
| last_message_at | timestamp | |
| message_count | int | |
| current_assignee_id | bigint FK → users nullable ON DELETE SET NULL | người phụ trách hiện tại |
| assignee_changed_at | timestamp nullable | lần cuối đổi assignee |
| last_summarized_message_id | bigint FK → messages nullable ON DELETE SET NULL | mốc tin nhắn cuối cùng đã được tóm tắt |
| status | enum | active / resolved / merged |
| merged_into | bigint FK → threads nullable ON DELETE SET NULL | nếu bị gộp |
| merged_at | timestamp nullable | thời điểm gộp thread |
| merged_by | bigint FK → users nullable ON DELETE SET NULL | người thực hiện gộp (Umino) |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

## 7. thread_summaries (tóm tắt thread cho AI context)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| thread_id | bigint FK → threads ON DELETE CASCADE | |
| summary | text | AI tóm tắt toàn bộ thread |
| message_count | int | số message đã tóm tắt |
| generated_at | timestamp | |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **Cơ chế (Rolling Summary)**: Chạy định kỳ hoặc khi có thêm **10** tin nhắn MỚI (chưa tóm tắt). Lấy summary cũ + các tin nhắn từ `last_summarized_message_id` trở đi để tạo summary mới.

## 8. messages

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| source_id | bigint FK → message_sources ON DELETE RESTRICT | |
| client_id | bigint FK → clients nullable ON DELETE SET NULL | công ty khách hàng |
| client_contact_id | bigint FK → client_contacts nullable ON DELETE SET NULL | **người gửi cụ thể** — nhân viên nào của khách hàng gửi tin này |
| project_id | bigint FK → projects nullable ON DELETE SET NULL | |
| thread_id | bigint FK → threads nullable ON DELETE SET NULL | |
| external_id | string | ID unique từ nguồn (Chatwork msg_id, Gmail messageId, Slack ts) |
| thread_external_id | string nullable | ID thread từ nguồn (Gmail threadId, Slack thread_ts) — dùng cho batching & reply chain |
| reply_to_external_id | string nullable | ID tin gốc khi reply (Chatwork reply_to, Gmail In-Reply-To header) |
| message_id_header | string nullable | Gmail Message-ID header (RFC 2822), dùng cho reply chain lookup |
| direction | enum | inbound / outbound |
| sender_type | enum | internal / external — xác định bởi Sender Identification (§3.1 Bước 2a) |
| sender_user_id | bigint FK → users nullable ON DELETE SET NULL | người gửi nội bộ (chỉ có khi `sender_type = 'internal'`). Dùng cho Job 7 kiểm tra assignee đã trả lời chưa. |
| action_type | enum | create / update / delete |
| original_message_id | bigint FK → messages nullable ON DELETE SET NULL | tin gốc khi update/delete |
| reply_to_message_id | bigint FK → messages nullable ON DELETE SET NULL | tin được reply (Chatwork), resolved từ `reply_to_external_id` |
| batch_id | string nullable | ID nhóm batch classify |
| content | text | nội dung gốc |
| pending_content | text nullable | nội dung mới khi tin bị sửa trong lúc đang processing (§3.1 Bước 3) |
| summary | text | AI tóm tắt |
| draft_reply | text nullable | AI gợi ý trả lời |
| ai_classification | jsonb | `{project, priority, category, suggested_assignee, sentiment, needs_reply, suggested_action, confidence}` — dùng cho Job 6 (NotifyRouting đọc `needs_reply`), hiển thị Dashboard |
| content_label | enum | phân loại từng tin: new_request / answer / info / chit_chat / action_confirmation |
| priority | enum | high / medium / low |
| has_attachments | boolean | |
| attachments | jsonb | [{name, url, size}] — chỉ metadata |
| sender_info | jsonb | {name, email, avatar} từ nguồn — **chỉ cache hiển thị**, nguồn chân trị là `client_contact_id` (external) hoặc `sender_user_id` (internal) |
| tags | jsonb | Danh sách member bị @mention: `[{user_id, name}]` — dùng cho notification routing |
| source_url | string nullable | permalink gốc (Slack permalink, Gmail web URL, Chatwork room URL) — tính sẵn khi ingest |
| received_at | timestamp | thời điểm tạo ở nguồn |
| is_read | boolean | Umino đã xem |
| is_notified | boolean | đã gửi noti (lần đầu) |
| notification_dispatched_at | timestamp nullable | **mốc bắt đầu đếm delay** cho CheckAssigneeResponse (Job 7) — ghi tại Job 6 (NotifyRouting), Slack notification thật sự chỉ được gửi sau khi Job 7 xác nhận assignee chưa trả lời |
| status | enum | new / pending_batch / processing / classified / draft_pending / draft_generated / draft_failed / notified / notify_failed / assigned / resolved / **archived** / ignored / error_retryable / error_fatal / manual_review |
| has_update | boolean default false | tin nhắn đã xử lý bị sửa nội dung |
| draft_available | boolean default true | AI có sinh được draft không |
| retry_count | int default 0 | số lần đã retry (max = `system_settings.max_retry_count`) |
| processing_heartbeat_at | timestamp nullable | timestamp heartbeat cuối cùng của processing job |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **UNIQUE(source_id, external_id)** — chống duplicate tin nhắn khi concurrent ingest. Khi ingest: `INSERT ... ON CONFLICT DO NOTHING`.

> **Index cần thiết:** Xem chi tiết tại section [Index Chiến Lược](#12-index-chiến-lược) bên dưới.

> **Về `client_contact_id`:** Khi ingest, Person Dedup sẽ match external_id (email, chatwork_id, slack_id) → tìm ra `client_contact_id` → suy ra `client_id` qua relation. Nếu inbound nhưng chưa xác định được contact (VD: email lạ) → `client_contact_id = NULL`, `client_id` có thể đã xác định qua rule-based. Dashboard cho phép Umino map contact sau.

## 9. tasks

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| message_id | bigint FK → messages ON DELETE CASCADE | |
| thread_id | bigint FK → threads nullable ON DELETE SET NULL | Thread mà task thuộc về |
| project_id | bigint FK → projects nullable ON DELETE SET NULL | **denormalized** — query tasks theo project nhanh hơn, sync từ message.project_id |
| assigner_id | bigint FK → users ON DELETE SET NULL (Umino) | |
| assignee_id | bigint FK → users ON DELETE SET NULL (member) | |
| title | string | |
| instruction | text | chỉ thị cụ thể từ Umino |
| reply_path | enum default 'path_a' | `path_a` (member tự reply khách) / `path_b` (member xử lý → báo kết quả Umino → Umino reply) |
| result | text nullable | Member điền kết quả xử lý — Umino dùng để reply khách (Path B) |
| deadline | timestamp nullable | `created_at` + `system_settings.task_sla_deadline` (mặc định: 30 phút từ lúc tạo task) |
| status | enum | pending / in_progress / done / overdue |
| slack_message_ts | string nullable | timestamp Slack notification |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

## 9b. notification_logs

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| message_id | bigint FK → messages ON DELETE CASCADE | tin nhắn gốc trigger notification |
| thread_id | bigint FK → threads nullable ON DELETE SET NULL | |
| recipient_type | enum | assignee / umino / channel |
| recipient_id | string | user_id hoặc slack_id tùy recipient_type |
| channel | enum | slack_dm / slack_channel / chatwork |
| notification_type | enum | first_notify / reminder / escalation / content_update |
| slack_ts | string nullable | Slack timestamp để thread reply/update sau |
| cancellation_token | string nullable | Redis token để cancel delayed job (CheckAssigneeResponse) |
| dispatched_at | timestamp | **mốc bắt đầu đếm delay** cho Job 7 — ghi tại Job 6, Slack notification thật sự gửi sau khi Job 7 xác nhận assignee chưa trả lời |
| delay_config | int | giá trị `system_settings.check_response_delay` tại thời điểm dispatch (snapshot) |
| reminder_count | int default 0 | số lần đã nhắc lại (max = `system_settings.max_reminders`) |
| status | enum | sent / failed / cancelled / read |
| sent_at | timestamp | |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

> **Dùng cho:** dedup notification (Redis TTL hết vẫn có DB), audit, reminder định kỳ, cancel delayed job khi assignee đã reply (§6.2 edge case).

## 10. ai_logs (theo dõi token AI — append-only)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| model | string | gpt-4o, gemini-2.0, v.v. |
| operation | enum | classify / generate_draft / regenerate_draft / summarize_thread / synthesize_knowledge / update_context / validate_reply |
| prompt_tokens | int | |
| completion_tokens | int | |
| total_tokens | int | |
| cost_usd | decimal(10,6) | tính theo giá model |
| project_id | bigint FK → projects nullable ON DELETE SET NULL | |
| message_id | bigint FK → messages nullable ON DELETE SET NULL | |
| thread_id | bigint FK → threads nullable ON DELETE SET NULL | cho operation `summarize_thread` |
| request_payload | jsonb | prompt đã gửi |
| response_payload | jsonb | response từ AI |
| duration_ms | int | thời gian xử lý |
| created_at | timestamp | Laravel auto |

> **Lưu ý:** Bảng này là append-only (chỉ ghi, không sửa). Đã bỏ `updated_at` vì không cần thiết.

---

## 11. system_settings (cấu hình hệ thống — configurable)

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK auto-increment | |
| key | string UNIQUE | VD: `batch_debounce_delay`, `check_response_delay` |
| value | jsonb | |
| description | string | |
| created_at | timestamp | Laravel auto |
| updated_at | timestamp | Laravel auto |

**Seed data (giá trị mặc định — xem chi tiết §3.7 architecture.md):**

| Key | Mặc định | Mô tả |
|-----|----------|--------|
| `batch_debounce_delay` | 15 (phút) | Thời gian chờ gom batch |
| `batch_max_wait` | 30 (phút) | Thời gian tối đa chờ batch |
| `batch_max_messages` | 20 | Số tin tối đa trong 1 batch |
| `task_sla_deadline` | 30 (phút) | SLA phản hồi — tính từ lúc task được assign (tạo task) |
| `check_response_delay` | 15 (phút) | Chờ assignee trả lời trước khi notify (tính từ `notification_dispatched_at`) |
| `cancel_token_buffer` | 30 (phút) | Buffer cho cancellation token Redis |
| `heartbeat_check_interval` | 5 (phút) | Tần suất kiểm tra processing heartbeat |
| `heartbeat_timeout` | 10 (phút) | Timeout processing không heartbeat |
| `reminder_interval` | 30 (phút) | Khoảng cách nhắc lại |
| `max_reminders` | 3 | Số lần nhắc tối đa trước escalation |
| `escalation_target` | `"umino"` | Người nhận escalation |
| `thread_summary_threshold` | 10 | Số tin chưa tóm tắt để trigger SummarizeThread |
| `knowledge_update_threshold` | 5 | Số pending updates để trigger SynthesizeProjectKnowledge |
| `max_retry_count` | 3 | Retry tối đa cho error_retryable |
| `max_notify_retry` | 5 | Retry tối đa cho notify_failed |
| `sync_interval` | 5 (phút) | Tần suất polling SyncMessages |

---

## 12. Index Chiến Lược

### 12.0 users

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_users_email` | `UNIQUE(email)` | Login + chống duplicate (đã khai báo ở schema) |
| `idx_users_slack_id` | `UNIQUE(slack_id) WHERE slack_id IS NOT NULL` | Person Dedup match inbound outbound |
| `idx_users_chatwork_id` | `UNIQUE(chatwork_id) WHERE chatwork_id IS NOT NULL` | Person Dedup match Chatwork |
| `idx_users_role` | `(role)` | Query users theo role |

### 12.1 messages (bảng lớn nhất, query nhiều nhất)

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_messages_source_external` | `UNIQUE(source_id, external_id)` | Lookup tin nhắn theo nguồn, **chống duplicate khi concurrent ingest** |
| `idx_messages_batch_status` | `(batch_id, status)` | Query batch nhanh khi ProcessBatch chạy |
| `idx_messages_status_heartbeat` | `(status, processing_heartbeat_at)` | Cron cleanup orphaned lock |
| `idx_messages_thread_created` | `(thread_id, created_at)` | Tin nhắn theo thread, sắp xếp thời gian |
| `idx_messages_client_id` | `(client_id)` | Tin nhắn theo khách hàng |
| `idx_messages_client_contact_id` | `(client_contact_id)` | Tin nhắn theo người liên hệ cụ thể |
| `idx_messages_sender_user_id` | `(sender_user_id)` | Tin nhắn theo người gửi nội bộ — Job 7 kiểm tra assignee đã trả lời chưa |
| `idx_messages_sender_type_thread` | `(sender_type, thread_id, received_at DESC)` | Job 7: query outbound của assignee trong thread sau `notification_dispatched_at` |
| `idx_messages_project_status` | `(project_id, status)` | Tin nhắn theo project + filter status |
| `idx_messages_direction_received` | `(direction, received_at DESC)` | Query inbound/outbound gần nhất |
| `idx_messages_status_created` | `(status, created_at)` | Cleanup/maintenance queries, dashboard filter |
| `idx_messages_reply_to` | `(reply_to_external_id)` | Reply chain lookup |
| `idx_messages_thread_external` | `(source_id, thread_external_id)` | Gom tin theo thread nguồn (Gmail threadId, Slack thread_ts) |
| `idx_messages_message_id_header` | `(message_id_header)` | Gmail RFC 2822 Message-ID lookup cho reply chain |

### 12.2 threads

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_threads_project_status` | `(project_id, status)` | Threads theo project, filter active/resolved |
| `idx_threads_client_id` | `(client_id)` | Threads theo khách hàng |
| `idx_threads_assignee` | `(current_assignee_id)` | Query threads theo assignee |
| `idx_threads_last_message` | `(last_message_at DESC)` | Sắp xếp threads theo hoạt động gần nhất |

### 12.3 client_contacts

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_cc_client_id` | `(client_id)` | Tìm tất cả contacts của 1 client |
| `idx_cc_email` | `(primary_email)` | Lookup contact theo email |
| `idx_cc_verification` | `(verification_status)` | Filter contacts cần Umino verify |

### 12.4 client_contact_external_ids

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_ccei_channel_external` | `UNIQUE(channel, external_id)` | Chống duplicate + Person Dedup match |
| `idx_ccei_contact_id` | `(client_contact_id)` | Tìm tất cả external IDs của 1 contact |

### 12.5 client_external_ids (cấp công ty)

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_cei_channel_external` | `UNIQUE(channel, external_id)` | Chống duplicate client khi concurrent ingest |
| `idx_cei_client_id` | `(client_id)` | Tìm tất cả external IDs cấp công ty |

### 12.6 clients

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_clients_primary_email` | `UNIQUE(primary_email) WHERE primary_email IS NOT NULL` | Lookup + chống duplicate (partial unique — cho phép nhiều NULL) |
| `idx_clients_display_name` | `(display_name)` | Search/Autocomplete |

### 12.7 notification_logs

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_notif_message_id` | `(message_id)` | Notification theo message |
| `idx_notif_thread_id` | `(thread_id)` | Notification theo thread |
| `idx_notif_cancellation_token` | `(cancellation_token)` | Lookup token khi check cancel |
| `idx_notif_recipient` | `(recipient_type, recipient_id)` | Query notification theo người nhận |
| `idx_notif_dispatched` | `(dispatched_at)` | Query notification theo thời điểm dispatch |
| `idx_notif_reminder` | `(message_id, notification_type, reminder_count)` | Escalation: tìm notification cần nhắc lại |

### 12.8 project_knowledge_updates

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_pku_project_status` | `(project_id, status)` | Updates pending theo project |
| `idx_pku_created_at` | `(created_at)` | Cron Job 12 query theo thời gian |

### 12.9 ai_logs

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_ai_logs_project_created` | `(project_id, created_at DESC)` | AI usage theo project + thời gian |
| `idx_ai_logs_operation` | `(operation, created_at DESC)` | Report usage theo loại operation |
| `idx_ai_logs_created_at` | `(created_at DESC)` | Report tổng hợp chi phí theo thời gian |
| `idx_ai_logs_thread_id` | `(thread_id)` | AI cost theo thread |

### 12.10 tasks

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_tasks_assignee_status` | `(assignee_id, status)` | Tasks theo member + status |
| `idx_tasks_message_id` | `(message_id)` | Task theo message |
| `idx_tasks_thread_id` | `(thread_id)` | Task theo thread |
| `idx_tasks_project_id` | `(project_id)` | Tasks theo project (denormalized) |
| `idx_tasks_deadline` | `(deadline)` | Cron check overdue tasks |

### 12.11 thread_summaries

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_ts_thread_created` | `(thread_id, created_at DESC)` | Summary mới nhất theo thread |

### 12.12 message_sources

| Index | Columns | Mục đích |
|-------|---------|----------|
| `idx_ms_provider_active` | `(provider, is_active)` | Query nguồn active theo loại |
| `idx_ms_provider_source` | `(provider, provider_source_id)` | Lookup nguồn theo ID kênh |
| `idx_ms_mapped_project` | `(mapped_project_id)` | Lookup source mapped tới project |
| `idx_ms_mapped_client` | `(mapped_client_id)` | Lookup source mapped tới client |

---

## 13. Redis Keys

> Redis dùng cho Queue, Cache, Lock và Dedup — không phải persistent store. Key có TTL tự động xoá.

### 13.1 Batching (Debounce)

| Key Pattern | TTL | Mục đích |
|-------------|-----|----------|
| `debounce_token:{channel}:{room_id}` | debounce_delay + 1h buffer | Soft cancel token cho DebounceBatch (Job 3). Tin mới cùng key → đánh dấu token cũ `cancelled` |
| `debounce_count:{channel}:{room_id}` | debounce_delay + 30m | Đếm số tin nhắn trong batch hiện tại (check giới hạn 20 tin) |
| `debounce_lock:{channel}:{room_id}` | 10s | Redis lock (`SET NX EX`) khi reset timer để tránh race condition |

**Ví dụ key:**
```
debounce_token:chatwork:12345
debounce_token:slack:C06ABCDEF
debounce_token:gmail:thread_abc123
debounce_count:chatwork:12345
debounce_lock:slack:C06ABCDEF
```

### 13.2 Notification Dedup & Cancel

| Key Pattern | TTL | Mục đích |
|-------------|-----|----------|
| `notify_dedup:{message_id}` | 1 hour | Tránh gửi duplicate notification trong khoảng thời gian ngắn |
| `assignee_response_cancel:{message_id}` | `check_response_delay` + `cancel_token_buffer` | Cancellation token cho CheckAssigneeResponse (Job 7). Assignee reply → đánh dấu `cancelled` |

### 13.3 Message Processing Lock

| Key Pattern | TTL | Mục đích |
|-------------|-----|----------|
| `processing_lock:{batch_id}` | 15 minutes | Lock batch khi đang xử lý AI, tránh 2 worker xử lý cùng batch |

### 13.4 Rate Limiting (AI & API)

| Key Pattern | TTL | Mục đích |
|-------------|-----|----------|
| `rate_limit:ai:{model}` | 1 minute | Đếm số AI call per minute theo model |
| `rate_limit:api:{channel}:{key_id}` | 1 minute | Tracking rate limit API kênh (Chatwork, Gmail) |

### 13.5 Cache

| Key Pattern | TTL | Mục đích |
|-------------|-----|----------|
| `cache:contact_external:{channel}:{external_id}` | 24 hours | Cache lookup client_contact_id từ external_id (giảm DB query) — **thay cho cache cũ cấp client** |
| `cache:project_context:{project_id}` | 1 hour | Cache project context (core_brief + synthesized_knowledge) cho AI prompt |
| `cache:thread_summary:{thread_id}` | 30 minutes | Cache thread summary gần nhất |

---

## 14. FK On-Delete Policy Tổng Hợp

| Bảng | FK | ON DELETE |
|------|-----|-----------|
| messages | source_id → message_sources | **RESTRICT** (không xóa source khi còn message) |
| messages | client_id → clients | SET NULL |
| messages | client_contact_id → client_contacts | SET NULL |
| messages | sender_user_id → users | SET NULL |
| messages | project_id → projects | SET NULL |
| messages | thread_id → threads | SET NULL |
| messages | original_message_id → messages | SET NULL |
| messages | reply_to_message_id → messages | SET NULL |
| threads | project_id → projects | SET NULL |
| threads | client_id → clients | SET NULL |
| threads | current_assignee_id → users | SET NULL |
| threads | last_summarized_message_id → messages | SET NULL |
| threads | merged_into → threads | SET NULL |
| threads | merged_by → users | SET NULL |
| client_contacts | client_id → clients | **CASCADE** |
| client_contact_external_ids | client_contact_id → client_contacts | **CASCADE** |
| client_external_ids | client_id → clients | **CASCADE** |
| tasks | message_id → messages | **CASCADE** |
| tasks | thread_id → threads | SET NULL |
| tasks | project_id → projects | SET NULL |
| tasks | assigner_id → users | SET NULL |
| tasks | assignee_id → users | SET NULL |
| thread_summaries | thread_id → threads | **CASCADE** |
| project_knowledge_updates | project_id → projects | **CASCADE** |
| project_knowledge_updates | source_message_id → messages | SET NULL |
| project_knowledge_history | project_id → projects | **CASCADE** |
| notification_logs | message_id → messages | **CASCADE** |
| notification_logs | thread_id → threads | SET NULL |
| ai_logs | project_id → projects | SET NULL |
| ai_logs | message_id → messages | SET NULL |
| ai_logs | thread_id → threads | SET NULL |
| message_sources | mapped_project_id → projects | SET NULL |
| message_sources | mapped_client_id → clients | SET NULL |

> **Nguyên tắc:** CASCADE dùng cho entity con (contacts, external_ids, summaries) — xóa cha thì xóa con. SET NULL dùng cho reference — xóa entity được reference thì giữ lại bản ghi nhưng bỏ FK. RESTRICT chỉ dùng cho `message_sources` — không cho xóa nguồn khi còn tin nhắn.

---

**Xem thêm:** [Kiến Trúc](architecture.md) | [Nghiên Cứu: 3 Kênh](research.md)
