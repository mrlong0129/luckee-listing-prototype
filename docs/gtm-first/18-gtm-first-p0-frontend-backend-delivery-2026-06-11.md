# Luckee Listing · GTM First P0 前后端交付清单

日期：2026-06-11

依据：[17-gtm-first-wave-roi-scorecard-2026-06-11.md](17-gtm-first-wave-roi-scorecard-2026-06-11.md)

## 1. P0 目标

第一波 GTM 必须能算出：

```text
GTM cohort ROI =
付费毛利 / (广告花费 + 免费试用直接成本)
```

P0 只做能支撑 ROI 判断的链路：

1. 广告点击能归因到用户、ASIN、report、bundle、订阅。
2. audit 前登录注册损耗能看清。
3. 免费 audit / optimization bundle 的直接成本能记录。
4. 用户是否完成有效价值动作能判断。
5. 订阅付费能回传到 Google Ads 和内部看板。

## 2. P0 必须产出的指标

| 指标 | 公式 | 必须可按 campaign / ad group / keyword 拆分 |
|---|---|---|
| CPQA | ad spend / qualified ASIN submit | 是 |
| Auth complete rate | auth complete / ASIN submit | 是 |
| Report ready rate | report ready / audit started | 是 |
| CPCL | ad spend / completed loop | 是 |
| Trial cost per completed loop | free trial cost / completed loop | 是 |
| CAC paid | (ad spend + free trial cost) / subscription success | 是 |
| ROI 30d | paid gross profit 30d / (ad spend + free trial cost) | 是 |

## 3. 前端 P0

### FE-1. 捕获广告归因参数

触发：Landing 首次进入。

必须捕获：

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

必须写入：

```text
first-party storage
session context
every event payload
audit / report / checkout API request
```

验收：

- 带 `gclid` 进入页面后，刷新页面不丢。
- 登录后不丢。
- 进入 checkout 后不丢。
- 所有 P0 事件都带同一组 attribution 字段。

### FE-2. 生成并串联匿名身份

首次访问生成：

```text
anonymous_id
session_id
```

登录成功后补齐：

```text
user_id
account_id
auth_method
```

验收：

- 登录前事件有 `anonymous_id/session_id`。
- 登录后事件同时有 `anonymous_id/session_id/user_id/account_id`。
- 同一用户从 ASIN submit 到 subscription success 能被串成一条路径。

### FE-3. 点击真实 audit CTA 后触发登录注册

触发：用户点击真实 audit CTA。

必须发送：

```text
listing_asin_submit
listing_auth_gate_view
listing_auth_complete
```

`listing_auth_complete.auth_method` 只允许：

```text
google
email_login
email_signup
```

验收：

- 未登录用户点击 audit CTA 后先进入登录/注册。
- Google 快速登录可用。
- 登录成功后自动继续 audit，不要求用户重复提交 ASIN。
- auth 放弃用户能被统计：有 `listing_auth_gate_view`，没有 `listing_auth_complete`。

### FE-4. audit 等待过程必须发事件

触发：登录成功并开始 audit。

必须发送：

```text
listing_audit_started
listing_audit_phase_view
listing_audit_failed
listing_report_ready
```

`listing_audit_phase_view.phase_status` 只允许：

```text
queued
running
failed
ready
```

验收：

- 页面展示真实等待状态。
- 每个 phase 带 `audit_id`、`phase_name`、`phase_status`、`elapsed_seconds`。
- audit 失败必须展示可理解反馈，并发送 `listing_audit_failed`。
- report ready 时必须发送 `listing_report_ready`。

### FE-5. report 到 workspace 的价值链路必须发事件

必须发送：

```text
listing_report_view
listing_optimize_click
listing_free_bundle_gate_view
listing_free_bundle_confirm
listing_credit_gate_view
listing_credit_confirm
listing_workspace_open
```

验收：

- 用户看到报告 first fold 后发送 `listing_report_view`。
- 点击 Generate fixes 后发送 `listing_optimize_click`。
- 免费 bundle 确认和 credit 确认必须区分。
- workspace 可用后发送 `listing_workspace_open`。

### FE-6. Accept 必须等于 Accept & copy

有效 Accept 成功后必须自动复制。

必须发送：

```text
listing_fix_accept
listing_fix_auto_copy
listing_fix_manual_copy
listing_fix_validation_block
```

规则：

- validation pass 后才能发送 `listing_fix_accept`。
- 自动复制成功：发送 `listing_fix_auto_copy`，`clipboard_result=success`。
- 自动复制失败：展示手动 copy fallback。
- 手动 copy 成功：发送 `listing_fix_manual_copy`，`clipboard_result=manual_success`。
- validation block：只发送 `listing_fix_validation_block`，不能发送 accept。

验收：

- 点击 Accept 后剪贴板中有对应文案。
- 超字数、超 bytes、未确认 claim、restricted term 不允许 accept。
- validation block 不触发 completed loop。

### FE-7. Export 行为必须发事件

必须发送：

```text
listing_export_click
listing_export_copy
listing_export_download
```

验收：

- 打开 export modal 发送 `listing_export_click`。
- 复制 Title / Bullets / Search Terms 发送 `listing_export_copy`。
- 下载 A+ revision brief 发送 `listing_export_download`。

### FE-8. 订阅入口不能丢归因

必须发送：

```text
listing_subscription_gate_view
listing_subscribe_click
listing_checkout_started
listing_subscription_success
```

验收：

- 从 Listing 内进入订阅。
- checkout payload 带 `source=listing`。
- checkout payload 带 `session_id/gclid/gbraid/wbraid/asin/report_id/bundle_id`。
- 支付成功后前端能收到 success 状态并发送 `listing_subscription_success`，或由后端 webhook 补发。

## 4. 后端 P0

### BE-1. 建立 event_log

每条事件必须落库。

字段：

```text
event_name
event_time
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

- 所有 P0 事件可按 `session_id` 查完整路径。
- 所有 P0 事件可按 `gclid` 查完整路径。
- 所有 P0 事件可按 `user_id/account_id` 查完整路径。

### BE-2. audit / report / bundle ID 必须统一

必须生成并返回：

```text
audit_id
report_id
bundle_id
```

规则：

- audit 开始生成 `audit_id`。
- report ready 生成 `report_id`。
- optimization bundle 生成 `bundle_id`。
- report、workspace、accept、export、subscription 事件都必须带这些 ID。

验收：

- 同一 ASIN 的一次完整流程能串成：`audit_id -> report_id -> bundle_id -> subscription_id`。

### BE-3. audit 状态必须真实

必须记录：

```text
queued
running
failed
ready
```

字段：

```text
audit_id
status
failure_reason_code
started_at
ready_at
elapsed_seconds
```

验收：

- 前端轮询或订阅到的状态是真实后端状态。
- failed 必须有 `failure_reason_code`。
- ready 必须能打开对应 report。

### BE-4. 免费试用成本必须落库

建立 `usage_cost`。

字段：

```text
cost_time
user_id
account_id
asin
audit_id
report_id
bundle_id
cost_type
cost_amount
currency
is_free_trial
```

`cost_type` 只允许：

```text
audit
report
optimization_bundle
infra
data
```

验收：

- 每次 audit started 后有 audit 成本记录。
- 每次 report ready 后有 report 成本记录。
- 每次 free bundle / credit bundle confirm 后有 optimization bundle 成本记录。
- 能按 campaign cohort 汇总 free trial cost。

### BE-5. 免费额度和 credit 使用必须可查

必须记录：

```text
free_audit_used
free_optimization_used
credit_cost
credit_balance_before
credit_balance_after
is_paid
```

验收：

- 首次免费 audit 和首次免费 optimization 能识别。
- 免费用完后进入 credit / subscription gate。
- `listing_free_bundle_confirm` 和 `listing_credit_confirm` 能区分。

### BE-6. completed loop 必须服务端去重

有效触发：

```text
valid accept + copy success
manual copy fallback success
export copy
export download
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

- 同一 report 多次 accept 只产生一次 `listing_completed_loop`。
- validation block 不产生 `listing_completed_loop`。
- sample report 默认不作为广告主转化，必须带 `is_sample=true`。

### BE-7. billing / subscription 必须落库

建立 `subscription_revenue`。

字段：

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
source
```

验收：

- checkout started 能关联 `session_id/gclid/asin/report_id/bundle_id`。
- subscription success 能关联 `user_id/account_id`。
- refund 和 payment fee 能进入 ROI 计算。
- `source=listing` 必须保留。

### BE-8. Google Ads offline conversion import

必须支持回传：

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

- `listing_completed_loop.value=0`；完成 expected value 校准后再改为 calibrated expected value。
- `listing_subscription_success.value=net_revenue`。
- `order_id` 必须稳定且去重。

验收：

- Google Ads 后台能看到 completed loop conversion。
- Google Ads 后台能看到 subscription success conversion。
- 重复回传不会重复计数。

## 5. 共同 P0

### JOINT-1. 事件命名只用统一表

必须使用 [16-google-ads-funnel-events-2026-06-11.md](16-google-ads-funnel-events-2026-06-11.md) 的事件名。

禁止：

- 临时命名。
- 同一事件多个名字。
- 内部角色名进入前端文案或公开参数。

### JOINT-2. P0 事件最小清单

上线前必须能查到：

```text
listing_landing_view
listing_asin_submit
listing_auth_gate_view
listing_auth_complete
listing_audit_started
listing_audit_phase_view
listing_audit_failed
listing_report_ready
listing_report_view
listing_optimize_click
listing_free_bundle_confirm
listing_credit_confirm
listing_workspace_open
listing_fix_accept
listing_fix_auto_copy
listing_fix_manual_copy
listing_fix_validation_block
listing_export_copy
listing_export_download
listing_completed_loop
listing_subscribe_click
listing_checkout_started
listing_subscription_success
```

### JOINT-3. P0 dashboard 必须可出

维度：

```text
date
campaign
ad_group
keyword
landing_variant
marketplace
```

指标：

```text
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
subscribe click
checkout started
subscription success
paid gross profit
ROI 7d
ROI 30d
```

验收：

- 能按 campaign 看到 ROI 30d。
- 能按 keyword 看到 CPQA、CPCL、subscription success。
- 能识别是登录损耗、report 损耗、workspace 损耗，还是付费损耗。

## 6. 上线前检查

| 检查项 | 通过标准 |
|---|---|
| 广告归因 | `gclid/utm` 从 landing 保留到 checkout |
| 身份串联 | 登录前后同一用户不断链 |
| audit 状态 | queued / running / failed / ready 可查 |
| 免费成本 | 每次 audit / report / bundle 有成本 |
| completed loop | valid accept/copy/export 才触发，且服务端去重 |
| 订阅付费 | checkout / subscription / refund / fee 可查 |
| Google Ads 回传 | completed loop 和 subscription success 可回传 |
| Dashboard | campaign / keyword 粒度能看 CPQA、CPCL、ROI |

## 7. 非 P0

第一波 GTM 不阻塞上线：

- re-audit 精细分析。
- before / after answerability uplift。
- workspace tab click 全量行为分析。
- fix edit / reject 深度分析。
- ICP 强验证。
- value-based bidding。
- SEO / forum 自然渠道成本归因。
- 多 landing page A/B test。
