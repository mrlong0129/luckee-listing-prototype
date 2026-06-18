# Luckee Listing · GTM 第一波实验 ROI 记分卡

日期：2026-06-11

关联文档：

- [16-google-ads-funnel-events-2026-06-11.md](16-google-ads-funnel-events-2026-06-11.md)：前后端埋点实现清单。
- [14-google-ads-gtm-brief.md](14-google-ads-gtm-brief.md)：第一波 Google Ads 关键词、预算和投放打法。

## 1. 结论

第一波 GTM 实验的核心不是证明流程和埋点完整，而是验证三件事：

1. 产品是否对冷流量有吸引力：广告点击后，用户是否愿意提交真实 ASIN。
2. 登录、注册、免费试用是否足够顺：用户是否愿意在 audit 前完成登录，并跑完一次免费 loop。
3. 免费试用是否能带来可回收的付费：广告成本 + 免费试用成本，能否被订阅付费毛利覆盖。

总闸门：

```text
GTM cohort ROI > 1
```

这里的 ROI 不看“注册数”或“免费试用次数”，而看同一批广告流量最终产生的付费毛利是否大于投入成本。

```text
GTM cohort ROI =
付费毛利 / (广告花费 + 免费试用直接成本)
```

第一波实验可以继续用 `listing_completed_loop` 作为 Google Ads 学习事件，因为付费样本早期会偏少。但增长决策不能只看 completed loop，必须同时看 completed loop 到订阅付费的转化和真实成本。

## 2. 第一波实验要回答的问题

| 问题 | 关键判断 | 不能只看的指标 |
|---|---|---|
| 产品吸引力 | 冷流量是否愿意提交 ASIN / URL | 不能只看 CTR，高 CTR 可能是文案吸引但产品意图不准 |
| 登录注册摩擦 | 点击真实 audit CTA 后，有多少用户完成登录/注册 | 不能只看注册数，要看 submit 到 auth complete 的转化 |
| 免费试用价值 | 登录后是否愿意等待报告、打开报告、生成优化、完成 accept/copy/export | 不能只看 report ready，用户没拿走结果不算价值兑现 |
| 付费意愿 | 完成一次有效 loop 后，是否愿意订阅或进入 checkout | 不能只看 subscribe click，要看 checkout 和 subscription success |
| 经济性 | 广告 + 免费 trial 的总成本是否小于付费毛利 | 不能把免费 trial 当 0 成本 |

## 3. 北极星与操作指标

### 商业北极星

```text
GTM cohort ROI > 1
```

解释：同一投放 cohort 在一个观察窗口内带来的付费毛利，大于广告花费和免费试用直接成本。

### 广告学习主事件

```text
listing_completed_loop
```

解释：用户完成一次真实价值动作，例如 valid accept + copy、export copy、A+ brief download。它比 `listing_asin_submit` 更接近产品价值，也比 `listing_subscription_success` 更适合早期喂给 Google Ads。

### 商业结果事件

```text
listing_subscription_success
```

解释：真实付费成功。早期样本少，先作为商业结果与 ROI 计算锚点；当样本足够后，再升级为 Google Ads 的 value-based 优化核心。

## 4. ROI 公式

### 4.1 基础公式

```text
ad_spend = Google Ads spend

free_trial_cost =
  audit_started_count * avg_audit_cost
+ free_bundle_confirm_count * avg_optimization_bundle_cost
+ report_ready_count * avg_report_storage_or_infra_cost

paid_gross_profit =
  subscription_revenue_collected
- refunds
- payment_fees
- paid_user_variable_usage_cost

gtm_roi =
  paid_gross_profit / (ad_spend + free_trial_cost)
```

第一波建议同时看两个窗口：

| 窗口 | 用途 |
|---|---|
| 7 天 | 看产品吸引力、登录、试用和 completed loop，快速修漏斗 |
| 30 天 | 看第一版真实付费回收，作为是否放量的主要判断 |
| 60 / 90 天 | 用于后续 LTV 校准，不作为第一波唯一判断 |

### 4.2 反推可承受成本

需要先由 1.0 或财务口径给出：

```text
expected_gross_profit_per_paid_user
expected_completed_loop_to_paid_rate
free_trial_cost_per_completed_loop
```

可接受的 completed loop 成本：

```text
max_cpcl =
expected_gross_profit_per_paid_user
* expected_completed_loop_to_paid_rate
- free_trial_cost_per_completed_loop
```

需要达到的付费转化率：

```text
required_paid_rate_from_completed_loop =
(ad_cost_per_completed_loop + free_trial_cost_per_completed_loop)
/ expected_gross_profit_per_paid_user
```

例子：如果一个付费用户的预期毛利是 $120，每个 completed loop 的广告成本是 $20，免费试用成本是 $4，则 completed loop 到付费至少要：

```text
(20 + 4) / 120 = 20%
```

这个例子只说明算法，实际数值必须用 1.0 的真实留存、订阅收入和单次 trial 成本替换。

## 5. 第一波 Scorecard

| 层级 | 要证明什么 | 指标 | 事件 / 数据源 |
|---|---|---|---|
| Ads attraction | 广告和落地页是否吸引对的人 | CTR、CPC、landing -> ASIN submit、CPQA | Google Ads、`listing_landing_view`、`listing_asin_submit` |
| Signup friction | audit 前登录是否造成明显损耗 | ASIN submit -> auth gate -> auth complete、Google login share | `listing_auth_gate_view`、`listing_auth_complete` |
| Trial start | 用户是否愿意真正开始免费 audit | auth complete -> audit started | `listing_audit_started` |
| Trial success | 免费 audit 是否稳定跑出报告 | audit started -> report ready、failed rate、wait time | `listing_audit_phase_view`、`listing_report_ready` |
| Value preview | 报告是否让用户相信值得继续 | report view -> optimize click | `listing_report_view`、`listing_optimize_click` |
| Value delivery | 用户是否拿走可用结果 | workspace open -> completed loop、CPCL | `listing_workspace_open`、`listing_completed_loop` |
| Paid intent | 用户是否有付费意愿 | completed loop -> subscribe click -> checkout started | `listing_subscribe_click`、`listing_checkout_started` |
| Paid result | 真实付费是否覆盖成本 | subscription success、CAC、ROI | `listing_subscription_success`、Google Ads cost、billing revenue |

核心成本指标：

| 指标 | 公式 | 用途 |
|---|---|---|
| CPQA | ad spend / qualified ASIN submit | 判断广告和落地页是否买得到合格意图 |
| CPA register | ad spend / auth complete | 判断登录注册成本 |
| CPCL | ad spend / completed loop | 判断免费试用价值交付成本 |
| trial cost per completed loop | free_trial_cost / completed_loop | 判断每次免费体验的直接成本 |
| blended cost per completed loop | (ad spend + free_trial_cost) / completed_loop | 判断真实激活成本 |
| CAC paid | (ad spend + free_trial_cost) / subscription_success | 判断获客成本 |
| ROI 30d | paid_gross_profit_30d / (ad_spend + free_trial_cost) | 第一波是否继续投的总闸门 |

## 6. Cohort 口径

所有 ROI 都要按 cohort 看，不能只看全站总数。

推荐 cohort key：

```text
first_touch_date
utm_source
utm_campaign
utm_content
utm_term
google_campaign_id
google_ad_group_id
google_keyword
gclid / gbraid / wbraid
```

去重用户：

```text
coalesce(user_id, anonymous_id)
```

付费归因窗口建议：

| 渠道 | 窗口 |
|---|---|
| Google Search | click 30 天 |
| Brand / direct | 回溯上一个 non-direct touch |
| SEO / forum | click 30 天，作为后续自然渠道口径 |

第一波 Google Ads 不建议只用当天付费判断。Listing 的流程包含等待、看报告、试用、再决定付费，30 天窗口更合理。

## 7. 前后端需要交付的数据

### 前端

| 需要做什么 | 说明 |
|---|---|
| 捕获并持久化 click id | `gclid`、`gbraid`、`wbraid`、`utm_*` 在首次 landing 时写入 first-party storage |
| 登录前后身份串联 | 登录前 `anonymous_id`，登录后补 `user_id/account_id` |
| 发送关键 UI 事件 | 详见 16 号文档事件表 |
| 区分 auth method | `google/email_login/email_signup`，用于判断 Google 快速登录是否降低损耗 |
| Accept & copy 结果 | valid accept 后必须记录 copy success / failed / manual fallback |
| 不把无效点击算转化 | validation block 只能记 `listing_fix_validation_block`，不能触发 completed loop |

### 后端

| 需要做什么 | 说明 |
|---|---|
| 记录 audit / report / bundle id | 支撑去重、等待状态、报告和优化包归因 |
| 记录真实状态 | queued、running、failed、ready |
| 记录直接成本 | 每次 audit、report、optimization bundle 的 token / agent / data / infra 成本 |
| 记录免费额度使用 | free audit used、free optimization used、credit used |
| 记录 billing 结果 | checkout started、subscription success、refund、payment fee |
| 支持 offline conversion import | 用 click id + conversion time 回传 Google Ads |

### 增长 / 产品

| 需要做什么 | 说明 |
|---|---|
| 维护 campaign 命名 | campaign、ad group、keyword、landing variant 命名要稳定 |
| 定义 qualified ASIN | 先软定义，不前置拦截；用于把无效 ASIN / 竞品刷量从分析中拆出去 |
| 每周复盘 scorecard | 不只看注册，必须看 CPQA、CPCL、paid conversion 和 ROI |
| 调整预算 | 预算调整按 ROI / CPCL / paid trend，而不是按点击量 |

## 8. 数据表建议

### event_log

每条前端/后端事件一行。

关键字段：

```text
event_name
event_time
anonymous_id
user_id
account_id
session_id
asin
marketplace
audit_id
report_id
bundle_id
gclid
gbraid
wbraid
utm_source
utm_campaign
utm_content
utm_term
event_properties
```

### usage_cost

每次 agent / report / bundle 的直接成本。

关键字段：

```text
cost_time
user_id
account_id
asin
audit_id
report_id
bundle_id
cost_type = audit/report/optimization_bundle/infra/data
cost_amount
currency
is_free_trial
```

### subscription_revenue

每笔订阅或退款一行。

关键字段：

```text
payment_time
user_id
account_id
subscription_id
plan_name
gross_revenue
refund_amount
payment_fee
net_revenue
currency
```

### ads_cost

每天从 Google Ads 拉一行或按 keyword 拉一行。

关键字段：

```text
date
campaign_id
campaign_name
ad_group_id
ad_group_name
keyword
clicks
impressions
cost
currency
```

## 9. 放量 / 修复 / 暂停规则

第一波不要只按单一指标砍，也不要因为注册高就放量。建议按四档判断：

| 状态 | 条件 | 动作 |
|---|---|---|
| 放量 | ROI 30d > 1，且 CPCL 稳定，paid conversion 不下降 | 单次预算提升不超过 15%，保留原 campaign 结构 |
| 观察 | CPQA 和 CPCL 合理，但 30d 付费样本未成熟 | 不放大预算，继续跑到样本成熟 |
| 修复 | ASIN submit 高但 auth complete / completed loop 低 | 先修登录、等待反馈、报告价值展示或 workspace 交互 |
| 暂停 | CPQA 高、auth 低、completed loop 低，或免费试用成本明显不可回收 | 暂停该 keyword / ad group，更新文案或投词 |

必须避免的判断：

- 只因为 CTR 高就放量；
- 只因为注册多就放量；
- 只因为 ASIN submit 多就放量；
- 把免费 audit 和 optimization bundle 当作 0 成本；
- 付费样本不足时直接让 Google Ads 只优化 `subscription_success`；
- 没有 cohort 的总数分析，不能指导投放。

## 10. Dashboard 最小版本

P0 dashboard 需要按 campaign / ad group / keyword 展示：

| 字段 | 含义 |
|---|---|
| Spend | 广告花费 |
| Clicks / CPC / CTR | 广告基本效率 |
| ASIN submit / CPQA | 产品吸引力 |
| Auth complete rate | 登录注册摩擦 |
| Report ready rate | agent loop 成功率 |
| Completed loop / CPCL | 免费试用价值交付 |
| Free trial cost | 免费试用直接成本 |
| Subscribe click / checkout started | 付费意图 |
| Subscription success | 真实付费 |
| Paid gross profit | 订阅毛利 |
| ROI 7d / 30d | 投入产出比 |

排序优先级：

1. ROI 30d。
2. paid gross profit。
3. blended cost per completed loop。
4. completed loop volume。
5. CPQA。

## 11. 对团队的交付口径

给前后端的核心不是“帮我埋很多事件”，而是：

1. 我们要知道每个广告点击从 landing 到付费的完整路径。
2. 我们要知道每个免费 trial 实际烧了多少钱。
3. 我们要把登录前后的用户、ASIN、report、bundle、checkout 串起来。
4. 我们要把 Google Ads 的 click id 带到 completed loop 和 subscription success。
5. 我们要按 campaign / keyword 算出 ROI，判断第一波投放是否值得继续。

一句话：

```text
事件文档解决“数据怎么采”；ROI 记分卡解决“花出去的钱有没有赚回来”。
```

