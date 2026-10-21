# API3D 桌宠（dsh-api3d-pet）

![API3D 桌宠](assets/DSH2.png)

DSH（DeepSeek Harness）Web 界面右下角的常驻桌宠挂件：鲸鱼气泡 + **API3D 站点余额** + 今日已用 + 每轮对话消耗，并且**泡泡内容可以完全自定义**（点击序列、模块化排版、并列加权出泡、随机语句 / 随机图片）。标准 DSH bundle 插件，`dsh plugin` 一键安装，无需任何会话令牌。

> 🐋 **这是 API3D（api3d.cn）站点专属版**：主气泡余额取自站点账单接口（`billing/subscription` 的 `balance` + 当日 `billing/usage` 的 `total_usage_usd`），站点地址 / 凭据名 / 币种 / 接口与字段**全部内置** —— 装好后只需填一次 API Key。已移除上游的官方 DeepSeek 余额链路、多厂商模板、Codex 本机会话统计与厂商额度接口。

> 📦 开源仓库：<https://github.com/ptb-xiaou/dsh-api3d-pet> ｜ npm：<https://www.npmjs.com/package/dsh-api3d-pet> ｜ 版本 `0.4.2`（[Release](https://github.com/ptb-xiaou/dsh-api3d-pet/releases/tag/v0.4.2)）

## 安装（DSH Web）

```powershell
# 推荐：npm 已发布版
dsh plugin --profile web add dsh-api3d-pet

# 或从本目录装（源码方式：改代码即时生效，但目录不能移动/改名）
dsh plugin --profile web add link:<本目录绝对路径>
```

装完重启 `dsh web`，浏览器按 `Ctrl+F5`。**第一次点开桌宠菜单会被引导遮罩挡住：粘一次 API Key 保存即可**（站点地址与接口字段都已内置，界面不需要再配别的）。

> 官方桌面客户端（Electron）读的是 `desktop` profile，而 `dsh plugin` 按设计拒绝改它 —— 在桌面端会话里让 DSH 自己装，见下方「安装」一节的桌面端说明。


## 特性

### 记账与显示

- 🐋 **常驻自启**：随 DSH Web 界面每次打开自动出现（标准 DSH bundle 插件）
- 💰 **余额**：60 秒自动刷新 + 点击鲸鱼手动刷新；余额变化时数字**滚动动画**；瞬时网络抖动自动沿用最近余额不报错。**余额来源 = 内置的 API3D 站点**（本副本已移除官方 DeepSeek 余额逻辑）：只要在「API3D 站点设置」里填一次 API Key，地址与接口字段都是插件内置的，取站点 OpenAI 兼容 billing 口径的 `balance` 与当日 `total_usage_usd`（金额即人民币，不折算）；**还没填 key 时主气泡如实报 `NO_KEY`，不会去请求任何官方接口**
- 🔤 **气泡文字自动适配**（本副本改动）：站点金额位数不可控（`¥ 0.000075`、`¥ 12345.67`…），所以气泡三行字号比上游小约 20%，且**超宽的行会自动等比缩小**（最多缩到 55%），挂件被拖大/缩小或窗口尺寸变化后会按新的宽度重算 —— 不会再顶出泡泡边界；自定义模板块里的字号仍是各模块自己的设置
- 📊 **今日已用 · 两个口径要分清**：**主气泡**里的「今日已用（本 key）」来自站点 usage 接口，是**当前这把 key 当天实际扣费**（它的余额本身是账号口径，一把 key 查到的余额是整账号的）；而「API3D 记账」面板 / 记录里的**「已观测消费」是账号余额下降额**按观测累计出的估算（不需要任何令牌）。余额**下降**按观测累计为消费，余额**上升**（充值 / 赠金）单独记录、不会冲掉已有消费；检测到余额增加会提示「待核对余额调整」，可在「API3D 记账 → **你配置的来源模型 → 设置 → 余额校正**」按实际累计到账金额与非调用扣减校正 —— **「已观测消费」与「余额校正」都是该来源账户口径**（由该来源的余额观测得出，不含其它厂商；「本机模型费用」才是所有模型的本地估算）（逐轮明细保留 90 天或最多 2 万条、逐日归档保留 365 天，超期数据归档到 `.dshw-usage-archive.json`）；金额按 8 位小数记账、显示保留两位
- 🧮 **本机模型费用（本地估算）**：只统计**本机 DSH 会话**里跑过的对话 —— 按真实 usage × 内置价目表换算，与站点口径的「今日已用」互不影响；本机还没跑过对话时它就是 `¥ 0.00`（不是定价出错）
- 📅 **使用记录从启用那天起算**（本副本改动）：账本记下本插件**开始记账的日期**（`installedDay`），「API3D 记账」里的标题随可用天数显示「今日使用记录 / 近 N 天使用记录」（最多 7 天），**不显示安装/启用之前的空日期**
- 💬 **每轮对话消耗**：监听 DSH 本机会话事件，按模型**真实 usage**（input / cache / output / reasoning tokens）换算金额，每轮结束弹出消耗泡泡；可开关、自动关闭秒数可设（0 = 不自动关闭），**泡泡内容可自定义**（模块化，金额用 `{cost}` 引用），入口：菜单 → 「音效与提示」→ 「全局设置」→ 展开「每轮消耗提示」→「编辑提示内容」
- ⛰️ **峰谷定价**：工作日高峰 9:00–12:00、14:00–18:00（北京时间），其余空闲；2026-08-23 起**周末全天谷价**。峰谷模块支持状态文字、倒计时、"梁文峰谷 / !?强强?! / 简洁"等多种样式
- 📒 **用量记录窗口**：今日模型消费、近 7 天、全部记录；模型占比条；按日期展开逐条明细（含时间与金额）；支持按日期或**模型名搜索**；模型名带友好标注（`deepseek-flash` → `DeepSeek-V4.1-Flash`，旧名标注"同 V4.1 Flash"）

### 交互

- 🖱️ **拖拽 + 吸附**：四边吸附区可自定义（按比例或像素），角落可组合；可关闭吸附自由摆放。**顶部吸附默认值为 0，表示关闭**；想开启请到「菜单 → 吸附与翻转 → 自定义」，选择「比例吸附」或「绝对吸附」，把上侧数值调为正值后点「确认」。上吸附以挂件盒中心进入吸附区为判据，大尺寸挂件需要相应扩大上侧区域；改回 0 可关闭顶部吸附（#152）。
- 🔄 贴左吸附时整体**水平镜像翻转**（文字同步反向、带动画）
- 🧸 **按压 Q 弹**玩偶效果（按压时底部坐标不变）
- 🎚️ **主菜单**：角色、大小滑块、**音效与提示**（这行只剩入口按钮「全局设置」，音效总开关已搬进面板）、气泡全局开关 + 「按压泡泡设置」、避让滚动条、吸附设置、隐藏菜单按钮、资源管理（含余额预警、今日预算、API3D 记账）
- 🔊 **提示与音效设置**（主菜单 → 「音效与提示」→ 「全局设置」）：**四个入口行** —— **按压音效**（音效组、音量）、**每轮消耗提示**（冒泡提示、自动关闭秒数、任务结束音、提示音量）、**提问提示**、**授权提示**。入口行上就是该事件的**总开关**与**当前值摘要**（如 `默认音效组 · 100%`、`自动关 180s · 叮～`），**点一行才展开**该区的设置项（可同时展开多个）。**每个音效都有独立音量**，每行带「试听」；音效行左侧的 `[✓]` 决定该音效**响不响**（不响 = 仍可冒泡）。底栏 `取消 / 恢复默认 / 保存` —— 面板内的改动**只落内存**，点「保存」才生效，点「取消」完整还原（「恢复默认」之后点取消同样能撤销）
- 🙈 **可隐藏菜单按钮**：隐藏后，电脑端**右键鲸鱼**、手机端**长按鲸鱼约 1.5 秒**唤出菜单
- 📱 **移动端友好**：鲸鱼可触摸拖动（自研触摸接管，不会把页面手势判成滚动导致拖不动）；泡泡编辑器支持**长按 0.4 秒进入拖拽排序**；去掉了浏览器默认的点击高亮方块

### 泡泡系统（核心）

- 💬 **点击序列**：第一次点击显示"首次点击泡"，再点进入"再次点击"队列；队列可任意增删排序，还能把两泡**并列为 A/B 加权选择**（每轮按权重抽一个）
- 🔁 **点按角色推进队列**（可选，在「自定义泡泡」窗口里开）：开启后**点一下角色＝往后推进一项**（第 1→2→3…，走到最后一项再点收起泡泡，下次点按从第 1 项重新开始）；关闭时是原来的行为 —— 点角色回到"首次点击泡"。设置只在这个窗口里，随窗口的「保存」一起生效
- 🧩 **模块化内容**：一个泡泡由若干模块按行组成，支持类型
  - 文本、超链接
  - **随机语句**（多条句子带权重，每次显示抽 1 条且不连续重复）
  - **图片/动图**（从泡泡图库选，独占一整行）
  - **随机图片**（多张图带权重，抽 1 张且不连续重复，同样独占一行）
  - **总余额(充值金额+赠金)**、**赠金**、**充值余额**、今日已用、峰谷时段、**对话名**（内置数值，内容自动获取，可调占位符与样式；对话名可设「**保留长度**」，超出部分显示为 `...`，`0` = 不截断）
    - 三个余额类模块的分工：**总余额(充值金额+赠金)** = 充值余额 + 赠金（`{balance_ds}`，老配置里的模块照旧显示，无需重配）；**赠金**（`{bonus_ds}`）与**充值余额**（`{recharge_ds}`）是单独拆出来的两个模块，取不到数时显示 `—`（真的为 0 才显示 `0.00`）
- 🎨 **逐模块样式**：字体（含自定义字体）、字号、加粗/斜体/下划线、纯色或**跑马灯渐变**配色、底色；文本与随机语句支持悬浮快捷编辑
- 🖐️ **拖拽排版**：桌面端原生拖拽、移动端长按拖拽；模块可并入某行首/尾、可拆行、整行可排序；**每行最多 6 个模块、泡泡最多 6 行**，图片类模块独占一行且一个泡泡只允许一个
- 📚 **模块库**：把常用模块"另存"进库，之后在任意泡泡里点击或拖入复用
- 🏷️ **菜单底部显示当前版本**（**居中**在最下方按钮与菜单底边之间的空隙里，一行 9px 小字；这行**不改变菜单高度** —— 按钮下边距与菜单下内边距各让出一部分、正好等于这行高度。**开发版**显示"下一个版本号 + beta"，例如 `v0.3.19-beta`）

### 提醒

- 🔔 **余额预警**：余额低于设定值时弹提醒，内容可编辑（含图片/随机图片模块）
- 💸 **今日预算**：今日已用达到设定金额时弹提醒，内容同样可编辑
- 💬 **每轮消耗提示**：一轮对话结束后弹消耗泡泡，内容同样可编辑（模块化，金额用 `{cost}`）；**开关、自动关闭秒数、提示音量、任务结束音效与内容编辑入口**都在「音效与提示 → 全局设置」面板的「每轮消耗提示」区（主菜单不再单列这一行）
- ⏳ **等待交互音效**：DSH **需要你回答提问**、或**需要你批准授权**时会响一声并在气泡里提示（默认都是关闭的；打开后与任务结束音共用同一套音效库）。提示内容里的 `{session}` 会替换成**当前对话名**（读不到就显示「当前对话」，超长自动截断为 12 字符 + `...`）。**同一个未回答的提问只响一次**（刷新页面也不会重复响）
- 三者都支持自动关闭秒数设置；气泡模式不可用时自动退化为居中卡片（卡片内也会渲染图片模块）

### 音效 / 角色 / 图片

- 🔊 **按压 & 松开音效**：内置「小黄鸭」「音效1」两套预置；也可导入音频片段并自由组合成**自定义音效组**（槽位可留空 = 该事件静音）
- 🎵 **任务结束音**：一轮回复完成时播放；内置两个预设音效 —— 默认 **Minecraft·经验球**（`assets/minecraft-exp-orb.wav`）与 **A**（`assets/task-end-a.wav`），也可选任意片段或音效组
- ⏳ **提问音 / 授权音**：DSH 需要你回答或批准时播放；与任务结束音共用同一套音效库，**各自可调音量**，音效行左侧的 `[✓]` 决定「响不响」（不响 = 仍会冒泡提示）
- 🔉 **音量：一条全局 + 三条按事件**：①区「按压音效」的音量是**全局基准**（按压 / 松开音用它）；②③④ 区（每轮消耗提示 / 提问提示 / 授权提示）各有一条自己的音量滑块，每行都带「试听」。**没动过某个事件的滑块时，它跟随①区音量**（入口行摘要会写明 `跟随按压音量 N%`）；**一旦你拖过那个滑块，就按你设的值播**（摘要只显示百分比）。这样既能"一个总音量管全局"，也能单独压低某类提示音。
- ✂️ **音频片段管理**：导入时可视化裁剪、试听；资源管理窗口（菜单 → 资源管理 → 「管理」）按 **图片 / 音频 两个可折叠入口**统一查看/试听/删除 —— 入口行右侧直接显示数量（如 `角色 1 · 泡泡图 2`、`音效组 3 · 片段 4`），点一行才展开明细；「导入片段」在音频那一区里；收起/展开时会顺带停掉正在试听的那一段
- 🐳 **自定义角色**：上传自己的鲸鱼图片（图库管理，可回退默认）
- 🖼️ **泡泡图库**：内置 `petpet`、`money1` 两张图，也可上传 png/gif，供图片/随机图片模块使用

### 站点配置（API3D 专属）

> 🧭 **本副本是 API3D 站点专属版**：界面上只保留 **API3D** 这一样东西。上游的多厂商模板（OpenRouter / Kimi / 智谱 / OpenCode Go / OpenAI 兼容中转站 等 32 个）、Codex 本机会话统计、厂商订阅额度接口（`kind:'quota'`）、URL/字段手填的「自定义 HTTP」等与站点无关的适配**都已移除**。
>
> 宿主内部仍保留一条内置 **DeepSeek 记账锚点**（只用于把 `deepseek*` 模型名的会话花费归到本地价目表，不查任何余额接口、不联网），但它在「API3D 记账」列表里**不再显示** —— 站点专属界面里没有这一行。
>
> 因此界面上**没有「添加模型 / 厂商模板」这套东西**了：「API3D 记账」里的入口就是一个「API3D 站点设置」，渠道固定、币种固定人民币。

**用户只需要配置一样东西：API Key。** 站点地址、凭据名、币种、余额 / 用量接口与字段路径全部**内置在插件里**（`https://api3d.cn` + `API3D_API_KEY` + `CNY` + `billing/subscription.balance` + `billing/usage.total_usage_usd`），界面上**不再提供这些输入框** —— 少一个可改字段，就少一类「配错了导致余额读不出来」的问题。

- 🔑 **只填 key**：「API3D 记账 → API3D 站点设置」里只有一行 **API Key**；密钥写入 DSH 官方凭据服务（键名 `API3D_API_KEY`，固定），配置文件里不含密钥。换 key 时粘贴新的覆盖即可，「删除密钥」按钮清除
- 💰 **余额**：`GET https://api3d.cn/dashboard/billing/subscription` 读 `balance`（兼容 `hard_limit_usd`）；点「测试连通性」可先验证 key
- 📉 **今日已用**：`GET https://api3d.cn/dashboard/billing/usage?start_date={today}&end_date={today}` 读 `total_usage_usd`（精确值）—— 直接是**站点当天的实际扣费**，不再用「余额下降额」估算
- 💴 **金额就是人民币**：站点返回的数值**不做任何汇率折算**（字段名里的 `_usd` 是 OpenAI 兼容口径的遗留命名，站点 owner 已确认口径为人民币），站点给多少就显示多少
- 🎯 **额度（可选，手动）**：填总量即可，已用**按 DSH 会话 token 累计**（口径 `input + cacheRead + output`，推理 token 已含在 output 内），也可手动填写；支持「不重置 / 每日 / 每月」
- 💱 **单价**：沿用内置价目表（DeepSeek flash / pro，不分峰谷），界面不再提供自填入口
- 🫧 **泡泡模块**：站点条目自动带「余额·API3D」与「额度·API3D」两个模块，占位符 `{balance}`、`{today}`、`{quota}`、`{quota_used}`、`{quota_left}`、`{quota_total}`、`{quota_reset}`

### 主气泡余额来源：切到 API3D（本仓库改造）

> 🔧 **这是本副本相对上游 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) v0.4.2 的主要功能改动，并已收窄为「API3D 站点专属」**：上游的主气泡余额**写死**官方 DeepSeek 链路（`https://api.deepseek.com/user/balance` + `DEEPSEEK_API_KEY` + DSH 账号登录路），自定义模型只能额外多出一行「余额·<模型名>」模块。本改动①让主气泡直接显示**站点余额**（并可显示站点当日已用），②把**官方余额逻辑整体移除** —— 不再请求任何官方余额接口、不再读 `DEEPSEEK_API_KEY`、内置 DeepSeek 行也不再出数。

**配置（一步，全在界面里点）**

1. 「API3D 记账 → API3D 站点设置」（第一次是「配置 API3D 站点」）；**没配 key 时连菜单都会先被引导遮罩挡住**，直接粘 key 保存即可；
2. 粘贴 **API Key** → 保存。站点地址、凭据名、币种、接口与字段全部内置，**没有任何其它要填的东西**，也不需要勾「允许把凭据发送到自定义地址」或「主气泡余额来源」—— 站点条目恒为余额来源。
   主气泡下一次刷新（`/dsh-whale/balance.json` 轮询，默认 60s；也可点挂件手动刷新）即显示站点余额。

> 🆕 **还没配置 key 时，打开菜单（点右下角的鲸鱼 / 汉堡）就会被一层遮罩挡住**：遮罩上的卡片是"首次配置"引导 —— 标题「配置 API3D API Key」、一句「菜单里的余额、记账和提醒都要用它，粘一下 key 就能继续」、**只有一行 API Key 输入框**，下面一行备注说明没 key 时余额与今日已用都读不到、也不会去请求任何官方接口，最后一行是 **`api3d.cn` 的注册 / 获取入口**（点开新窗口，被浏览器拦截时自动复制链接）。卡片底部只有三颗按钮：**测试连通性 / 保存 / 关闭**（站点地址、接口字段这些细节都不出现 —— 首次配置只需要理解「粘 key + 保存」两件事）。几条硬规则：**空 key 点「保存」会被拦下**（状态行提示「请先粘贴 API Key 再保存」，不发请求、卡片不关，避免"假装配好了"）；**「测试连通性」可以直接拿输入框里还没保存的 key 探测一次**（只读，只对内置站点放行、不写凭据库，通过时会连余额与分组一起报出来）；**点弹窗以外的区域或按 `Esc` 都会关掉卡片**，但没配 key 时**菜单不会因此打开** —— 再点菜单按钮还是这张卡。保存成功 →「✓ 已保存：API3D 余额会显示在右下角」→ 确认后遮罩关掉、菜单恢复可用，并**立即重取一次余额**（不用等下一次 60s 轮询）。

**它期望的接口**（就是站点自己的 OpenAI 兼容账单接口，见站点仓库 `docs/BILLING_QUERY_API.md`）：

| 请求 | 字段 | 含义 |
|---|---|---|
| `GET {base}/dashboard/billing/subscription` | `balance`（兼容 `hard_limit_usd`） | 当前可用余额（人民币） |
| `GET {base}/dashboard/billing/usage?start_date={today}&end_date={today}` | `total_usage_usd`（精确值） | 当日实际扣费（人民币） |

> 用量字段用 **`total_usage_usd`** 而不是美分整数 `total_usage`：站点按美分取整，一次几分钱的调用会被取整成 0，界面就永远显示 ¥0.00（要更细的精度就用 `*_usd`）。该字段名沿用站点文档，数值口径是人民币。

`{today}` 由插件按 **Asia/Shanghai** 取当天日期填入（`YYYY-MM-DD`）。鉴权用 `Authorization: Bearer <key>`，**key 是凭证**：只从 DSH 凭据服务读、且只在目的地通过白名单校验后才会被发送。地址、鉴权头与 JSON 路径都写在**模板 / 集中常量**里（`lib/index.js` 的 `API_TEMPLATES.api3d`），站点若换了路径或字段名，改那一处即可，界面上不需要（也不提供）手填。

**站点分组（显示层）**

- **分组名**：站点 `subscription` 返回的 `plan.title`（以及 `subscription.unlimited` / `expires_at`）显示在两处 —— 模型面板的顶部说明行、以及挂件菜单里的「关于 / 自检」；「API3D 记账」列表里**不再重复显示**余额 / 今日已用 / 分组（那些数字主气泡与站点设置面板已有）；
- **没有汇率这回事**：站点金额即人民币，插件不做折算（主气泡、`currency`、账本分本币种统一 `CNY`）。

**行为约定（改动后的语义）**

- **单源**：站点只有一份配置，它**天生就是**主气泡来源（`displayAsBalance` 由插件自己置位，用户不用勾）；
- **没有官方回退**：站点取数失败（超时 / 401 / 500 / 结构异常）⇒ 主气泡直接显示失败原因（`ok:false` + `code`/`error`），控制台另有一条 `[dsh-whale] 余额读取失败 <code> … ｜来源 <模型> @ <原因>`；payload 里另带 `balanceSourceFallback: {id, name, code, error}`。**还没填 key**时是 `code:'NO_KEY'`，界面提示去「API3D 站点设置」填 API Key；
- **记账分本**：站点余额记在 `relay-<模型id>-<币种>` 这本账里；
- **「今日已用」单一口径（本副本改动）**：主气泡的今日已用**只认站点 usage 接口**（`usageSource:'api'`，标签「今日已用（本 key）」）—— 站点侧余额是**账号口径**（同一账号多把 key 共用），usage 是**当前这把 key 的当日扣费**，两者含义不同，所以本地账本 / 余额观测口径**不会再往主气泡上盖数字**（面板标题「本机模型费用（本地估算）」才是本地口径）；`/dsh-whale/usage-records.json` 的刷新只写面板，不参与主气泡。站点 usage 这次取不到时，payload 给 `todayUsage:null` + `todayUsageUnavailable:true`，前端**沿用上一次显示的数字**（标签加「· 取数失败」），绝不会换成另一个口径的数字；
- **「API3D 记账」列表里不显示模型行**：只有区块标题 **API3D 站点**（右边两颗浅色 chip：**提醒 / 预算** 打开站点的余额预警 / 今日预算 / 额度（手填）、**刷新** 强制重取站点数据），下面一行 **API3D 站点设置** 用来填 key。余额 / 今日已用 / 分组这些数字只在主气泡、站点设置面板与「关于 / 自检」里出现，列表不重复；宿主内部仍保留 `deepseek*` 的计价 / 记账锚点（`matchIds`，不查余额接口、不联网）；
- 版号后缀 **`-relay`**（菜单底部与「关于 / 自检」可见），便于和上游发布版区分。

**验证**：不连真站点也能跑通 —— 仓库外有一份假站点 + 假宿主的端到端用例（`E:\DSH\DSH-Test\test\relay-balance.mjs`，覆盖取数、当日已用、分组、分本、站点单条、来源报错、401、缺 key、零配置保存七条路径，共 60 条断言）。

## 目录结构

```text
dsh-api3d-pet/
├── package.json              # DSH bundle 插件元数据（dsh.bundle.patch 指向 cordis.patch.yml；顶层 icon 指向 icon.png）
├── icon.png                  # 插件列表图标（256×256 PNG，含透明；宿主读成 data URL 塞进 meta.icon，必须是正方形）
├── README.md                 # 本文件
├── cordis.patch.yml          # 插件挂载声明
├── lib/
│   ├── index.js              # 宿主侧插件本体（路由 + 记账 + 音效/图片/角色服务）
│   └── accounting.mjs        # 记账内核（定点金额运算 + 余额观测/校正账本）
├── assets/
│   ├── whale-widget.js       # 前端挂件本体（由宿主按 mtime 热读取）
│   ├── DSH2.png              # README 顶部展示图
│   ├── DSniang1.png          # 小鲸鱼本体（cut-out，气泡由代码绘制）
│   ├── DSniang02.png         # 备用整图（兼容旧版手动安装路径）
│   ├── rua.gif               # 随机台词/撒娇动图（可选）
│   ├── Ya1.mp3 / Ya2.mp3     # 预置音效「小黄鸭」按压 / 松开
│   ├── D1.mp3 / D2.mp3       # 预置音效「音效1」按压 / 松开
│   ├── minecraft-exp-orb.wav # 任务结束音内置默认音效（Minecraft·经验球）
│   ├── task-end-a.wav        # 任务结束音内置预设（A）
│   ├── bubble-petpet.gif     # 内置泡泡图：petpet
│   └── bubble-money1.gif     # 内置泡泡图：money1（余额预警默认内容的配图）
└── whale-widget-prompt.md    # 完整规格/维护提示词（面向二次开发）
```

运行时数据（都放在 `$DSH_HOME`，默认 `~/.dsh`；用环境变量 `DSH_HOME` 可以改到别处）：

| 文件 / 目录 | 用途 |
|---|---|
| `.dshw-size.json` | 挂件外观与开关（缩放、音量、音效组、峰值样式、吸附相关等） |
| `.dshw-usage.json` | 记账账本 + 按日余额观测/校正摘要 + 用量设置（任务结束音、余额预警、今日预算、每轮消耗提示内容，以及 **`events`**：按压 / 每轮消耗 / 提问 / 授权四个事件的音效选择、独立音量、冒泡配置；**每轮消耗的自动关闭秒数存在 `.dshw-size.json` 的 `turnCostCloseMs`**） |
| `.dshw-usage.json.before-recharge-fix.bak` | 旧格式账本备份（0.3.1 首次写入旧账本前自动创建；已存在则不覆盖） |
| `.dshw-turn.json` | 每轮消耗的 seq（避免热重载后前端把新轮次当旧轮次） |
| `.dshw-bubble.json` | 自定义泡泡配置（点击序列 + 模块库 + 点按角色推进队列开关） |
| `.dshw-api.json` | 站点配置注册表（API3D / 凭据名 / 接口字段 / 自定义单价 / 额度与用量累计；**不含密钥**） |
| `.dshw-usage-archive.json` | 账本归档（超过保留期的逐轮明细与逐日汇总；明细 90 天/2 万条、逐日 365 天） |
| `whale-roles/` | 自定义角色图 + `roles.json` 索引 |
| `whale-audio/` | 音频片段 `<id>.wav` + `audio.json` 索引（音效组/片段） |
| `whale-bubble-imgs/` | 泡泡图库图片 + `bubble-imgs.json` 索引 |

## 安装

### 官方桌面端（Electron 客户端）请先看这一节 ⚠️

**桌面端读的不是 `web` profile。** 官方桌面客户端用的是 **`desktop` profile**（`%USERPROFILE%\.dsh\profiles\desktop`），而 `dsh plugin` 命令行**按设计拒绝**碰它：

```
error: profile "desktop" is managed exclusively by the Electron application
```

所以下面「方式 A~D」里的 `--profile web` 命令**对桌面端不适用** —— 按它装完，插件落在 `web` profile 里，而桌面窗口读的是 `desktop` profile，一个字也读不到。表现就是「右下角什么都没有（连 ☰ 也没有）、控制台也不报错」。

**桌面端的正确装法：明确使用当前宿主内置的 `plugin_manager`。**

在桌面客户端的会话里可直接说：

> 请使用当前桌面端内置的 `plugin_manager` 安装 `dsh-api3d-pet`。先核对当前 profile 和是否已有同名插件；已有安装时先报告来源与版本。按该工具支持的操作完成后，告诉我安装结果及是否需要重启。

`plugin_manager` 的作用域是当前 profile（桌面端为 `desktop`），由宿主使用其自带的包管理器完成安装与挂载登记。需要固定版本时，将安装规格改成 `dsh-api3d-pet@<目标版本>`。这条说明用于减少安装前后的无关探索（#194）；不需要自行构造认证 cookie、调用底层 RPC 或改写宿主管理的 profile 文件。工具不可用或操作不受支持时，先说明缺少哪项宿主能力，不绕过桌面端限制改用 `--profile web`。

**首次安装与升级的生效方式**（#162）：

- **首次安装**：工具可能返回 `"application":"applied"`，但这不保证当前窗口已显示挂件。若装完没有出现，完全退出客户端（含系统托盘）后重新打开，再按下方两条自检排查。
- **升级已有安装**：先核对已安装的来源、实际版本和目标版本，优先通过内置工具支持的更新/升级操作沿用同一来源；不要为了更新无故在 npm、GitHub 和本地目录之间切换。返回 `"restart-required"` 时完全退出并重开，随后重新核对实际版本。
- **旧宿主没有更新入口**：例如 #162 报告的桌面端 `0.1.7-rc.2`，页面没有升级入口，重新“添加”带版本的同名包也可能只返回“已安装”。先检查该宿主内置工具是否支持同来源更新；若工具也不支持，保留当前安装，按宿主支持的升级方案处理。只有明确需要卸载再安装或迁移来源时，才先保留原来源、精确版本和用户数据的恢复办法；不要把卸载、删除依赖目录/锁文件当作通用更新步骤。

命令行侧的 `dsh web` 使用自己的 `web` profile：更新后重启宿主，再在浏览器按 `Ctrl+F5`。

**装完怎么自检**（两条分别对应宿主半区与客户端半区）：

- **宿主半区**：`%USERPROFILE%\.dsh\.dshw-turn.json` 存在，且 `seq` 随对话递增；
- **客户端半区**：桌面端 `%APPDATA%\@deepseek-ai\dsh-desktop\Local Storage\leveldb` 里出现 `dshw-pos` / `dshw-last-seq` —— 这两个键**只有挂件前端**会写。

桌面端界面里看不到插件版本号时，可以看 `%USERPROFILE%\.dsh\profiles\desktop\package.json` 的 `dsh.profile.bundles` 和同目录的 `pnpm-lock.yaml`。

> 下面方式 A~D 都是 **Web（`dsh web`）** 的安装方式。

### 方式 A：已有本插件的完整资源包（本地目录 / 压缩包）（推荐）

适用于别人直接发给你一个 zip，或你手上已有一份解压好的插件目录（目录里应有 `package.json`、`cordis.patch.yml`、`lib/`、`assets/`、`README.md`）。

```powershell
# 1) 若是 zip：先解压到一个固定、以后不会移动或删除的目录（不要放临时目录/下载目录）
#    例：D:\Plugins\dsh-api3d-pet
#    要安装的是「包含 package.json 的那一层」，不要多套一层同名目录

# 2) 确认关键文件都在（缺 assets/ 会导致没图、没声）
Test-Path "D:\Plugins\dsh-api3d-pet\package.json",
          "D:\Plugins\dsh-api3d-pet\lib\index.js",
          "D:\Plugins\dsh-api3d-pet\assets\whale-widget.js"

# 3) 如果之前从 GitHub / npm 装过同名插件，先卸载避免版本冲突
dsh plugin --profile web remove dsh-api3d-pet

# 4) 用绝对路径安装（路径含空格要加引号）
dsh plugin --profile web add link:D:\Plugins\dsh-api3d-pet
```

说明：

- `link:` 是**软链安装**：源目录里的文件改了立即生效；但安装后**不能移动/重命名该目录**，移动了要重新 add 一次
- 想改用拷贝安装：`dsh plugin --profile web add file:D:\Plugins\dsh-api3d-pet`（此后源目录再改不会同步，需重新 add）
- 资源包自带 `assets/minecraft-exp-orb.wav`、`assets/task-end-a.wav` 等内置资源；**删掉 assets 里的文件会让对应功能静默降级**（无图/无声）
- 装完同样要重启 `dsh web`，再 F5 刷新浏览器

### 方式 B：从 npm 安装（本副本没有 GitHub 源）

无需本地克隆，一条命令安装：

```powershell
dsh plugin --profile web add dsh-api3d-pet
```

说明：

- 装完后插件会出现在 DSH 的**插件管理页面**里，之后可以直接在页面里更新，无需再手动执行命令
- 网络环境需要代理时，先设置代理环境变量再执行：
  ```powershell
  $env:http_proxy="http://<ip>:<port>"; $env:https_proxy="http://<ip>:<port>"; $env:all_proxy="socks5://<ip>:<port>"; dsh plugin --profile web add dsh-api3d-pet
  ```
- 安装完成后重启 `dsh web`，再 F5 刷新浏览器

### 方式 C：本地安装（从当前仓库）

在**仓库根目录**（`package.json` 所在目录）执行：

```powershell
dsh plugin --profile web add link:.
```

说明：

- `dsh plugin` 会把参数转发给 pnpm，并在成功后自动把 `dsh-api3d-pet` 加入 `dsh.profile.bundles`
- **`link:.` 表示链接当前目录**（仓库根目录本身就是插件包）。如果仓库在别处，用绝对路径：
  ```powershell
  dsh plugin --profile web add link:D:\你的路径\dsh-api3d-pet
  ```
- ⚠️ 不要用 `link:.\dsh-api3d-pet`——仓库里**没有** `dsh-api3d-pet/` 子目录，这样会安装成普通依赖而非插件
- 安装完成后重启 `dsh web`，再 F5 刷新浏览器
- **移动了源码目录**后必须重新执行一次 `add link:<新路径>`；若提示冲突，先 `dsh plugin --profile web remove dsh-api3d-pet` 再 add

### 方式 D：从 npm 安装

```powershell
dsh plugin --profile web add dsh-api3d-pet
```

### 给 AI 的安装说明（Web 使用；桌面端使用上面的 `plugin_manager` 提示）

```
请帮我安装插件 dsh-api3d-pet。来源：npm 上的 dsh-api3d-pet，或者我本地已经有这个插件的「完整资源包」。

先确认运行形态：如果当前是官方桌面客户端，请使用宿主内置 plugin_manager，
不要执行下面的 Web 命令，也不要自行构造认证/RPC或修改 desktop profile。

以下步骤仅用于 dsh web：
1. 确认 DSH 安装器使用的 pnpm 可用；若提示找不到 pnpm，先报告安装器所用路径和版本，
   按该 DSH 版本的安装说明处理，不直接假定需要全局安装或重装插件。
2. 在 Web profile 安装（按我实际拿到的来源任选一种）：

   【来源一：从 npm 安装】
     dsh plugin --profile web add dsh-api3d-pet
   或从本地目录链接安装：
     dsh plugin --profile web add link:<仓库绝对路径>
   （注意：仓库根目录就是插件包，不要写成 link:.\dsh-api3d-pet 这种带子目录的路径）

   【来源二：我本地已有完整资源包（zip 或已解压目录）】
   先确认「完整资源包」长什么样：一个目录，里面应当有
     package.json、cordis.patch.yml、lib/index.js、
     assets/（含 whale-widget.js、DSniang1.png、Ya1.mp3、minecraft-exp-orb.wav、task-end-a.wav 等）、README.md
   然后按下面做：
   a) 如果给我的是 zip：先解压到一个**固定、以后不会移动或删除**的目录，例如
        D:\Plugins\dsh-api3d-pet
      不要解压到临时目录/下载目录/会被清理的位置；也不要多套一层——
      要安装的是**包含 package.json 的那一层**，不是外面那个同名压缩包目录
   b) 检查文件完整性（任意一条 False 就先告诉我，不要继续装）：
        Test-Path "<资源包目录>\package.json"
        Test-Path "<资源包目录>\lib\index.js"
        Test-Path "<资源包目录>\assets\whale-widget.js"
      并确认 package.json 里 name 是 dsh-api3d-pet、带 dsh.bundle.patch 字段
   c) 如果之前从 GitHub / npm 装过同名插件，先卸载避免版本冲突：
        dsh plugin --profile web remove dsh-api3d-pet
   d) 用**绝对路径**安装（路径含空格要加引号）：
        dsh plugin --profile web add link:<资源包目录>
      link: 是软链安装：源目录改了立即生效，但安装后不能移动/重命名该目录；
      移动后必须重新执行一次 add。若想按拷贝安装可用：
        dsh plugin --profile web add file:<资源包目录>
      （file: 以后源目录改动不会同步，需要重新 add）

3. 如果报 pnpm 阻止构建脚本（allowBuilds 相关），先确认被阻止的是哪个包。
   本插件没有安装/编译脚本；不要因此放行所有依赖的构建脚本，按具体报错处理。
4. 重启 dsh web，然后 F5 刷新浏览器

安装后验证：
- dsh --profile web --dump-config 应该能看到 dsh-api3d-pet 在 bundles 里
- curl http://127.0.0.1:3080/dsh-whale/balance.json 应返回 200 JSON（填好 key 后含 `totalBalance`；还没填 key 时为 `{"ok":false,"code":"NO_KEY",…}`，仍 200）
- curl http://127.0.0.1:3080/dsh-whale/widget.js 应返回 200 JS
- curl "http://127.0.0.1:3080/dsh-whale/audio-fragment.wav?id=exp_orb" 应返回 200 audio/wav
- curl "http://127.0.0.1:3080/dsh-whale/audio-fragment.wav?id=end_a" 也应返回 200 audio/wav
  （用来确认资源包里的内置音效已随包就位；若是 404 说明 assets/ 不完整）

另外请确认已在「API3D 站点设置」里填好 **API Key**（站点地址、凭据名、币种、接口与字段全部内置，不需要其它配置）。本副本**不使用** `DEEPSEEK_API_KEY`，也不依赖 DSH 账号登录态。
```

## 凭据（安装后必读）

**余额只有一种来源：你在站点设置里配置的接口。** 本副本按需求**整体移除了官方 DeepSeek 余额链路** —— 不再请求 `api.deepseek.com`、不再读 `DEEPSEEK_API_KEY`、不再使用 DSH 账号登录态（`deepseekAccount`）。

- 入口：「API3D 记账」→「API3D 站点设置」（站点只有一个，界面上**只有一行 API Key**）：
  - **API Key**：粘贴后保存即可 —— 写进 DSH 凭据服务的固定键名 `API3D_API_KEY`（不进注册表文件）；「删除密钥」清除
  - 站点地址、币种、余额 / 用量接口与字段路径**全部内置**（`https://api3d.cn` + `CNY` + `billing/subscription.balance` + `billing/usage.total_usage_usd`），界面上没有这些输入框
  - 站点条目**恒为**主气泡余额来源（`displayAsBalance` 由插件置位），不需要「主气泡余额来源」勾选框；地址是内置可信端点，也不需要「允许把凭据发送到自定义地址」
- 取数：`GET https://api3d.cn/dashboard/billing/subscription` 的 `balance`（兼容 `hard_limit_usd`）= 当前余额；`GET https://api3d.cn/dashboard/billing/usage?start_date={today}&end_date={today}` 的 `total_usage_usd` = 当日已用（`{today}` 按 Asia/Shanghai 取当天）。**金额即人民币，不做汇率折算。**
- 取数失败**不会回退官方**：主气泡如实报错，`balance.json` 里附 `balanceSourceFallback`（来源 id/名称、错误码、原始文案）。
- 账本按来源分本（scope = `relay-<模型id>-<币种>`）；主气泡的今日已用**只认站点 usage 接口**（`usageSource:'api'`）；站点 usage 单独失败时给 `todayUsage:null` + `todayUsageUnavailable:true`（前端沿用上一次的数字），**不会**改用本地账本 / 余额下降差——站点余额是账号口径、usage 是当前 key 口径，混用会让「今日已用」来回跳。

> **不需要** `DEEPSEEK_PLATFORM_TOKEN`。早期版本的"实时·令牌"模式已下线，今日已用统一由**API3D 记账**（余额差 + 会话事件）计算，零令牌开箱即用。

### 安全边界（0.3.15 起，**请务必一读**）

插件会把凭据交给谁、以及谁能改这件事的规则：

1. **凭据只会发往"该厂商内置模板里写死的端点"**。
   自定义模型里如果填了一个**不在该厂商模板内**的接口地址（或者模板地址里用 `{base}` 指向你自己填的地址），插件**默认不会把凭据发过去**，而是返回一条明确提示。
   - 本副本的站点地址 `https://api3d.cn` 已作为**模板内置可信端点**（`trustedOrigins`），因此**不需要**这个开关；界面也不再提供改地址 / 改接口的入口。这条规则保留在宿主代码里，供将来接入别的地址时使用。
2. **配置与凭据的改动只能来自本机（回环地址）**。
   所有写请求（保存模型、写/删凭据、改外观设置等）如果来源不是 `127.0.0.1` / `localhost` / `[::1]`，一律 `403`。
   - 为什么：任意持有 DSH Web 会话的人如果能写模型配置，就等于能决定"凭据被发往哪里" —— 那会把你的 API key 直接送到对方服务器上。**只读接口不受影响**（局域网里照常能看挂件）。
   - 需要远端管理？用环境变量显式声明：`DSHW_ADMIN_HOSTS=192.0.2.10:3080,myhost.lan`（逗号分隔，可带端口；默认空）。
3. 接口地址不允许携带用户名/密码（`https://user:pass@host/`），凭据名只允许字母、数字与下划线。

模型面板里的「凭据名」决定密钥写进哪个 ref（默认由模板带出）：

| 凭据名 | 用途 |
|---|---|
| `API3D_API_KEY` | API3D 站点余额 / 当日已用（API3D 模板默认） |
| `DEEPSEEK_API_KEY` | 内置 DeepSeek 占位行的 ref（本副本不再用它取余额） |

> ⚠️ 站点设置里的「凭据名」决定密钥写进哪个 ref。上游多厂商版本靠模板跟随避免写错 ref；本副本渠道固定为 API3D，默认就是 `API3D_API_KEY`。

## 卸载

```powershell
dsh plugin --profile web remove dsh-api3d-pet
```

## 从旧手动安装升级

如果你之前按旧方式手动安装过（复制 `whale-balance.mjs` + 改 `cordis.patch.yml`），先清理：

```powershell
$web = "$env:USERPROFILE\.dsh\profiles\web"

Remove-Item "$web\whale-balance.mjs" -ErrorAction SilentlyContinue
Remove-Item "$web\whale-balance.cjs" -ErrorAction SilentlyContinue
Remove-Item "$web\DSniang1.png" -ErrorAction SilentlyContinue
Remove-Item "$web\DSniang02.png" -ErrorAction SilentlyContinue
```

然后编辑 `$web\cordis.patch.yml`，删除这段旧补丁：

```yaml
- insert:
    - id: whale-balance-widget
      name: ./whale-balance.mjs?v=1
```

如果里面只有这段，直接改成：

```yaml
[]
```

清理后再执行上面的安装命令。

## 验证

```powershell
dsh --profile web --dump-config | Select-String -Pattern "whale"

curl http://127.0.0.1:3080/dsh-whale/balance.json
curl http://127.0.0.1:3080/dsh-whale/size.json
curl http://127.0.0.1:3080/dsh-whale/widget.js
curl http://127.0.0.1:3080/dsh-whale/image.png
curl http://127.0.0.1:3080/dsh-whale/audio.json
```

- `/dsh-whale/balance.json` → 200 JSON，含 `{ok:true, totalBalance, currency, todayUsage}`
- `/dsh-whale/size.json` → GET 返回配置；PUT 写入
- `/dsh-whale/widget.js` → 200 JS（前端挂件本体）
- `/dsh-whale/image.png` → 200 `image/png`
- `/dsh-whale/audio.json` → 200，含 `groups` / `fragments`（其中内置片段 `exp_orb` = Minecraft·经验球、`end_a` = A）
- `/dsh-whale/audio-fragment.wav?id=exp_orb` → 200 `audio/wav`（内置任务结束音；无需用户导入）
- `/dsh-whale/audio-fragment.wav?id=end_a` → 200 `audio/wav`（内置任务结束音 A）
- `/dsh-whale/wait.json` → 200 JSON，含 `{ok:true, pending}`；`pending` 为当前挂起的「提问 / 授权」（`{kind:'question'|'approval', id, ts}`）或 `null` —— 这是「提问提示 / 授权提示」音效与常驻气泡的数据源（默认每秒轮询一次）
- `/dsh-whale/about.json` → 200 JSON：菜单底部版号那行点开后的「关于 / 自检」面板数据源（版本、通道、文件路径与时间、数据落点、记账 / 余额状态；路径已脱敏，**点开才请求**）
- `/dsh-whale/update-check.json` → 200 JSON：检查更新（`{ok, current, latest, hasUpdate, source}`）；**点了才联网**，镜像优先（npmmirror → jsdelivr → unpkg → npmjs）+ `npm view` 兜底，宿主侧 10 分钟缓存
- 浏览器 F5 后右下角出现挂件

> ⚠️ **关于上面这些 `curl`**：全部 **26 个** `/dsh-whale/*` 路由都已接入 **DSH 浏览器信任栅栏**（`connection.requestRejection`）。
> 因此**不带会话凭据的裸 `curl` 会返回 401**（伪造 `Host` 头则是 403）—— 这是预期行为，不是接口坏了。
> 想验证接口是否存活，看返回 **401/403** 即说明路由已注册且栅栏在工作；在浏览器里访问同一条路径（带会话）才是 200。
> 另外**自 0.3.15 起，写请求（`POST`/`PUT`/`PATCH`/`DELETE`）还必须是本机来源**（Host 为 `127.0.0.1`/`localhost`/`[::1]`），否则 403 —— 详见上方「安全边界」。

## 常见问题

- **安装失败，只看到 `exit 1` / `pnpm failed`**：这些是汇总错误，不能据此认定插件代码有错，也不能直接归因网络。若明确出现“找不到 pnpm / 不是内部或外部命令”（#145），先检查宿主安装器使用的包管理器与启动环境；桌面端尤其要区分宿主自带工具和终端 PATH 中的工具。诊断时请提供：
  - 操作系统/架构、DSH（含桌面壳）和市场版本，实际 profile（`web` 或 `desktop`），首次安装还是升级。
  - 安装入口（内置工具、界面或命令行）、执行的安装规格/命令、来源（npm / GitHub / 本地目录）、已安装版本与目标版本；Node、pnpm、npm、git 版本能确定的就写，不能确定的标为未知。
  - 本次操作的错误码和**最早的底层报错及少量上下文**。优先在本机检查错误信息指向的 `.plugin-manager/logs/operation-*/pnpm.log`，再对照 `hub.log`；同时说明是否使用代理/镜像、失败请求的目标域名和状态码。`ERR_PNPM_ADDING_TO_ROOT`、`Invalid time value`、`Failed to fetch` 应分别定位，不按同一原因处理。
  - **公开前先脱敏**：删除 API key、token、cookie、认证头、含凭据的 URL、个人目录用户名及无关会话内容；只保留定位所需的片段，不原样上传完整日志、凭据文件或整个 profile。没有足够证据时先保留当前安装和数据，不批量删除 `node_modules`、锁文件或修改全局 registry。相关issue由报告者验证效果后决定是否关闭。
- **挂件不出现**：
  - **Web（`dsh web`）**：确认安装命令成功；`dsh --profile web --dump-config` 里能看到 `dsh-api3d-pet`；重启 `dsh web` 后 F5。
  - **官方桌面端**：先确认装对了 profile —— 桌面端读的是 **`desktop` profile**，**不能**用 `--profile web`（而 `--profile desktop` 会被 CLI 拒绝，这是设计如此）。正确入口见上面「**官方桌面端（Electron 客户端）请先看这一节**」，并用那里的**两条自检**判断是「没装到位」还是「装了但没渲染」。**新装也建议重开一次客户端**（issue #162：热生效不一定够）。
- **本插件所有接口（`/dsh-whale/*`）的访问校验**：默认只接受**回环地址**（`127.0.0.1` / `localhost` / `[::1]`）的请求，并拒绝跨站标记（`Sec-Fetch-Site: cross-site`）与 Origin 和 Host 不同源的请求 —— 这是防「恶意网页读写本机接口」的信任栅栏（issue #92 / #136）。如果你把 `dsh web` 放在**反向代理或局域网地址**后面，请用环境变量声明允许的 Host（逗号分隔，可带端口），否则会被 403：
  ```bash
  DSHW_TRUSTED_HOSTS=dsh.example.com,10.0.0.5:3080 dsh web
  ```
- **图片/音效不显示、没声音**：确认插件包内 `assets/` 完整（`DSniang1.png`、`*.mp3`、`minecraft-exp-orb.wav` 等）；缺失时相关功能静默降级。
- **装了 IDM / 迅雷 / Free Download Manager / Motrix 等下载管理器时，每次打开 DSH 都弹"下载确认框"，目标 URL 是挂件的音效**（issue #158）：这些管理器的浏览器集成会把页面里的音效请求当成下载任务抢走。**推荐做法：把本机地址加入它的站点排除列表**（IDM：`选项 → 文件类型 / 站点排除`，把 `127.0.0.1` 与 `localhost` 加进去；其它管理器同理，关键词是"排除本机地址 / 不监控该站点"）。关掉挂件音效开关并不能消除弹窗 —— 音效元素在页面初始化时就会建立。
- **提问 / 授权时不响、也没泡泡**：这两个事件**默认开着**（默认**只冒泡、不响**）。想听声音就去「菜单 → 音效与提示 → 全局设置」，**点一下「提问提示」/「授权提示」那一行**把它展开，勾上「提问提示音效 / 授权提示音」那一行左侧的 `[✓]`（不勾 = 静音、但照旧冒泡），再在下拉里选一个音效；不需要提示就把该区入口行左边的总开关 `[✓]` 取消。（入口行右侧的摘要会实时显示当前配置。）
- **余额提示「还没有配置 API Key」（`NO_KEY`）**：去「API3D 记账 → API3D 站点设置」把 API Key 粘进去保存。站点地址与接口字段都是内置的，没有别的可配项；本副本没有任何官方兜底。
- **余额拿到了、但提示「账本不可用 / 已停止写入以保护原记录」**：账本文件（`.dshw-usage.json`）被外部改坏或结构异常，插件**拒绝覆盖**它以免丢数据。先把它备份改名让插件重建，再按需用「余额校正」补账。
- **保存设置报 `403` / 在别的机器上改了配置不生效**：0.3.15 起**写操作只能在运行 DSH 的那台机器上、用 `127.0.0.1`（本机地址）打开界面进行**。从局域网或反向代理访问时，读没问题、写会被拒。需要远端管理就用 `DSHW_ADMIN_HOSTS` 显式授权那台机器（见「凭据 → 安全边界」）。
- **提示「该地址不是 … 的内置端点，已拒绝把凭据发出去」**：这是 0.3.15 的安全策略 —— **自定义接口地址默认拿不到凭据**。确认那是你自己的网关（New API / 自托管等）后，在**本机**打开面板，对该模型勾选「允许把凭据发送到自定义地址」。
- **今日已用显示 `--`**：先等一次成功的余额观测；统计从该观测时刻开始，起点之前的消费不在此区间内。
- **今日已用与官网有差异**：先核对同一账户、同一币种与同一统计区间；若有充值或其它余额调整，用「API3D 记账 → **你配置的来源模型** → 设置 → 余额校正」填写实际到账金额。余额接口只返回余额快照、不提供充值流水，充值与消费发生在同一次刷新间隔时需要实际到账金额才能校正。
- **充值后消费数字没变**：这是预期行为——充值不会增加消费；数字上方会出现「待核对余额调整」，提示你补充本统计区间的累计到账金额。
- **每轮消耗不显示**：确认「音效与提示 → 全局设置」里「每轮消耗提示」那一行**左边的 `[✓]`** 是勾上的（入口行右侧摘要会直接显示 `已关闭` 或当前配置）；一轮对话要完整结束（`turn/end`）才结算。余额变化泡泡与消耗泡泡抢层时，提醒会退化为居中卡片。
- **每轮消耗泡泡的内容**：「音效与提示 → 全局设置」→ **展开「每轮消耗提示」** → 「编辑提示内容」（模块化，金额用 `{cost}`）；同一区里能设自动关闭秒数、提示音量与任务结束音效。
- **任务结束音没响**：该开关**默认开着**（默认音是内置 **`A`**，另有内置的 Minecraft·经验球可选）；到「音效与提示 → 全局设置」→ **展开「每轮消耗提示」**，确认「任务结束音」那行左侧的 `[✓]` 是勾上的（取消勾选 = 静音）。若自定义片段文件被删，会回退/静音。
- **提示音量调了没用 / 到底听谁的**：把「每轮消耗提示」那一行展开，拖动它自己的「**提示音量**」滑块 ⇒ 该事件的音量**立刻由它说了算**（入口行摘要从 `跟随按压音量 N%` 变成 `N%`）。**没拖过**时它跟随①区「按压音效」的音量 —— 摘要里会写明，滑块也显示实际生效值。想让某类提示更轻就把自己的滑块调小；想整体轻就调①区。点「恢复默认」会把这几条都退回"跟随①区"。（0.3.17 之前这个滑块确实不生效，是本版修好的。）
- **保存后设置没生效 / 保存到底成没成**：0.3.17 起保存失败**不再静默** —— 点「保存」若写入失败，会自动重试一次，仍失败则弹出 `⚠ 设置保存失败：<原因>`（例如数据目录只读、接口被拦）。看到这条提示说明**这次改动没有落盘**，请按原因处理后再保存一次。
- **等待提问 / 授权的气泡关不掉**：**点一下那个气泡即可收起**（同一条挂起不会再自动弹回；你回答/批准后，或下一次新的提问/授权到来时照常提示）。想让**点角色（鲸鱼）也能收起**提示气泡，去「音效与提示 → 全局设置」面板最下面勾上「**点按角色关闭提示气泡**」（默认关）。两处说明都收在旁边的 `?` 圈圈里。
- **换了 / 删了 API key 之后，更早的记账天变成「本地估算 ¥0.00」**：记账按**密钥指纹分本**（一把 key 一本账），换 key 等于换了一本 —— 数据**没丢**，都在 `.dshw-usage.json` 的 `accounting.books` 里。当前版本已让界面把历史本里的日期正常显示（标注「已观测消费 · 历史账户」），并在「API3D 记账」面板顶部提示「检测到 N 个记账本」；**两个本不会被相加**（插件无法判断两次是不是同一个账户），但同一天的明细可以在该面板的「每日与逐条明细」里逐日查看。
- **手机上拖不动鲸鱼**：本版本已用触摸事件接管拖拽，请硬刷新页面拿到最新 `whale-widget.js`；仍不行请反馈浏览器型号。
- **隐藏了菜单按钮怎么进菜单**：电脑端右键鲸鱼，手机端长按鲸鱼约 1.5 秒。
- **改了前端代码不生效**：前端 `assets/whale-widget.js` 由宿主按 mtime 热读取，**硬刷新**（Ctrl+F5）即可；改了宿主 `lib/index.js` 必须**重启 `dsh web`**。
- **模型名看不懂**：账本记录的是 API 模型 id；`deepseek-flash` 即 DeepSeek-V4.1-Flash，旧名 `deepseek-v4-flash` / `-vision-exp` 现在也由同一颗 V4.1-Flash 提供并按 Flash 计价（面板里已加标注）。

## 定价表

金额按 **CNY / 百万 tokens** 计，`[空闲时段, 高峰时段]`；高峰 = 工作日 9:00–12:00、14:00–18:00（北京时间），空闲价为高峰价的一半；2026-08-23 起周末全天按谷价。表在 `lib/index.js` 顶部 `PRICING` / `BASE_PRICE` / `PRO_PRICE`，官方调价时改这里。

| 模型 | 缓存命中 | 缓存未命中 | 输出 |
|---|---|---|---|
| `deepseek-flash`（DeepSeek-V4.1-Flash） | 0.02 / 0.04 | 1 / 2 | 4 / 8 |
| `deepseek-v4-pro`（V4 Pro） | 0.15 / 0.30 | 4.5 / 9.0 | 13.5 / 27.0 |

> 旧模型名 `deepseek-v4-flash`、`deepseek-v4-flash-vision-exp` 仍可调用，按 Flash 价计费。

## 开发与维护

- 仓库里 `lib/index.js` 是宿主本体、`lib/accounting.mjs` 是记账内核（定点金额运算 + 观测/校正账本）、`assets/whale-widget.js` 是前端本体；宿主改动（含记账内核）需重启 `dsh web`，仅前端改动硬刷新页面即生效。
- 完整规格、视觉参数、路由清单、架构结论与生成提示词见 [`whale-widget-prompt.md`](whale-widget-prompt.md)。
- 本地联调：`dsh plugin --profile web add link:.` 后，改前端 → Ctrl+F5；改宿主 → 重启 `dsh web`。

## 上游来源与致谢

本副本是 **API3D（api3d.cn）站点专属 fork**，上游为 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)（MIT）。下面保留上游作者与贡献者的致谢；其中的 issue / PR 链接、Codex 分支与多厂商说明都指上游项目，与本站点无关。

- **Codex 版小鲸鱼的迁移与后续维护**：经协商，**Codex 端口已迁至独立仓库 [Codex-Whale-Public](https://github.com/Yang-huai406/Codex-Whale-Public)**（由 [@Yang-huai406](https://github.com/Yang-huai406) 维护）—— 迁移保留了开发历史、作者贡献与历代版本，并清理了旧图片中的非必要元数据；原作者 **月匠（MeteorNOX）** 与 **macOS 适配贡献者 [@1llysviel](https://github.com/1llysviel)** 的贡献一并保留。**已安装的用户无需因迁移重新安装**，后续请从新仓库获取更新。感谢这次把历史完整接过去的处理方式。
- **0.3.17 的「②区『提示音量』滑块其实不生效 + ②区『冒泡提示』没人读」**由一位 **QQ 群友**（未留 GitHub 账号）做了一轮完整的代码分析后报告：他复现了"拖到最低仍出声"、定位到 `playTaskEndSound()` 读的是①区全局音量、并附了可复用的补丁与两个预打版压缩包供对比。**这两个都是真 bug**（第二个是我顺着他的思路查出来的），0.3.17 已按"解析器 + 三态音量"的方式修复（比补丁覆盖面更广：**音效组那条路也修了**），并新增了一条 CI 检查专门拦这类"控件有值、没有消费方"的问题。感谢他的报告。
- **0.3.16 的「换 / 删 API key 后旧记账被分本隐藏」**（切换当天金额被覆盖、更早的天数退化成「本地估算」）由 GitHub 用户 [@0Sakura721](https://github.com/0Sakura721) 在 [#163](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/issues/163) 中报告，并**直接给出了根因位置**（`lib/index.js` 里用密钥哈希当账户标识、`accounting.mjs` 的 `observeBalance` / `currentBook` 只读 active 本）与数据佐证 —— 让这次能一次做实"数据没丢、只是没有入口"这个判断。0.3.16 据此修复（旧本日期照常显示并标注「已观测消费 · 历史账户」）。感谢他。
- **0.3.16 的「下载管理器抢走挂件音效请求」**（IDM 等每次打开 DSH 弹下载框、关音效也照样弹）由 GitHub 用户 [@VaeKaras](https://github.com/VaeKaras) 在 [#158](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/issues/158) 中报告，复现步骤、被抢的 URL 形态与"关音效无效"的观察都很完整 —— README 据此新增该已知问题与站点排除做法。感谢他。
- **官方桌面端「新装也可能需要重开客户端」**由 GitHub 用户 [@MengLs1620](https://github.com/MengLs1620) 在 [#162](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/issues/162) 中实测反馈，README 的生效方式据此补正。感谢他。
- **「让鲸鱼娘响应任务状态并给出音效提示」**由 GitHub 用户 [@Jy-EggRoll](https://github.com/Jy-EggRoll) 在 [#160](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/issues/160) 中提出，并**提交了实现 PR [#161](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/161)**（其中 `GET /dsh-whale/wait.json` 的数据形状 `{ok, pending:{kind,id,ts}}` 与主线最终方案一致；本 README 的 `wait.json` 路由说明即采纳其写法）。0.3.16 的提问/授权提示音效与常驻气泡按主线方案落地（四入口面板 / 每事件音量与试听 / 抢占置顶）。感谢他，也欢迎他继续参与这个项目的工程化改进。
- **0.3.15 的凭据安全修复**（写入自定义模型即可让宿主动用真实 API key 去请求任意地址，从而外带凭据）由 **B 站用户「星丶白羽莲」** 负责任地报告：把复现步骤、环境与前置条件一起给出，使这次能在**不打死自建网关这类正当用法**的前提下收紧边界。感谢他的支持。
- **DSH 账号登录态读余额**（端点与鉴权头、凭据记录的位置、DSH 自身 `deepseekAccount` 服务的推荐调用方式，以及三个集成坑：账户标识字符集、赠金要计入基准、服务可能不存在）由 GitHub 用户 [@yybai25](https://github.com/yybai25) 在 [#157](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/issues/157) 中给出完整规格与**已在自己机器上验证过的参考实现**；**0.3.14 据此实现**（只调 DSH 服务、不接触账号令牌）。感谢他的贡献。
- 充值记账修复方案（余额上升与下降分开记账、显式余额校正公式、按账户/币种隔离观测窗口、账本原子写入与迁移备份）由 GitHub 用户 [@Yang-huai406](https://github.com/Yang-huai406) 独立设计并实现为可运行的修复分支；**0.3.1 在该方案基础上移植合并**，并保留本项目既有的音效修复。感谢他的支持。
- OpenCode Go 订阅额度（多窗口额度 `quota.json.windows`、按窗口展示与紧凑重置倒计时、「订阅额度」模块的窗口选择）由 GitHub 用户 [@ELFsay](https://github.com/ELFsay) 提交（[#99](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/99)），已合入 `main`。感谢他的贡献。
- **历史合并 PR 的贡献者**（按合入顺序，均已进入本仓库代码 / 发布流程）：
  - [@ztzpro](https://github.com/ztzpro)（[#1](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/1)）：把余额API3D 桌宠**改造成标准 DSH 插件包**（今天的 `cordis.patch.yml` + bundle 结构就来自这里）；
  - [@under-the-ocean](https://github.com/under-the-ocean)（[#6](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/6) / [#7](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/7)）：push 触发**自动发布 npm**、升级 npm 以支持 Trusted Publishing（OIDC）—— 现在的发版流程仍是这套；
  - [@21253soursweetlemon](https://github.com/21253soursweetlemon)（[#16](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/16) / [#18](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/18)）：gif 加载失败降级为文字台词、右缘滚动条避让、**锚点位置记忆**（窗口变化不悬空、能吸回原位 —— 位置系统的起点）；
  - [@fangbm](https://github.com/fangbm)（[#15](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/15) / [#19](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/19) / [#31](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/31) / [#33](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/33) / [#46](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/46)）：多币种余额顺序稳定、每轮消耗泡泡两处缺陷、**周末全天谷价**、记账币种感知、发布时自动建 Release 并生成 PR changelog；
  - [@xiaolinnnnnnn](https://github.com/xiaolinnnnnnn)（[#26](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget/pull/26)）：Windows 桌面端（Tauri v2）重构。

## 许可证

本项目**代码**基于 **MIT License** 开源，详见 [LICENSE](LICENSE)。

⚠️ **`assets/` 下的美术素材（图片 / 动图 / 音效）不在 MIT 覆盖范围内**：它们由维护者提供或使用 AI 工具生成，按「原样（as-is）」随插件分发、仅供运行本插件使用，不授予再许可、也不声明为原创作品。逐项来源、元数据清理说明与权利主张（takedown）方式见 **[PROVENANCE.md](PROVENANCE.md)**。
