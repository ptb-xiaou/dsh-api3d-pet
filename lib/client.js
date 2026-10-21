// ============================================================================
// dsh-api3d-pet —— 客户端半区（浏览器 bundle）
//
// 只做一件事：在 DSH「插件」页的组合包详情页页头操作区（就在「卸载」左边）
// 放一个「升级到 x.y.z」按钮。
//
//   槽位：plugins.detail.actions（官方 dsh-client-ui-plugin-manager 声明的三个
//         详情页贡献点之一，条目按 subject 渲染，不关心就 return null）；
//   数据：宿主半区已有的 GET /dsh-whale/update-check.json（查最新版）
//         与 POST /dsh-whale/update.json（真装，带备份 + 失败回滚 + 同机护栏）。
//
// 形态与官方客户端 bundle 一致：window.__ModuleLoader__.load({ id, factory })，
// factory 通过 require() 取平台基座里的 React（无需任何构建步骤）。
// ============================================================================
window.__ModuleLoader__.load({
  id: 'dsh-api3d-pet',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const react = require('react')
    const h = react.createElement

    /** 自己的包名 —— 也是要认领的组合包 subject。 */
    const PKG = 'dsh-api3d-pet'
    /** 官方插件页声明的详情页操作区槽位（渲染在页面自带的开关与「卸载」之前）。 */
    const SLOT = 'plugins.detail.actions'
    const CHECK_URL = '/dsh-whale/update-check.json'
    const APPLY_URL = '/dsh-whale/update.json'
    const CSS_ID = 'dsh-api3d-pet-upgrade-css'

    // 用中性色 + currentColor，跟随 DSH 的深浅主题；尺寸对齐页面上的小按钮（28px 高）。
    const CSS =
      '.dshpetUpg{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:8px;' +
      'border:1px solid rgba(128,140,170,.45);background:transparent;color:inherit;font:inherit;font-size:13px;' +
      'line-height:1;cursor:pointer;white-space:nowrap}' +
      '.dshpetUpg:hover:not(:disabled){background:rgba(128,140,170,.14)}' +
      '.dshpetUpg[disabled]{opacity:.55;cursor:default}' +
      '.dshpetUpgPrimary{border-color:rgba(96,150,255,.7);background:rgba(96,150,255,.18)}' +
      '.dshpetUpgPrimary:hover:not(:disabled){background:rgba(96,150,255,.3)}' +
      '.dshpetUpgGhost{border-color:transparent;background:transparent;opacity:.8}' +
      '.dshpetUpgText{font-size:12px;line-height:1.3;margin-left:8px;opacity:.85;align-self:center;max-width:22em}' +
      '.dshpetUpgOk{color:#3ecf8e}' +
      '.dshpetUpgErr{color:#f2707a}'

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

    /**
     * 条目组件。框架 share 会传 props.subject：
     *   { kind: 'bundle', pkg: { name, version, installed, enabled, rows } }
     * 不是我们的组合包就返回 null（页面上什么都不会出现）。
     */
    function UpgradeAction(props) {
      const subject = props && props.subject
      const pkg = subject && subject.pkg
      const mine = !!(subject && subject.kind === 'bundle' && pkg && pkg.name === PKG)
      const [st, setSt] = react.useState({ phase: 'idle' })

      // 只有我们的组合包才去查最新版；查到没新版就什么都不渲染。
      react.useEffect(() => {
        if (!mine) return
        let alive = true
        setSt({ phase: 'checking' })
        fetch(CHECK_URL, { headers: { accept: 'application/json' } })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
          .then((d) => {
            if (!alive) return
            if (!d || d.ok === false) {
              setSt({ phase: 'unavailable', error: fmtErr(d && d.error) })
              return
            }
            setSt({
              phase: 'ready',
              current: d.current,
              latest: d.latest,
              hasUpdate: d.hasUpdate === true,
              canSelfUpdate: d.canSelfUpdate !== false,
              reason: d.installReason || d.reason || '',
            })
          })
          .catch((e) => {
            if (alive) setSt({ phase: 'unavailable', error: fmtErr(e) })
          })
        return () => {
          alive = false
        }
      }, [mine])

      if (!mine) return null

      const installed = (pkg && pkg.version) || st.current || ''
      const target = st.latest || ''

      const runUpgrade = () => {
        setSt((prev) => Object.assign({}, prev, { phase: 'working' }))
        fetch(APPLY_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ action: 'apply', target: st.latest, confirm: st.latest }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
          .then((d) => {
            if (d && d.ok === true) setSt((prev) => Object.assign({}, prev, { phase: 'done', to: d.to || prev.latest }))
            else
              setSt((prev) =>
                Object.assign({}, prev, {
                  phase: 'failed',
                  code: d && d.code,
                  error: reasonText(d && d.code, d && d.error),
                  detail: (d && (d.detail || d.error)) || '',
                }),
              )
          })
          .catch((e) => setSt((prev) => Object.assign({}, prev, { phase: 'failed', error: fmtErr(e), detail: '' })))
      }

      // 没新版：保持页面干净（一键升级的入口在鲸鱼面板里也有一份）。
      if (st.phase === 'idle' || st.phase === 'checking' || st.phase === 'unavailable') return null
      if (st.phase === 'ready' && !st.hasUpdate) return null

      if (st.phase === 'done')
        return h(
          'span',
          { className: 'dshpetUpgText dshpetUpgOk', title: '重启 DSH 后新版本生效' },
          '已升级到 ' + String(st.to || target) + ' · 重启 DSH 生效',
        )

      if (st.phase === 'working')
        return h('button', { className: 'dshpetUpg', type: 'button', disabled: true }, '升级中…（pnpm 安装）')

      if (st.phase === 'failed')
        return h(
          'span',
          { style: { display: 'inline-flex', alignItems: 'center' } },
          h(
            'button',
            {
              className: 'dshpetUpg dshpetUpgPrimary',
              type: 'button',
              title: st.detail || '',
              onClick: runUpgrade,
            },
            '重试升级到 ' + target,
          ),
          h('span', { className: 'dshpetUpgText dshpetUpgErr', title: st.detail || '' }, '升级失败：' + st.error),
        )

      // ready 且有新版（或正在等确认）
      if (st.phase === 'ready' && st.hasUpdate && st.canSelfUpdate === false)
        return h(
          'button',
          {
            className: 'dshpetUpg',
            type: 'button',
            disabled: true,
            title: st.reason || '这个安装方式不支持自动升级',
          },
          '升级到 ' + target + '（请手动）',
        )

      if (st.phase === 'ready' && st.confirm)
        return h(
          'span',
          { style: { display: 'inline-flex', alignItems: 'center' } },
          h(
            'button',
            {
              className: 'dshpetUpg dshpetUpgPrimary',
              type: 'button',
              title: '从 ' + (installed || '当前版本') + ' 升级到 ' + target + '（装完需要重启 DSH）',
              onClick: runUpgrade,
            },
            '确认升级到 ' + target,
          ),
          h(
            'button',
            {
              className: 'dshpetUpg dshpetUpgGhost',
              type: 'button',
              onClick: () => setSt((prev) => Object.assign({}, prev, { confirm: false })),
            },
            '取消',
          ),
        )

      return h(
        'button',
        {
          className: 'dshpetUpg dshpetUpgPrimary',
          type: 'button',
          title: '下载并安装 ' + target + '（升级后需要重启 DSH 才生效）',
          onClick: () => setSt((prev) => Object.assign({}, prev, { confirm: true })),
        },
        '升级到 ' + target,
      )
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
