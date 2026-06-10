# Luckee Listing · GTM First MVP 工程交付清单

日期：2026-06-11

原型以当前确认版为准：[Luckee Listing Prototype](https://mrlong0129.github.io/luckee-listing-prototype/)

## 1. MVP 目标

MVP 只交付一件事：

```text
能按 Google Ads campaign / ad group / keyword 算出：
产品吸引力、登录注册损耗、免费试用完成率、订阅付费、ROI 7d / 30d
```

必须能算：

```text
CPQA = ad spend / qualified ASIN submit
Auth complete rate = auth complete / ASIN submit
Report ready rate = report ready / audit started
CPCL = ad spend / completed loop
Trial cost per completed loop = free trial cost / completed loop
CAC paid = (ad spend + free trial cost) / subscription success
ROI 30d = paid gross profit 30d / (ad spend + free trial cost)
```

## 2. 前端 MVP 需要完成

### FE-1. 广告归因捕获

Landing 首次进入时捕获并持久化：

```text
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
```

要求：

- 刷新不丢。
- 登录后不丢。
- checkout 不丢。
- 所有事件和关键 API request 都带上。

### FE-2. 身份串联

登录前生成：

```text
anonymous_id
session_id
```

登录后补齐：

```text
user_id
account_id
auth_method
```

要求：

- 登录前后同一用户不断链。
- `auth_method` 只允许：`google`、`email_login`、`email_signup`。

### FE-3. 登录注册入口

用户点击真实 audit CTA 后：

1. 发送 `listing_asin_submit`。
2. 未登录则展示登录/注册。
3. 发送 `listing_auth_gate_view`。
4. 登录成功发送 `listing_auth_complete`。
5. 登录成功后继续原 ASIN audit。

要求：

- Google 快速登录可用。
- 用户不用重复输入 ASIN。

### FE-4. audit 状态展示与事件

必须发送：

```text
listing_audit_started
listing_audit_phase_view
listing_audit_failed
listing_report_ready
```

`phase_status` 只允许：

```text
queued
running
failed
ready
```

要求：

- 页面状态来自后端真实状态。
- failed 有用户可理解反馈。
- ready 后能打开 report。

### FE-5. report 到 workspace 事件

必须发送：

```text
listing_report_view
listing_optimize_click
listing_free_bundle_confirm
listing_credit_confirm
listing_workspace_open
```

要求：

- 免费 bundle 和 credit confirm 必须区分。
- workspace 打开时必须带 `report_id`、`bundle_id`。

### FE-6. Accept & copy

必须发送：

```text
listing_fix_validation_block
listing_fix_accept
listing_fix_auto_copy
listing_fix_manual_copy
```

规则：

- validation pass 后才能 accept。
- valid accept 后自动复制。
- 自动复制成功：`clipboard_result=success`。
- 自动复制失败：展示 manual copy。
- manual copy 成功：`clipboard_result=manual_success`。
- validation block 不能触发 accept。
- validation block 不能触发 completed loop。

### FE-7. Export

必须发送：

```text
listing_export_copy
listing_export_download
```

要求：

- 复制 Title / Bullets / Search Terms 发送 `listing_export_copy`。
- 下载 A+ revision brief 发送 `listing_export_download`。

### FE-8. Completed loop

前端可以发送 `listing_completed_loop`，但后端必须最终去重。

有效来源：

```text
valid accept + auto copy success
manual copy success
export copy
export download
```

### FE-9. 订阅付费

必须发送：

```text
listing_subscribe_click
listing_checkout_started
listing_subscription_success
```

要求：

- checkout 从 Listing 内进入。
- checkout payload 带 `source=listing`。
- checkout payload 带 `session_id/gclid/gbraid/wbraid/asin/report_id/bundle_id`。

## 3. 前端事件公共字段

每个事件必须带：

```text
event_id
event_time
page_url
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

没有值传 `null`，不能省字段。

## 4. 后端 MVP 需要完成

### BE-1. event_log

提供事件上报接口，保存所有前端事件。

必须支持：

```text
event_id 去重
事件名校验
必填字段校验
event_properties 原样保存
```

必须能按以下字段查完整路径：

```text
gclid
session_id
anonymous_id
user_id
account_id
asin
audit_id
report_id
bundle_id
```

### BE-2. 归因和身份绑定

必须保存：

```text
first_touch
last_non_direct_touch
gclid
gbraid
wbraid
utm_*
anonymous_id
session_id
user_id
account_id
```

要求：

- 登录后把 `anonymous_id/session_id` 绑定到 `user_id/account_id`。
- checkout 和 subscription 继承 Listing 的归因。

### BE-3. audit 状态机

必须提供：

```text
POST /listing/audits
GET /listing/audits/:audit_id/status
GET /listing/reports/:report_id
```

必须记录：

```text
audit_id
asin
marketplace
user_id
account_id
status=queued/running/failed/ready
failure_reason_code
started_at
ready_at
elapsed_seconds
report_id
```

### BE-4. report / bundle ID

必须生成并贯穿：

```text
audit_id
report_id
bundle_id
```

要求：

- audit 开始生成 `audit_id`。
- report ready 生成 `report_id`。
- optimization bundle 生成 `bundle_id`。
- report、workspace、accept、export、checkout、subscription 都能串起来。

### BE-5. validation

后端是最终 validation 准入。

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

blocked 不能产生 accept，不能产生 completed loop。

### BE-6. completed loop 服务端计算

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

要求：

- 同一 report 多次 accept 只计一次 completed loop。
- `is_sample=true` 不进入 Google Ads 主转化。

### BE-7. 免费试用和 credit 账本

必须记录：

```text
free_audit_used
free_optimization_used
credit_cost
credit_balance_before
credit_balance_after
is_paid
usage_reason=audit/optimization_bundle/subscription
```

要求：

- 首次免费 audit 可识别。
- 首次免费 optimization bundle 可识别。
- 免费用完后能触发 credit / subscription gate。

### BE-8. 免费试用成本

必须落 `usage_cost`：

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

要求：

- 能算 `free_trial_cost`。
- 能按 campaign / keyword 汇总免费试用成本。

### BE-9. billing / subscription

必须落 `subscription_revenue`：

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

要求：

- subscription success 能关联 Google Ads click。
- refund 和 payment fee 进入 ROI。
- `source=listing` 不丢。

### BE-10. Google Ads 回传

必须回传：

```text
listing_completed_loop
listing_subscription_success
```

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
- 重试不能重复计数。

### BE-11. Google Ads 成本导入

每天导入：

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

要求：

- 能按 campaign / ad group / keyword 算 CPQA、CPCL、ROI。

### BE-12. ROI dashboard 数据

必须输出：

```text
date
campaign
ad_group
keyword
spend
clicks
CPC
CTR
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

## 5. 产品 / 增长需要给前后端什么

### 5.1 产品给前端

| 需要给 | 用途 | 状态 |
|---|---|---|
| 最终原型链接 | UI、流程、文案、状态以原型为准 | 已有 |
| 完整用户路径 | landing -> audit CTA -> auth -> audit progress -> report -> optimize -> workspace -> accept/export -> subscribe | 需确认一版 |
| 页面状态说明 | loading、queued、running、failed、ready、validation blocked、copy failed、payment success | 需确认一版 |
| validation 文案 | 超限、未确认 claim、restricted term、copy failed 的用户可见文案 | 需确认一版 |
| free / credit gate 文案 | 免费 audit、免费 optimization、credit confirm、subscription gate | 需确认一版 |
| sample ASIN | 用于 QA 的固定 ASIN 和预期结果 | 需给 |

### 5.2 产品给后端

| 需要给 | 用途 | 状态 |
|---|---|---|
| 免费试用规则 | 首次 free audit、首次 free optimization bundle、用完后如何进入 credit/subscription | 需确认一版 |
| validation 规则口径 | Title 字符限制、Search Terms bytes 限制、restricted terms、unconfirmed claim | 需确认一版 |
| completed loop 定义 | valid accept + copy、manual copy、export copy、export download | 已定 |
| sample 不计主转化规则 | sample report / demo workspace 是否排除 Google Ads 主转化 | 需确认一版 |
| plan / price 口径 | plan_name、price_id、订阅价格、是否复用 Luckee 1.0 | 需给 |

### 5.3 增长给前后端

| 需要给 | 用途 | 状态 |
|---|---|---|
| UTM 命名规范 | campaign / ad group / keyword / landing variant 能稳定归因 | 需给 |
| Google Ads 账号信息 | conversion action、customer id、导入权限 | 需给 |
| campaign / ad group / keyword 表 | dashboard 按投放结构拆分 | 需给 |
| Google Ads conversion 名称 | completed loop、subscription success 回传使用 | 需给 |
| ROI dashboard 字段顺序 | 看板输出口径 | 已在本文列出，可确认 |
| trial 成本口径 | audit / report / bundle 成本用 actual 还是 estimated | 需确认一版 |
| ROI 观察窗口 | 7d、30d 是否作为 MVP 固定窗口 | 建议固定 |

## 6. 工程不需要等产品/增长补充的事项

这些可以直接开始：

```text
event_log
event ingestion API
anonymous_id / session_id
gclid / utm capture
auth_method tracking
audit_id / report_id / bundle_id
audit status model
completed loop dedupe
usage_cost table
subscription_revenue table
Google Ads conversion import skeleton
ROI dashboard base table
```

## 7. MVP 验收

| 验收项 | 通过标准 |
|---|---|
| 归因 | `gclid/utm` 从 landing 到 subscription 不丢 |
| 登录 | audit CTA 后 auth gate 可统计，auth complete 可统计 |
| audit | queued / running / failed / ready 可查 |
| report | report ready 和 report view 可查 |
| workspace | accept/copy/export 可查 |
| completed loop | 服务端去重，sample 不计主转化 |
| 成本 | free trial cost 可按 cohort 汇总 |
| 付费 | subscription success、refund、fee 可算净收入 |
| Google Ads | completed loop 和 subscription success 可回传 |
| ROI | campaign / keyword 粒度能看 ROI 7d / 30d |
