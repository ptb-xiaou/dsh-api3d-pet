// ============================================================================
// dsh-api3d-pet —— 客户端半区（浏览器 bundle）
//
// 在 DSH「插件」页的组合包详情页页头操作区（就在「卸载」左边）放一个升级条目：
//
//   1) 已是最新 → 按钮禁用，写「已是最新版本」（用户反馈：不要什么都不显示）
//   2) 有新版本 → 可点「升级到 x.y.z」→ **弹窗二次确认**（不再是按钮文字变来变去）
//   3) 确认后   → 弹窗切到「插件安装中…」进度（同步宿主升级日志的最后几行 + 已用时）
//   4) 结果     → 成功「已升级到 x · 重启 DSH 生效」/ 失败给出原因，可重试
//
//   槽位：plugins.detail.actions（官方 dsh-client-ui-plugin-manager 声明的详情页贡献点）
//   控件：@deepseek-ai/dsh-client-ui-primitives 的 Button / Modal / StateDot（官方共享控件，
//         与插件管理器自己的安装弹窗同一套外观）
//   数据：宿主半区的 GET /dsh-whale/update-check.json、POST /dsh-whale/update.json、
//         GET /dsh-whale/update-log.json（pnpm 输出，用于显示进度）
//
// 形态与官方客户端 bundle 一致：window.__ModuleLoader__.load({ id, factory })，
// factory 通过 require() 取平台基座里的模块（无需任何构建步骤）。
// ============================================================================
window.__ModuleLoader__.load({
  id: 'dsh-api3d-pet',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const react = require('react')
    const h = react.createElement
    const prim = require('@deepseek-ai/dsh-client-ui-primitives') || {}
    const Button = prim.Button || 'button'
    const Modal = prim.Modal || null
    const StateDot = prim.StateDot || null

    /** 自己的包名 —— 也是要认领的组合包 subject。 */
    const PKG = 'dsh-api3d-pet'
    /** 官方插件页声明的详情页操作区槽位（渲染在页面自带的开关与「卸载」之前）。 */
    const SLOT = 'plugins.detail.actions'
    const CHECK_URL = '/dsh-whale/update-check.json'
    const APPLY_URL = '/dsh-whale/update.json'
    const LOG_URL = '/dsh-whale/update-log.json'
    const CSS_ID = 'dsh-api3d-pet-upgrade-css'

    // v0.6.2：装完的状态放**模块级** —— 插件页在升级后会重新挂载详情页条目（React 重挂载 ⇒ useState 归零），
    //   之前「已升级到 x」会一闪而过、又变回可点的「升级到 x」，用户会以为没生效（真机截图实测）。
    //   重启 DSH 后客户端半区会重新加载，这个变量自然清零。
    let appliedState = null

    const CSS =
      '.dshpetUpgBox{display:inline-flex;align-items:center;gap:8px;max-width:30em}' +
      '.dshpetUpgNote{font-size:12px;line-height:1.35;opacity:.8}' +
      '.dshpetUpgErr{font-size:12px;line-height:1.35;color:var(--dsw-alias-text-error,#f2707a);max-width:26em;white-space:normal}' +
      '.dshpetUpgStep{display:flex;align-items:center;gap:10px;margin:0 0 10px}' +
      '.dshpetUpgStepText{font-size:14px;font-weight:600}' +
      '.dshpetUpgDim{font-size:12.5px;line-height:1.6;opacity:.82}' +
      '.dshpetUpgLog{margin:12px 0 0;padding:10px 12px;border-radius:8px;background:rgba(128,140,170,.12);' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:1.55;' +
      'max-height:9.5em;overflow:auto;white-space:pre-wrap;word-break:break-all;opacity:.9}'

    /** 把后端错误码翻译成一句话（与鲸鱼面板里的措辞保持一致）。 */
    const REASONS = {
      NOT_MANAGED: '这个 profile 不由插件管理器接管，不能自动升级',
      LINK_INSTALL: '这是 link:/本地开发安装，请用 git pull 或重装来更新',
      BUSY: '已经有一次升级在跑了，稍等一下',
      PNPM_MISSING: '找不到可用的 pnpm（应用自带与 PATH 里都没有），无法自动升级',
      ALREADY_LATEST: '已经是最新版',
      TARGET_INVALID: '目标版本号不合法',
      CONFIRM_REQUIRED: '需要再次确认才能升级',
      PNPM_FAILED: '安装失败（pnpm 报错，改动已回滚）',
      VERSION_MISMATCH: '装完版本对不上（改动已回滚）',
      SPAWN_FAILED: '起不了 pnpm 进程（改动已回滚）',
      NO_UPDATE_INFO: '拿不到版本信息',
    }

    function reasonText(code, fallback) {
      if (code && REASONS[code]) return REASONS[code]
      return fallback || '升级失败'
    }

    function fmtErr(err) {
      if (err === null || err === undefined) return '未知错误'
      if (typeof err === 'string') return err
      if (err.message) return String(err.message)
      return String(err)
    }

    /** 只保留与本轮升级有关的日志行（时间戳倒序 → 取最近的几条，改成旧→新展示）。 */
    function recentLogLines(lines, target) {
      const keep = []
      for (const raw of lines || []) {
        const s = String(raw)
        if (s.indexOf('apply start') >= 0 || s.indexOf('apply done') >= 0 || s.indexOf(target) >= 0) keep.push(s)
      }
      return keep.slice(-6)
    }

    /**
     * 条目组件。框架 share 会传 props.subject：
     *   { kind: 'bundle', pkg: { name, version, installed, enabled, rows } }
     * 不是我们的组合包就返回 null（页面上什么都不会出现）。
     */
    function UpgradeAction(props) {
      const subject = props && props.subject
      const pkg = subject && subject.pkg
      const mine = !!(subject && subject.kind === 'bundle' && pkg && pkg.name === PKG)

      const [st, setSt] = react.useState(() =>
        appliedState ? { phase: 'ready', latest: appliedState.to, hasUpdate: true, done: appliedState.to } : { phase: 'loading' },
      )
      // 弹窗：null | 'confirm' | 'working' | 'done' | 'failed'
      const [dialog, setDialog] = react.useState(null)
      const [log, setLog] = react.useState([])
      const [elapsed, setElapsed] = react.useState(0)

      // 只在"我们的组合包"上查一次版本；已装好等重启的就不再查（否则又变回可点按钮）。
      react.useEffect(() => {
        if (!mine) return
        if (appliedState) {
          setSt({ phase: 'ready', latest: appliedState.to, hasUpdate: true, done: appliedState.to })
          return
        }
        let alive = true
        setSt({ phase: 'loading' })
        fetch(CHECK_URL, { headers: { accept: 'application/json' } })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
          .then((d) => {
            if (!alive) return
            if (!d || d.ok === false) {
              setSt({ phase: 'error', error: fmtErr(d && d.error) })
              return
            }
            setSt({
              phase: 'ready',
              current: d.current,
              installed: d.installed,
              latest: d.latest,
              hasUpdate: d.hasUpdate === true,
              canSelfUpdate: d.canSelfUpdate !== false,
              reason: d.installReason || d.reason || '',
              // v0.6.10：宿主已把新版本装上、但进程还没重启 ⇒ 直接进"完成后"的终态：
              //   按钮显示「已升级到 x · 重启 DSH 生效」，不会再冒出可点的升级按钮/确认弹窗；
              //   这个状态来自宿主（读磁盘安装版本），所以刷新页面、重挂载也不会退回去。
              done: d.pendingRestart === true ? (d.installed || d.latest || '') : undefined,
            })
          })
          .catch((e) => {
            if (alive) setSt({ phase: 'error', error: fmtErr(e) })
          })
        return () => {
          alive = false
        }
      }, [mine])

      // 安装中：每 0.8 秒拉一次升级日志当进度 + 每秒刷新已用时
      react.useEffect(() => {
        if (dialog !== 'working') return
        let alive = true
        const started = Date.now()
        const tick = () => {
          if (!alive) return
          setElapsed(Math.round((Date.now() - started) / 1000))
        }
        const pull = () => {
          fetch(LOG_URL, { headers: { accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (alive && d && Array.isArray(d.lines)) setLog(d.lines)
            })
            .catch(() => {})
        }
        pull()
        const t1 = setInterval(tick, 1000)
        const t2 = setInterval(pull, 800)
        return () => {
          alive = false
          clearInterval(t1)
          clearInterval(t2)
        }
      }, [dialog])

      if (!mine) return null

      const installed = (pkg && pkg.version) || st.current || ''
      const target = st.latest || ''

      const startUpgrade = () => {
        setDialog('working')
        setLog([])
        fetch(APPLY_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ action: 'apply', target: target, confirm: target }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
          .then((d) => {
            if (d && d.ok === true) {
              appliedState = { to: d.to || target, at: Date.now() }
              setSt((prev) => Object.assign({}, prev, { done: d.to || target }))
              setDialog('done')
            } else {
              setSt((prev) =>
                Object.assign({}, prev, {
                  code: d && d.code,
                  error: reasonText(d && d.code, d && d.error),
                  detail: (d && (d.detail || d.error)) || '',
                }),
              )
              setDialog('failed')
            }
          })
          .catch((e) => {
            setSt((prev) => Object.assign({}, prev, { error: fmtErr(e), detail: '' }))
            setDialog('failed')
          })
      }

      // ---------- 页头那个按钮（永远显示，禁用态也能看懂）----------
      let button = null
      if (st.phase === 'loading') button = h(Button, { variant: 'outline', size: 'sm', disabled: true }, '检查更新…')
      else if (st.phase === 'error')
        button = h(Button, { variant: 'outline', size: 'sm', disabled: true, title: st.error }, '版本检查失败')
      else if (st.done)
        button = h(
          Button,
          { variant: 'outline', size: 'sm', disabled: true, title: '重启 DSH 后新版本生效' },
          '已升级到 ' + String(st.done) + ' · 重启 DSH 生效',
        )
      else if (!st.hasUpdate) button = h(Button, { variant: 'outline', size: 'sm', disabled: true }, '已是最新版本')
      else if (st.canSelfUpdate === false)
        button = h(
          Button,
          { variant: 'outline', size: 'sm', disabled: true, title: st.reason || '这个安装方式不支持自动升级' },
          '升级到 ' + target + '（请手动）',
        )
      else
        button = h(
          Button,
          {
            variant: 'primary',
            size: 'sm',
            title: '下载并安装 ' + target + '（升级后需要重启 DSH 才生效）',
            onClick: () => setDialog('confirm'),
          },
          '升级到 ' + target,
        )

      // ---------- 弹窗 ----------
      const dialogNode = (() => {
        if (!dialog || !Modal) return null
        if (dialog === 'confirm')
          return h(
            Modal,
            {
              open: true,
              onClose: () => setDialog(null),
              title: '升级 ' + PKG,
              closeLabel: '关闭',
              footer: h(
                react.Fragment,
                null,
                h(Button, { variant: 'outline', onClick: () => setDialog(null) }, '取消'),
                h(Button, { variant: 'primary', autoFocus: true, onClick: startUpgrade }, '确认升级'),
              ),
            },
            h(
              'div',
              { className: 'dshpetUpgDim' },
              h('div', null, '当前版本：v' + (installed || '未知') + '　→　目标版本：v' + target),
              h(
                'div',
                { style: { marginTop: 8 } },
                '会从 npm 下载新版本装进当前 profile；**装完需要重启 DSH 才生效**。安装失败会自动回滚，不会留下半个包。',
              ),
            ),
          )

        if (dialog === 'working')
          return h(
            Modal,
            { open: true, onClose: () => {}, title: '插件安装中…', closeLabel: '关闭' },
            h(
              'div',
              null,
              h(
                'div',
                { className: 'dshpetUpgStep' },
                StateDot ? h(StateDot, { state: 'ongoing', size: 28 }) : null,
                h('span', { className: 'dshpetUpgStepText' }, '正在安装 ' + PKG + '@' + target),
              ),
              h('div', { className: 'dshpetUpgDim' }, '已用时 ' + elapsed + ' 秒 · 安装期间请不要关闭这个页面'),
              h('div', { className: 'dshpetUpgLog' }, (recentLogLines(log, target).join('\n') || '等待 pnpm 输出…')),
            ),
          )

        if (dialog === 'done')
          return h(
            Modal,
            {
              open: true,
              onClose: () => setDialog(null),
              title: '升级完成',
              closeLabel: '关闭',
              footer: h(Button, { variant: 'primary', autoFocus: true, onClick: () => setDialog(null) }, '完成'),
            },
            h(
              'div',
              null,
              h(
                'div',
                { className: 'dshpetUpgStep' },
                StateDot ? h(StateDot, { state: 'done', size: 28 }) : null,
                h('span', { className: 'dshpetUpgStepText' }, '已升级到 ' + PKG + '@' + target),
              ),
              h('div', { className: 'dshpetUpgDim' }, '重启 DSH 后新版本生效（宿主半区是随进程启动加载的）。'),
            ),
          )

        // failed
        return h(
          Modal,
          {
            open: true,
            onClose: () => setDialog(null),
            title: '升级失败',
            closeLabel: '关闭',
            footer: h(
              react.Fragment,
              null,
              h(Button, { variant: 'outline', onClick: () => setDialog(null) }, '关闭'),
              h(Button, { variant: 'primary', onClick: startUpgrade }, '重试升级'),
            ),
          },
          h(
            'div',
            null,
            h(
              'div',
              { className: 'dshpetUpgStep' },
              StateDot ? h(StateDot, { state: 'error', size: 28 }) : null,
              h('span', { className: 'dshpetUpgStepText' }, st.error || '升级失败'),
            ),
            h('div', { className: 'dshpetUpgDim' }, '改动已回滚，当前仍是 v' + (installed || '未知') + '。'),
            st.detail ? h('div', { className: 'dshpetUpgLog' }, String(st.detail).slice(0, 1500)) : null,
          ),
        )
      })()

      return h('span', { className: 'dshpetUpgBox' }, button, dialogNode)
    }

    /** 客户端插件主体：注册样式与按钮。 */
    function apply(ctx) {
      ctx.effect(() => {
        const el = document.createElement('style')
        el.id = CSS_ID
        el.textContent = CSS
        document.head.appendChild(el)
        return () => {
          try {
            el.remove()
          } catch (err) {}
        }
      }, 'api3d-pet: upgrade button style')

      ctx.effect(
        () =>
          ctx.slots.inject(SLOT, () =>
            ctx.slots.register({ name: SLOT, id: PKG + '#upgrade', order: 20 }, UpgradeAction),
          ),
        'api3d-pet: upgrade button',
      )
    }

    const inject = ['slots']

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
