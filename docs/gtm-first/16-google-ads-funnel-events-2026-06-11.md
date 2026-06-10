# Luckee Listing · Google Ads 漏斗与事件设计

日期：2026-06-11

补充：第一波 GTM 的商业判断见 [17-gtm-first-wave-roi-scorecard-2026-06-11.md](17-gtm-first-wave-roi-scorecard-2026-06-11.md)。本文只定义漏斗与事件，ROI 记分卡单独定义广告成本、免费试用成本、订阅毛利与 `ROI > 1` 的放量判断。

## 1. 结论

Google Ads 不应长期优化 `listing_asin_submit`，而应优化 `listing_completed_loop`。

`listing_completed_loop` 的定义：同一用户在同一 ASIN / marketplace 的一次免费或付费 loop 中，首次完成任一有效价值动作：

- 接受一条通过 validation 的建议，并成功复制到剪贴板；
- 如果自动复制失败，用户完成手动 Copy fallback；
- 在 Export 中复制任一字段；
- 下载 A+ revision brief。

这比 `asin_submit` 更接近真实价值交付，也比 `subscription_success` 更适合 0-1 阶段做 Google Ads 学习。付费成功仍要回传，但早期样本量不足，先作为商业结果和观察转化。

## 2. 最新产品变化对漏斗的影响

| 产品变化 | 对漏斗 / 事件的影响 |
|---|---|
| ASIN input 保持开放，但点击真实 audit CTA 后触发登录/注册 | `listing_asin_submit` 之后立即进入 `listing_auth_gate_view`；旧的“report ready 后再登录”口径不再作为当前主路径 |
| 增加 Google 快速登录入口 | `listing_auth_complete` 必须带 `auth_method=google/email_login/email_signup`，用于评估登录摩擦 |
| audit agent loop 需要等待几分钟，且必须有明确状态 | `listing_audit_phase_view` 必须记录 `phase_name`、`phase_status=queued/running/failed/ready`、`elapsed_seconds` |
| Workspace 的 `Accept` 改为 `Accept & copy` | `listing_fix_accept` 和 `listing_fix_auto_copy` 需要成对记录；`completed_loop` 可以在 valid accept + copy success 后触发 |
| Search Terms / Title 超限、未确认 claim 不能 Accept | 无效点击只能记录 `listing_fix_validation_block`，不能记录 `listing_fix_accept`，更不能触发 `completed_loop` |
| 前端不再展示后端/内部约束文案 | 事件参数仍要带 `validation_reason_code`，但不要上报或展示内部角色名；用 `over_limit`、`unconfirmed_claim`、`restricted_term` 等产品化 code |
| Billing / subscription 需要在 Listing 工具内完成 | `listing_subscription_gate_view`、`listing_checkout_started`、`listing_subscription_success` 必须保留 `source=listing`、`gclid/session_id`、`asin`、`free_loop_status`，避免跨域断归因 |

## 3. 用户路径与漏斗层级

| 层级 | 用户动作 | 事件 | Google Ads 角色 |
|---|---|---|---|
| 1. Landing | 页面加载 | `listing_landing_view` | 归因入口，记录 click id |
| 2. ASIN 输入 | 输入有效 ASIN / URL | `listing_asin_entered` | 首屏理解度观察 |
| 3. Audit CTA | 点击真实 audit CTA | `listing_asin_submit` | 早期观察转化，不做长期主转化 |
| 4. Account gate | 登录/注册弹窗展示 | `listing_auth_gate_view` | 评估登录节点损耗 |
| 5. Auth complete | Google / email 登录注册完成 | `listing_auth_complete` | identity stitching 关键点 |
| 6. Audit start | agent loop 开始 | `listing_audit_started` | 判断用户是否进入真实等待 |
| 7. Audit progress | queued / running / failed / ready | `listing_audit_phase_view` | 评估等待体验和失败率 |
| 8. Report ready | 报告可打开 | `listing_report_ready` | 报告生成成功 |
| 9. Report view | 用户看到报告 first fold | `listing_report_view` | 诊断价值曝光 |
| 10. Optimize intent | 点击 Generate fixes | `listing_optimize_click` | 报告是否推动下一步 |
| 11. Free / credit gate | 展示免费 bundle 或 credit 确认 | `listing_free_bundle_gate_view` / `listing_credit_gate_view` | 评估资源消耗确认损耗 |
| 12. Confirm bundle | 确认生成优化 bundle | `listing_free_bundle_confirm` / `listing_credit_confirm` | 生成优化前的承诺动作 |
| 13. Workspace | Workspace 可用 | `listing_workspace_open` | 最后一公里价值开始 |
| 14. Edit | 编辑建议内容 | `listing_fix_edit` | 价值加工深度 |
| 15. Accept & copy | valid accept + copy | `listing_fix_accept` + `listing_fix_auto_copy` | 主价值动作 |
| 16. Validation block | 超限 / 未确认 / 禁用词阻断 | `listing_fix_validation_block` | 质量控制，不算转化 |
| 17. Export | 打开导出弹窗 | `listing_export_click` | 强价值意图 |
| 18. Copy / Download | 复制字段或下载 A+ brief | `listing_export_copy` / `listing_export_download` | 强价值兑现 |
| 19. Completed loop | 首次完成有效价值动作 | `listing_completed_loop` | Google Ads 主转化 |
| 20. Re-audit | 点击 re-audit | `listing_reaudit_click` | 留存 / before-after 价值 |
| 21. Subscription | 订阅入口 / checkout / 成功 | `listing_subscribe_click` / `listing_checkout_started` / `listing_subscription_success` | 商业结果回传 |

## 4. 事件定义

| 事件 | 触发时机 | 必带关键参数 |
|---|---|---|
| `listing_landing_view` | Landing 首次加载 | `landing_url`、`gclid`、`gbraid`、`wbraid`、`utm_*`、`variant` |
| `listing_asin_entered` | ASIN / URL 格式有效 | `asin`、`marketplace`、`input_type=asin/url` |
| `listing_asin_submit` | 点击真实 audit CTA | `asin`、`marketplace`、`auth_state`、`source_section=hero/final_cta/audit_page` |
| `listing_auth_gate_view` | 登录/注册弹窗展示 | `gate_reason=audit_start/subscribe/credit`、`auth_state`、`asin` |
| `listing_auth_complete` | 登录/注册成功 | `auth_method=google/email_login/email_signup`、`anonymous_id`、`user_id`、`account_id` |
| `listing_audit_started` | 登录后 audit agent loop 开始 | `audit_id`、`asin`、`marketplace`、`is_sample`、`expected_wait_seconds` |
| `listing_audit_phase_view` | 每个 progress phase 曝光或状态变化 | `audit_id`、`phase_name`、`phase_index`、`phase_status`、`elapsed_seconds` |
| `listing_audit_failed` | audit 失败 | `audit_id`、`failure_reason_code`、`elapsed_seconds` |
| `listing_report_ready` | report schema / 页面可用 | `audit_id`、`report_id`、`score_before`、`risk_high_count` |
| `listing_report_view` | report first fold 曝光 | `report_id`、`score_before`、`question_total`、`clear_count` |
| `listing_optimize_click` | 点击 Generate fixes | `report_id`、`score_before`、`score_projected`、`free_loop_status` |
| `listing_free_bundle_gate_view` | 首次免费优化确认弹窗展示 | `report_id`、`bundle_cost=free`、`free_loop_status` |
| `listing_credit_gate_view` | 非首次或额度不足时 credit 确认展示 | `report_id`、`credit_cost`、`credit_balance`、`plan_name` |
| `listing_free_bundle_confirm` | 确认使用免费优化 bundle | `report_id`、`bundle_id`、`free_loop_status` |
| `listing_credit_confirm` | 确认消耗 credit 生成优化 | `report_id`、`bundle_id`、`credit_cost`、`credit_balance_before` |
| `listing_workspace_open` | Workspace 可用 | `bundle_id`、`report_id`、`score_before`、`score_projected` |
| `listing_workspace_tab_click` | 切换 Title / Bullets / A+ / Search Terms | `bundle_id`、`field_type` |
| `listing_fix_edit` | 点击 Edit 或保存编辑 | `bundle_id`、`suggestion_id`、`field_type`、`edit_stage=start/save` |
| `listing_fix_validation_block` | Accept 被 validation 阻断 | `bundle_id`、`suggestion_id`、`field_type`、`validation_reason_code`、`char_count`、`byte_count` |
| `listing_fix_accept` | 接受一条通过 validation 的建议 | `bundle_id`、`suggestion_id`、`field_type`、`validation_status=valid`、`accept_source=original/edited` |
| `listing_fix_auto_copy` | valid accept 后自动复制 | `bundle_id`、`suggestion_id`、`field_type`、`clipboard_result=success/failed` |
| `listing_fix_manual_copy` | 自动复制失败后的手动复制成功 | `bundle_id`、`suggestion_id`、`field_type`、`clipboard_result=manual_success` |
| `listing_fix_reject` | 拒绝建议 | `bundle_id`、`suggestion_id`、`field_type`、`risk_level` |
| `listing_export_click` | 打开 Export modal | `bundle_id`、`accepted_count`、`edited_count`、`pending_count` |
| `listing_export_copy` | 复制 Title / Bullets / Search Terms | `bundle_id`、`copy_target=title/bullets/search_terms`、`clipboard_result` |
| `listing_export_download` | 下载 A+ revision brief | `bundle_id`、`download_type=aplus_revision_brief` |
| `listing_completed_loop` | 首次完成有效价值动作 | `completion_source=fix_accept/export_copy/export_download/manual_copy`、`bundle_id`、`report_id` |
| `listing_reaudit_click` | 点击 re-audit | `asin`、`marketplace`、`previous_report_id`、`accepted_count` |
| `listing_subscription_gate_view` | 免费 loop 用完或点击 paid plan | `gate_reason=free_loop_used/plan_click/no_credit`、`plan_name` |
| `listing_subscribe_click` | 点击订阅 | `plan_name`、`price_id`、`source=listing` |
| `listing_checkout_started` | embedded billing / Stripe checkout 开始 | `checkout_session_id`、`plan_name`、`price_id`、`source=listing` |
| `listing_subscription_success` | 支付成功 | `subscription_id`、`plan_name`、`price_id`、`value`、`currency` |

## 5. `listing_completed_loop` 判定规则

### 去重

按以下 key 在 7 天内只触发一次：

```text
coalesce(user_id, anonymous_id) + asin + marketplace + report_id
```

如果同一用户同一 ASIN 后续重新 audit 并生成新 `report_id`，可以进入新的 completed loop。

### 有效触发条件

任一条件成立即可触发：

1. `listing_fix_accept` 的 `validation_status=valid`，且同一 `suggestion_id` 后续触发 `listing_fix_auto_copy`，`clipboard_result=success`。
2. 自动复制失败，但展示 fallback，并且用户完成 `listing_fix_manual_copy`。
3. 用户在 Export modal 中完成 `listing_export_copy`。
4. 用户完成 `listing_export_download`。

### 不触发 completed loop 的情况

- 只输入 ASIN；
- 只完成登录；
- 只看到报告；
- 只点击 Optimize；
- credit/free gate 展示或确认；
- Accept 被 validation 阻断；
- Search Terms 超过 250 bytes 仍试图接受；
- Title 超过 200 characters 仍试图接受；
- 存在 `[confirm ...]` 未处理时试图接受；
- 仅打开 Export modal 但没有 copy/download。

## 6. 参数规范

### 广告归因

所有事件都尽量携带：

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

- `gclid/gbraid/wbraid` 必须在 Landing 首次进入时写入 first-party storage；
- 登录前后的 anonymous session 必须能 stitch 到 `user_id`；
- embedded billing 不能丢 `source=listing`、`session_id`、`gclid`。

### 身份

```text
anonymous_id
session_id
user_id
account_id
auth_state
auth_method
```

### 产品与流程

```text
asin
marketplace
category
is_sample
audit_id
report_id
bundle_id
free_loop_status
credit_gate_type
credit_cost
credit_balance_before
credit_balance_after
```

### 质量与结果

```text
field_type
suggestion_id
risk_level
priority
validation_status
validation_reason_code
has_unconfirmed_claim
over_limit_fields
char_count
byte_count
restricted_terms_count
clipboard_result
score_before
score_projected
accepted_count
edited_count
rejected_count
pending_count
```

### 付费

```text
plan_name
price_id
checkout_session_id
subscription_id
value
currency
is_paid
```

## 7. Google Ads 转化动作配置

| 转化动作 | 事件 | 类型 | 是否 Primary | 说明 |
|---|---|---:|---:|---|
| Listing completed loop | `listing_completed_loop` | Web / offline import | 是 | P1 主优化目标 |
| Listing ASIN submit | `listing_asin_submit` | Web | 否 | 只做观察，避免优化到低质量流量 |
| Listing auth complete | `listing_auth_complete` | Web | 否 | 观察登录 gate 摩擦 |
| Listing report viewed | `listing_report_view` | Web | 否 | 观察报告价值曝光 |
| Listing optimize intent | `listing_optimize_click` | Web | 否 | 观察报告到优化意图 |
| Listing checkout started | `listing_checkout_started` | Web / enhanced conversion | 否 | 付费样本少时用于辅助判断 |
| Listing subscription success | `listing_subscription_success` | Enhanced conversion / offline import | 是，等样本足够后 | 商业结果，早期不要唯一依赖 |

建议分阶段：

1. 埋点上线前：只看 `listing_asin_submit` 和页面行为，不放大预算。
2. report/workspace 跑通后：把 `listing_completed_loop` 设为 Google Ads Primary。
3. 付费样本积累后：把 `listing_subscription_success` 作为商业 Primary 或导入到 value-based bidding。

## 8. 离线转化与 Enhanced Conversions

Google Ads 最好同时做两条链路：

1. **Web conversion**：前端实时发送 `listing_completed_loop`。
2. **Offline conversion import**：服务端按 `gclid/gbraid/wbraid + completion_time` 回传，保证登录、支付和延迟完成动作不丢。

登录后可使用 hashed email 做 Enhanced Conversions，但必须遵守 consent 和隐私要求。

推荐回传字段：

```text
conversion_name = Listing completed loop
conversion_time
gclid / gbraid / wbraid
order_id = report_id + bundle_id + completion_source
value = 0 for activation event, or calibrated expected value later
currency = USD
```

商业事件 `listing_subscription_success` 单独回传真实 value。

## 9. Dashboard 漏斗视图

P1 dashboard 至少看 4 层：

| 看板层 | 指标 |
|---|---|
| Acquisition | landing view、ASIN entered、ASIN submit、source / campaign / keyword |
| Activation | auth gate view、auth complete、audit started、report ready、report view |
| Value delivery | optimize click、bundle confirm、workspace open、fix accept、auto copy、export copy/download、completed loop |
| Monetization | subscription gate、subscribe click、checkout started、subscription success |

核心转化率：

```text
landing_view -> asin_submit
asin_submit -> auth_complete
auth_complete -> audit_started
audit_started -> report_ready
report_view -> optimize_click
optimize_click -> bundle_confirm
workspace_open -> completed_loop
completed_loop -> subscribe_click
subscribe_click -> subscription_success
```

质量拆分：

- `completed_loop` by `completion_source`
- `completed_loop` by `field_type`
- `fix_accept` valid vs validation_block
- `clipboard_result` success / failed / manual_success
- Google Ads campaign / ad group / keyword 到 completed loop 的 CPCL（cost per completed loop）
- completed loop 到 subscription success 的滞后转化

## 10. 当前优先级

### P0：投放前必须有

- click id 捕获：`gclid`、`gbraid`、`wbraid`、`utm_*`
- anonymous_id / session_id 生成与保存
- `listing_landing_view`
- `listing_asin_submit`
- `listing_auth_gate_view`
- `listing_auth_complete`
- `listing_audit_started`
- `listing_report_ready`
- `listing_report_view`
- `listing_optimize_click`
- `listing_free_bundle_confirm` / `listing_credit_confirm`
- `listing_workspace_open`
- `listing_fix_accept`
- `listing_fix_auto_copy`
- `listing_fix_validation_block`
- `listing_export_copy` / `listing_export_download`
- `listing_completed_loop`

### P1：预算放大前补齐

- `listing_audit_phase_view`，带真实 queued / running / failed / ready
- `listing_checkout_started`
- `listing_subscription_success`
- server-side / offline conversion import
- embedded billing 参数透传
- dashboard 按 campaign / keyword / ASIN / completion_source 拆分

### P2：优化期补

- `listing_workspace_tab_click`
- `listing_fix_edit`
- `listing_fix_reject`
- `listing_reaudit_click`
- before / after answerability uplift
- Qualified completed loop：叠加 ICP 信息、自有 listing 标记、非样本 ASIN

## 11. 命名与实现注意事项

- 不要把 `listing_asin_submit` 设置成长期主转化，否则 Google Ads 会优化到“愿意试一下”的人，而不是“拿到价值”的人。
- `listing_fix_accept` 必须只在 validation pass 后触发。
- `listing_fix_validation_block` 要记录失败原因，但不要使用内部角色名作为 reason。
- `Accept & copy` 的 copy result 必须有成功/失败/fallback 成功三态。
- `listing_completed_loop` 必须去重，不能每接受一条建议都触发一次主转化。
- sample report / sample workspace 需要带 `is_sample=true`，默认不作为投放主转化。
- 订阅和 credit 购买不应跳出 Listing 工具；如必须跳转，需要显式带回 `session_id`、`gclid`、`asin`、`source=listing`。
