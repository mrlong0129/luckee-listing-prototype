# Luckee Listing · GTM First 产品增长交付物清单

日期：2026-06-11

依据：

- [20-gtm-first-mvp-engineering-handoff-2026-06-11.md](20-gtm-first-mvp-engineering-handoff-2026-06-11.md)
- [19-gtm-first-frontend-events-backend-tech-list-2026-06-11.md](19-gtm-first-frontend-events-backend-tech-list-2026-06-11.md)
- [16-google-ads-funnel-events-2026-06-11.md](16-google-ads-funnel-events-2026-06-11.md)
- 最终原型：[Luckee Listing Prototype](https://mrlong0129.github.io/luckee-listing-prototype/)
- 原型仓库：[mrlong0129/luckee-listing-prototype](https://github.com/mrlong0129/luckee-listing-prototype)

## 1. 这份文档解决什么

这不是前后端开发清单，而是产品 / 增长需要交付给工程的输入。

目标是让前端、后端能支持 GTM First MVP，最终可以按 Google Ads campaign / ad group / keyword 算清：

```text
CPQA
Auth complete rate
Report ready rate
CPCL
Trial cost per completed loop
CAC paid
ROI 7d / 30d
```

工程需要拿到的不是“做埋点”这类模糊要求，而是：

1. 哪些用户动作算关键漏斗。
2. 每个动作什么时候触发事件。
3. 每个事件必须带哪些字段。
4. 哪些行为可以算 completed loop。
5. 免费试用、credit、订阅、成本、收入如何关联到同一个用户和同一个 ASIN。

## 2. 当前产品口径

| 项目 | 已定口径 |
|---|---|
| 入口 | 用户先输入 ASIN / Amazon product link |
| 登录节点 | 点击 `Audit my real ASIN` 后触发登录 / 注册，登录后开始跑 report |
| 输入方式 | 移除 `Paste my listing`，不再要求用户手动粘贴完整 listing |
| report 预期 | 当前真实 report 生成约 10-15min，点击前和等待中都要明确提示 |
| 等待页 | 保留轻量状态反馈，用户需要知道 agent loop 正在跑 |
| Accept | valid `Accept` 后自动复制字段到剪贴板，并给复制成功 / 失败反馈 |
| Validation | validation blocked 不能触发 accept，也不能触发 completed loop |
| 订阅 / credits | 复用 Luckee 1.0 用户、订阅、credits，在 Listing 小工具内承接，不跳出 |
| 登录态导航 | 已登录用户不显示 `Get my free audit` |
| Sample | sample / demo 可用于展示和 QA，但不进入 Google Ads 主转化 |

## 3. 产品增长给前端的交付物

### 3.1 最终流程与页面状态

需要给前端一份唯一流程图 / 状态表，避免出现 auth-first、report-gate、audit CTA 后登录三套口径。

标准路径：

```text
Landing
-> ASIN / link entered
-> Audit my real ASIN
-> Auth gate
-> Auth complete
-> Audit started
-> Waiting status
-> Report ready
-> Report view
-> Generate fixes
-> Free bundle / credit confirm
-> Workspace
-> Accept / Export
-> Subscription gate / checkout / subscription success
```

前端需要按这个路径实现页面和事件，不要求用户登录后重复输入 ASIN。

### 3.2 前端公共事件字段

产品增长需要明确：所有前端事件都必须带下面字段。没有值传 `null`，不能省字段。

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

产品增长需要给前端的字段规则：

| 字段 | 规则 |
|---|---|
| `event_id` | 前端生成 UUID，后端按它去重 |
| `anonymous_id` | 登录前生成，登录后继续保留 |
| `session_id` | 首次访问生成，checkout 前后不变 |
| `user_id/account_id` | 登录后补齐 |
| `auth_state` | `anonymous` / `authenticated` |
| `gclid/gbraid/wbraid/utm_*` | 从 landing 捕获，刷新、登录、checkout 后不丢 |
| `audit_id/report_id/bundle_id` | 拿到后立刻带入后续事件 |
| `is_sample` | sample report / demo workspace 必须为 `true` |

### 3.3 前端 P0 事件字典

| 阶段 | 事件 | 触发点 | 额外字段 / 规则 |
|---|---|---|---|
| Landing | `listing_landing_view` | Listing landing 首次加载 | `variant`、`viewport_width`、`viewport_height` |
| 输入 | `listing_asin_entered` | ASIN / URL 格式校验通过 | `input_type=asin/url`、`input_length` |
| 提交 | `listing_asin_submit` | 点击真实 audit CTA | `source_section`、`input_type`、`auth_state` |
| 登录门槛 | `listing_auth_gate_view` | 登录 / 注册弹窗展示 | `gate_reason=audit_start/subscribe/credit` |
| 登录完成 | `listing_auth_complete` | Google / email 登录注册成功 | `auth_method=google/email_login/email_signup` |
| Audit 开始 | `listing_audit_started` | audit 创建成功 | `expected_wait_seconds=600/900` |
| Audit 状态 | `listing_audit_phase_view` | 状态展示或变化 | `phase_name`、`phase_index`、`phase_status`、`elapsed_seconds` |
| Audit 失败 | `listing_audit_failed` | audit 失败 | `failure_reason_code`、`elapsed_seconds` |
| Report ready | `listing_report_ready` | report 可打开 | `score_before`、`risk_high_count` |
| Report 查看 | `listing_report_view` | report first fold 曝光 | `score_before`、`question_total`、`clear_count` |
| 优化意图 | `listing_optimize_click` | 点击 Generate fixes | `score_before`、`score_projected`、`free_loop_status` |
| 免费 bundle | `listing_free_bundle_gate_view` | 首次免费 optimization 确认展示 | `bundle_cost=free`、`free_loop_status` |
| 免费确认 | `listing_free_bundle_confirm` | 确认使用免费 optimization bundle | `free_loop_status` |
| Credit gate | `listing_credit_gate_view` | 非首次或额度不足时展示 | `credit_cost`、`credit_balance`、`plan_name` |
| Credit 确认 | `listing_credit_confirm` | 确认消耗 credit | `credit_cost`、`credit_balance_before` |
| Workspace | `listing_workspace_open` | workspace 可用 | `score_before`、`score_projected` |
| Validation block | `listing_fix_validation_block` | Accept 被阻断 | `suggestion_id`、`field_type`、`validation_reason_code`、`char_count`、`byte_count` |
| Accept | `listing_fix_accept` | 接受通过 validation 的建议 | `suggestion_id`、`field_type`、`validation_status=valid`、`accept_source` |
| 自动复制 | `listing_fix_auto_copy` | valid Accept 后自动复制 | `suggestion_id`、`field_type`、`clipboard_result=success/failed` |
| 手动复制 | `listing_fix_manual_copy` | 自动复制失败后的手动复制成功 | `clipboard_result=manual_success` |
| Export 打开 | `listing_export_click` | 打开 Export modal | `accepted_count`、`edited_count`、`pending_count` |
| Export copy | `listing_export_copy` | 复制 Title / Bullets / Search Terms | `copy_target`、`clipboard_result` |
| Export download | `listing_export_download` | 下载 A+ revision brief | `download_type=aplus_revision_brief` |
| 完成闭环 | `listing_completed_loop` | 首次完成有效价值动作 | `completion_source` |
| 订阅门槛 | `listing_subscription_gate_view` | 免费 loop 用完或点击 paid plan | `gate_reason`、`plan_name` |
| 订阅点击 | `listing_subscribe_click` | 点击订阅 | `plan_name`、`price_id`、`source=listing` |
| Checkout | `listing_checkout_started` | checkout 开始 | `checkout_session_id`、`plan_name`、`price_id`、`source=listing` |
| 付费成功 | `listing_subscription_success` | 支付成功 | `subscription_id`、`plan_name`、`price_id`、`value`、`currency` |

`phase_status` 只允许：

```text
queued
running
failed
ready
```

`validation_reason_code` 只允许：

```text
over_character_limit
over_byte_limit
unconfirmed_claim
restricted_term
empty_value
backend_validation_failed
```

### 3.4 前端交互与文案交付

产品增长需要给前端这些具体文案或规则：

| 交付物 | 需要明确什么 |
|---|---|
| Audit CTA 文案 | `Audit my real ASIN` 是否作为唯一真实 audit CTA |
| 等待时间文案 | `Report usually takes 10-15 minutes. Keep this page open while the agent loop runs.` |
| failed 文案 | 不同 `failure_reason_code` 下用户看到什么，以及是否允许 retry |
| validation blocked 文案 | 超字符、超 bytes、restricted term、未确认 claim 分别怎么解释 |
| copy success / failed 文案 | 自动复制成功、失败、手动复制 fallback 的提示 |
| free bundle 文案 | 首次免费 optimization 是否需要确认，以及确认按钮文案 |
| credit / subscription gate 文案 | 免费用完后如何提示用户继续 |
| sample 文案 | sample report / demo workspace 不能让用户误以为是真实 ASIN 结果 |

### 3.5 前端 QA 用例

产品增长需要给前端一组 QA 输入和预期结果：

| 用例 | 预期 |
|---|---|
| 带 `gclid/utm` 的冷用户进入 landing | 所有后续事件都保留归因字段 |
| 未登录用户输入 ASIN 后点击 audit | 先触发 auth gate，登录后继续原 ASIN audit |
| 登录用户进入 audit 页 | 不显示 `Get my free audit` |
| audit 进入等待页 | 展示 10-15min 预期，事件有 `listing_audit_started` 和状态变化 |
| validation blocked 的 suggestion | 只能发 `listing_fix_validation_block`，不能发 accept / completed loop |
| valid Accept | 自动复制字段，成功发 `listing_fix_accept` + `listing_fix_auto_copy(success)` |
| 自动复制失败 | 展示手动 copy fallback，手动成功后发 `listing_fix_manual_copy(manual_success)` |
| export copy/download | 能触发 completed loop 的有效来源 |
| sample report | `is_sample=true`，不计 Google Ads 主转化 |

## 4. 产品增长给后端的交付物

### 4.1 事件与转化定义

后端需要产品增长给到完整事件字典，包括：

1. 事件名。
2. 触发条件。
3. 必填公共字段。
4. 额外事件字段。
5. 是否可作为 completed loop 来源。
6. 是否允许进入 Google Ads 主转化。

后端需要支持：

```text
event_id 去重
事件名校验
必填字段校验
event_properties 原样保存
按 gclid/session_id/anonymous_id/user_id/account_id/asin/audit_id/report_id/bundle_id 查询完整路径
```

### 4.2 归因与身份绑定口径

产品增长需要给后端明确：

| 项目 | 口径 |
|---|---|
| first touch | 首次进入 Listing landing 时的 `gclid/gbraid/wbraid/utm_*` |
| last non-direct touch | 最近一次非 direct 的广告 / UTM 来源 |
| 匿名身份 | 登录前使用 `anonymous_id/session_id` |
| 登录后绑定 | 登录成功后把 `anonymous_id/session_id` 绑定到 `user_id/account_id` |
| checkout 归因 | checkout 和 subscription 必须继承 Listing 的 attribution |
| 跨域 / 跳转 | Listing 内承接订阅，避免丢 attribution；如工程必须跳转，需要带全量上下文 |

### 4.3 Audit / Report / Bundle ID 契约

产品增长需要后端保证这些 ID 能贯穿完整链路：

```text
audit_id
report_id
bundle_id
```

对应关系：

| ID | 生成时机 | 后续用途 |
|---|---|---|
| `audit_id` | audit 创建成功 | audit status、report ready、失败分析 |
| `report_id` | report ready | report view、optimize、workspace、checkout |
| `bundle_id` | optimization bundle 生成 | workspace、accept、export、subscription |

产品侧需要提供 sample ASIN 的预期 `report_id/bundle_id` 结构样例，帮助前后端对齐数据结构。

### 4.4 Audit 状态与等待时间

产品增长给后端的状态口径：

```text
queued
running
failed
ready
```

后端需要返回：

```text
audit_id
status
failure_reason_code
started_at
ready_at
elapsed_seconds
report_id
```

产品侧当前等待承诺：

```text
真实 listing report 约 10-15min
```

后端需要补齐：

1. 当前 P50 / P95。
2. 失败率。
3. 超时后是否自动 failed。
4. 用户刷新页面后是否能恢复 audit 状态。

### 4.5 Validation 规则

产品增长需要给后端最终 validation 口径：

| 规则 | 需要明确 |
|---|---|
| character limit | Title、Bullets、A+ 等字段限制 |
| byte limit | Search Terms 250 bytes 等限制 |
| restricted terms | 禁用词表来源和更新方式 |
| unconfirmed claim | 哪些 claim 需要用户确认 |
| empty value | 空字段是否允许 accept/export |

后端返回字段：

```text
validation_status=valid/blocked
validation_reason_code
char_count
byte_count
restricted_terms_count
has_unconfirmed_claim
```

规则：

```text
blocked 不能产生 accept
blocked 不能产生 completed loop
blocked 不能进入 export 的最终可发布字段
```

### 4.6 Completed loop 定义与去重

产品增长给后端的主转化定义：

有效来源：

```text
listing_fix_accept + listing_fix_auto_copy(success)
listing_fix_manual_copy(manual_success)
listing_export_copy(success)
listing_export_download
```

去重建议：

```text
coalesce(user_id, anonymous_id) + asin + marketplace + report_id
```

窗口：

```text
7 days
```

排除：

```text
is_sample=true 不进入 Google Ads 主转化
validation blocked 不进入 completed loop
copy failed 且没有 manual copy success 不进入 completed loop
```

### 4.7 免费试用、credits、订阅和成本

产品增长需要给后端这些业务规则：

| 交付物 | 需要明确 |
|---|---|
| 免费 audit | 每个 user/account 是否只有 1 次；按 user 还是 account 计 |
| 免费 optimization bundle | 是否首轮免费；是否和 free audit 分开计 |
| credit cost | audit、report、optimization bundle 分别消耗多少 |
| subscription gate | 免费用完后先进入 credit 还是 subscription |
| plan / price | `plan_name`、`price_id`、价格、币种、是否复用 Luckee 1.0 |
| usage cost | audit/report/bundle 成本用 actual、estimated，还是先 estimated 后回填 |
| refund / fee | ROI 是否按 net revenue 计算 |

后端需要能落：

```text
free_audit_used
free_optimization_used
credit_cost
credit_balance_before
credit_balance_after
usage_cost
subscription_revenue
payment_fee
refund_amount
net_revenue
```

### 4.8 Google Ads 与 ROI dashboard 配置

产品增长需要给后端 / 数据侧：

| 交付物 | 用途 |
|---|---|
| Google Ads customer id | 成本导入和转化回传 |
| conversion action | `listing_completed_loop`、`listing_subscription_success` |
| campaign / ad group / keyword 表 | 按投放结构拆分 CPQA、CPCL、ROI |
| UTM 命名规范 | 让 landing variant 和 keyword 能稳定归因 |
| ROI 字段顺序 | dashboard 输出固定 |
| 成本口径 | free trial cost 是否包含 audit/report/bundle/infra/data |
| ROI 窗口 | MVP 固定 7d / 30d |

Google Ads 主转化建议：

| 类型 | 事件 |
|---|---|
| 主转化 | `listing_completed_loop` |
| 商业结果 | `listing_subscription_success` |
| 观察转化 | `listing_subscribe_click`、`listing_checkout_started` |

## 5. 产品增长还需要补齐的决策

| 优先级 | 需要明确 | 给谁 | 未明确的影响 |
|---|---|---|---|
| P0 | 免费 audit / 免费 optimization bundle 的准确规则 | 前端、后端 | free loop、credit、ROI 成本都算不准 |
| P0 | plan_name、price_id、价格、币种 | 后端、前端 | checkout 和 subscription revenue 无法闭环 |
| P0 | validation 限制最终表 | 前端、后端 | Accept / Export 的准入不一致 |
| P0 | sample ASIN、sample report、sample workspace 预期结果 | 前端、后端、QA | 无法做稳定验收 |
| P0 | Google Ads customer id 和 conversion action | 后端、增长 | 无法回传主转化 |
| P0 | UTM 命名规范和首轮 campaign 表 | 前端、后端、数据 | 无法按 campaign / keyword 看 ROI |
| P1 | failed / timeout / retry 文案 | 前端 | 等待 10-15min 时用户体感不稳定 |
| P1 | trial cost 采用 actual 还是 estimated | 后端、增长 | trial cost per completed loop 不稳定 |
| P1 | ROI dashboard 字段排序和过滤条件 | 后端、增长 | 看板输出和增长判断不一致 |
