# Luckee Listing · GTM First 前端埋点与后端技术清单

日期：2026-06-11

依据：

- [16-google-ads-funnel-events-2026-06-11.md](16-google-ads-funnel-events-2026-06-11.md)
- [17-gtm-first-wave-roi-scorecard-2026-06-11.md](17-gtm-first-wave-roi-scorecard-2026-06-11.md)
- [18-gtm-first-p0-frontend-backend-delivery-2026-06-11.md](18-gtm-first-p0-frontend-backend-delivery-2026-06-11.md)

## 1. 目标

第一波 GTM 必须能算：

```text
CPQA
Auth complete rate
Report ready rate
CPCL
Trial cost per completed loop
CAC paid
ROI 7d
ROI 30d
```

## 2. 所有前端事件公共字段

每个前端事件必须带：

```text
event_id
event_time
page_url
page_path
anonymous_id
session_id
user_id
account_id
auth_state
gclid
gbraid
wbraid
utm_source
utm_medium
utm_campaign
utm_content
utm_term
landing_url
referrer
asin
marketplace
audit_id
report_id
bundle_id
is_sample
```

规则：

- `event_id` 前端生成 UUID，后端按 `event_id` 去重。
- `anonymous_id/session_id` 登录前必须存在。
- 登录成功后继续保留 `anonymous_id/session_id`，并补 `user_id/account_id`。
- `gclid/gbraid/wbraid/utm_*` 从 landing 保留到 checkout。
- 没有值的字段传 `null`，不能省字段。

## 3. 前端埋点完整清单

### 3.1 Acquisition / Landing

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_landing_view` | Listing landing 首次加载 | `variant`、`viewport_width`、`viewport_height` |
| P0 | `listing_asin_entered` | ASIN / URL 格式校验通过 | `input_type=asin/url`、`input_length` |
| P0 | `listing_asin_submit` | 点击真实 audit CTA | `source_section=hero/final_cta/audit_page`、`input_type`、`auth_state` |

### 3.2 Auth / Signup

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_auth_gate_view` | 登录/注册弹窗展示 | `gate_reason=audit_start/subscribe/credit` |
| P0 | `listing_auth_complete` | Google / email 登录注册成功 | `auth_method=google/email_login/email_signup` |

验收：

- 点击 audit CTA 后，未登录用户先看到 auth gate。
- Google 快速登录可用。
- 登录成功后继续原 audit，不要求用户二次提交 ASIN。

### 3.3 Audit / Progress

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_audit_started` | audit 创建成功，进入 agent loop | `expected_wait_seconds` |
| P0 | `listing_audit_phase_view` | queued / running / failed / ready 状态展示或变化 | `phase_name`、`phase_index`、`phase_status`、`elapsed_seconds` |
| P0 | `listing_audit_failed` | audit 失败 | `failure_reason_code`、`elapsed_seconds` |
| P0 | `listing_report_ready` | report 可打开 | `score_before`、`risk_high_count` |

`phase_status` 只允许：

```text
queued
running
failed
ready
```

### 3.4 Report / Optimization Intent

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_report_view` | report first fold 曝光 | `score_before`、`question_total`、`clear_count` |
| P0 | `listing_optimize_click` | 点击 Generate fixes | `score_before`、`score_projected`、`free_loop_status` |
| P0 | `listing_free_bundle_gate_view` | 首次免费 optimization 确认弹窗展示 | `bundle_cost=free`、`free_loop_status` |
| P0 | `listing_credit_gate_view` | 非首次或额度不足时 credit 确认展示 | `credit_cost`、`credit_balance`、`plan_name` |
| P0 | `listing_free_bundle_confirm` | 确认使用免费 optimization bundle | `free_loop_status` |
| P0 | `listing_credit_confirm` | 确认消耗 credit 生成 optimization | `credit_cost`、`credit_balance_before` |

### 3.5 Workspace / Accept & Copy

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_workspace_open` | workspace 可用 | `score_before`、`score_projected` |
| P1 | `listing_workspace_tab_click` | 切换 Title / Bullets / A+ / Search Terms | `field_type` |
| P1 | `listing_fix_edit` | 点击 Edit 或保存编辑 | `suggestion_id`、`field_type`、`edit_stage=start/save` |
| P0 | `listing_fix_validation_block` | Accept 被 validation 阻断 | `suggestion_id`、`field_type`、`validation_reason_code`、`char_count`、`byte_count` |
| P0 | `listing_fix_accept` | 接受一条通过 validation 的建议 | `suggestion_id`、`field_type`、`validation_status=valid`、`accept_source=original/edited` |
| P0 | `listing_fix_auto_copy` | valid accept 后自动复制 | `suggestion_id`、`field_type`、`clipboard_result=success/failed` |
| P0 | `listing_fix_manual_copy` | 自动复制失败后的手动复制成功 | `suggestion_id`、`field_type`、`clipboard_result=manual_success` |
| P1 | `listing_fix_reject` | 拒绝建议 | `suggestion_id`、`field_type`、`risk_level` |

`validation_reason_code` 只允许产品化 code：

```text
over_character_limit
over_byte_limit
unconfirmed_claim
restricted_term
empty_value
backend_validation_failed
```

禁止：

- validation block 后发送 `listing_fix_accept`。
- validation block 后触发 `listing_completed_loop`。
- 前端展示内部角色名或后端约束名。

### 3.6 Export / Value Delivery

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_export_click` | 打开 Export modal | `accepted_count`、`edited_count`、`pending_count` |
| P0 | `listing_export_copy` | 复制 Title / Bullets / Search Terms | `copy_target=title/bullets/search_terms`、`clipboard_result` |
| P0 | `listing_export_download` | 下载 A+ revision brief | `download_type=aplus_revision_brief` |
| P0 | `listing_completed_loop` | 首次完成有效价值动作 | `completion_source=fix_accept/export_copy/export_download/manual_copy` |
| P1 | `listing_reaudit_click` | 点击 re-audit | `previous_report_id`、`accepted_count` |

前端触发 `listing_completed_loop` 的有效来源：

```text
fix_accept + auto_copy_success
manual_copy_success
export_copy
export_download
```

后端必须做最终去重。

### 3.7 Subscription / Billing

| 优先级 | 事件 | 触发点 | 额外字段 |
|---|---|---|---|
| P0 | `listing_subscription_gate_view` | 免费 loop 用完或点击 paid plan | `gate_reason=free_loop_used/plan_click/no_credit`、`plan_name` |
| P0 | `listing_subscribe_click` | 点击订阅 | `plan_name`、`price_id`、`source=listing` |
| P0 | `listing_checkout_started` | embedded billing / Stripe checkout 开始 | `checkout_session_id`、`plan_name`、`price_id`、`source=listing` |
| P0 | `listing_subscription_success` | 支付成功 | `subscription_id`、`plan_name`、`price_id`、`value`、`currency` |

验收：

- checkout 不丢 `source=listing`。
- checkout 不丢 `session_id/gclid/gbraid/wbraid/asin/report_id/bundle_id`。
- 支付成功可以关联到原 Google Ads click。

## 4. 后端技术完整清单

### 4.1 Event ingestion

需要做：

1. 提供事件上报接口。
2. 支持单条和批量上报。
3. 按 `event_id` 去重。
4. 校验事件名和必填字段。
5. 原样保存 `event_properties`。

建议接口：

```text
POST /analytics/events
POST /analytics/events/batch
```

必须落库：`event_log`

```text
event_id
event_name
event_time_client
event_time_server
anonymous_id
session_id
user_id
account_id
asin
marketplace
audit_id
report_id
bundle_id
gclid
gbraid
wbraid
utm_source
utm_medium
utm_campaign
utm_content
utm_term
landing_url
referrer
event_properties
```

验收：

- 任意 `gclid` 可查完整事件链路。
- 任意 `session_id` 可查完整事件链路。
- 重复上报同一 `event_id` 只保存一次。

### 4.2 Attribution storage

需要做：

1. 保存首次归因参数。
2. 保存最近一次 non-direct 归因参数。
3. 登录后把 `anonymous_id` 绑定到 `user_id/account_id`。
4. checkout 和 subscription 继承 Listing 归因。

必须支持：

```text
first_touch
last_non_direct_touch
gclid
gbraid
wbraid
utm_*
landing_url
referrer
```

验收：

- 用户从广告进入、登录、audit、checkout、subscription 后仍能查到同一个 click id。

### 4.3 Audit job state

需要做：

1. 创建 audit job。
2. 返回 `audit_id`。
3. 记录真实状态。
4. 记录失败原因。
5. report ready 时生成 `report_id`。

建议接口：

```text
POST /listing/audits
GET /listing/audits/:audit_id/status
GET /listing/reports/:report_id
```

必须记录：

```text
audit_id
user_id
account_id
asin
marketplace
status=queued/running/failed/ready
failure_reason_code
started_at
ready_at
elapsed_seconds
report_id
```

验收：

- 前端展示的 progress 状态来自后端真实状态。
- failed 有原因。
- ready 能打开 report。

### 4.4 Report / bundle identity

需要做：

1. report ready 生成 `report_id`。
2. optimization bundle 生成 `bundle_id`。
3. 同一流程的事件都能串联到 `audit_id/report_id/bundle_id`。

建议接口：

```text
POST /listing/reports/:report_id/optimization-bundles
GET /listing/workspaces/:bundle_id
```

必须记录：

```text
audit_id
report_id
bundle_id
asin
marketplace
user_id
account_id
score_before
score_projected
free_loop_status
credit_cost
credit_balance_before
credit_balance_after
```

验收：

- 一个 ASIN 的一次完整流程能串成 `audit_id -> report_id -> bundle_id -> subscription_id`。

### 4.5 Validation service

需要做：

1. 后端校验 Title / Bullets / A+ / Search Terms。
2. 返回可展示的 reason code。
3. 阻断不合规 accept。

必须校验：

```text
character_limit
byte_limit
restricted_terms
unconfirmed_claim
empty_value
```

必须返回：

```text
validation_status=valid/blocked
validation_reason_code
char_count
byte_count
restricted_terms_count
has_unconfirmed_claim
```

验收：

- 前端 validation 可以预校验。
- 后端 validation 是最终准入。
- blocked 不产生 accept。
- blocked 不产生 completed loop。

### 4.6 Completed loop canonical calculation

需要做：

1. 服务端计算 canonical `listing_completed_loop`。
2. 按用户、ASIN、marketplace、report 去重。
3. 排除 sample report。

有效来源：

```text
listing_fix_accept + listing_fix_auto_copy(success)
listing_fix_manual_copy(manual_success)
listing_export_copy(success)
listing_export_download
```

去重 key：

```text
coalesce(user_id, anonymous_id) + asin + marketplace + report_id
```

窗口：

```text
7 days
```

验收：

- 同一 report 多次 accept 只计一次 completed loop。
- validation block 不计 completed loop。
- `is_sample=true` 不进入 Google Ads 主转化。

### 4.7 Free trial and credit ledger

需要做：

1. 记录免费 audit 使用。
2. 记录免费 optimization bundle 使用。
3. 记录 credit 消耗。
4. 返回前端可展示的 free / credit 状态。

必须记录：

```text
account_id
free_audit_used
free_optimization_used
credit_cost
credit_balance_before
credit_balance_after
is_paid
usage_reason=audit/optimization_bundle/subscription
```

验收：

- 首次免费 audit 可识别。
- 首次免费 optimization bundle 可识别。
- 免费用完后能触发 credit / subscription gate。
- `listing_free_bundle_confirm` 和 `listing_credit_confirm` 可区分。

### 4.8 Usage cost tracking

需要做：

1. 记录每次 audit 成本。
2. 记录每次 report 成本。
3. 记录每次 optimization bundle 成本。
4. 记录 data / infra 成本。

必须落库：`usage_cost`

```text
cost_time
user_id
account_id
asin
audit_id
report_id
bundle_id
cost_type=audit/report/optimization_bundle/infra/data
cost_amount
currency
is_free_trial
cost_source=actual/estimated
```

验收：

- 能算 `free_trial_cost`。
- 能算 `trial cost per completed loop`。
- 能按 campaign / keyword 汇总免费试用成本。

### 4.9 Billing / subscription

需要做：

1. Listing 内发起 checkout。
2. checkout 继承 Listing attribution。
3. webhook 记录订阅成功、退款、手续费。
4. subscription success 写回事件表。

建议接口：

```text
POST /billing/checkout-sessions
POST /billing/webhooks
GET /billing/subscriptions/:subscription_id
```

必须落库：`subscription_revenue`

```text
payment_time
user_id
account_id
subscription_id
checkout_session_id
plan_name
price_id
gross_revenue
refund_amount
payment_fee
net_revenue
currency
source=listing
gclid
gbraid
wbraid
session_id
asin
report_id
bundle_id
```

验收：

- `subscription_success` 能关联 Google Ads click。
- refund 和 payment fee 进入 ROI。
- `source=listing` 不丢。

### 4.10 Google Ads conversion import

需要做：

1. 回传 `listing_completed_loop`。
2. 回传 `listing_subscription_success`。
3. 支持去重。
4. 失败重试。

回传字段：

```text
conversion_name
conversion_time
gclid
gbraid
wbraid
order_id
value
currency
```

规则：

- `listing_completed_loop.value=0`。
- `listing_subscription_success.value=net_revenue`。
- `order_id` 使用稳定 key。

建议 `order_id`：

```text
completed_loop: report_id + bundle_id + completion_source
subscription_success: subscription_id
```

验收：

- Google Ads 可看到 completed loop conversion。
- Google Ads 可看到 subscription success conversion。
- 重试不重复计数。

### 4.11 Google Ads cost import

需要做：

1. 每天导入 Google Ads spend。
2. 按 campaign / ad group / keyword 存储。
3. 与 event cohort 关联。

必须落库：`ads_cost`

```text
date
campaign_id
campaign_name
ad_group_id
ad_group_name
keyword
match_type
clicks
impressions
cost
currency
```

验收：

- 能按 campaign / ad group / keyword 算 CPQA、CPCL、ROI。

### 4.12 ROI data mart / dashboard

需要做：

1. 按 cohort 聚合漏斗。
2. 按 campaign / ad group / keyword 聚合成本。
3. 计算 ROI 7d / 30d。

必须输出：

```text
date
campaign
ad_group
keyword
spend
clicks
CTR
CPC
ASIN submit
CPQA
auth complete rate
report ready rate
completed loop
CPCL
free trial cost
trial cost per completed loop
subscribe click
checkout started
subscription success
CAC paid
paid gross profit
ROI 7d
ROI 30d
```

验收：

- 能识别损耗位置：landing、auth、audit、report、workspace、paid。
- 能按 keyword 判断继续投、修复、暂停。

## 5. 后端给前端的必要字段

### audit status response

```text
audit_id
status
phase_name
phase_index
elapsed_seconds
expected_wait_seconds
failure_reason_code
report_id
```

### report response

```text
report_id
audit_id
asin
marketplace
score_before
risk_high_count
question_total
clear_count
free_loop_status
```

### optimization bundle response

```text
bundle_id
report_id
score_projected
free_loop_status
credit_cost
credit_balance_before
credit_balance_after
suggestions[]
validation_rules
```

### suggestion item

```text
suggestion_id
field_type
risk_level
priority
current_value
suggested_value
char_count
byte_count
has_unconfirmed_claim
restricted_terms_count
validation_status
validation_reason_code
```

### checkout response

```text
checkout_session_id
subscription_id
plan_name
price_id
source=listing
redirect_url
```

## 6. 上线验收清单

| 模块 | 必须通过 |
|---|---|
| Attribution | `gclid/utm` 从 landing 到 subscription 不丢 |
| Identity | 登录前后 `anonymous_id/session_id/user_id/account_id` 可串联 |
| Frontend events | P0 事件全部可在 `event_log` 查到 |
| Audit status | queued / running / failed / ready 真实可查 |
| Validation | blocked 不 accept，不 completed loop |
| Accept & copy | valid accept 后自动复制，失败有 manual fallback |
| Completed loop | 服务端去重，sample 不计主转化 |
| Cost | audit / report / bundle 成本可按 cohort 汇总 |
| Billing | subscription / refund / fee 可计算 net revenue |
| Google Ads | completed loop 和 subscription success 可回传 |
| Dashboard | campaign / keyword 粒度能看 CPQA、CPCL、ROI 30d |

