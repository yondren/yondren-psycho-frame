<script setup lang="ts">
// 精神力框架：原创机甲「侧向头 + 胸」半身特写，潜伏在黑暗中，外甲张开后扫光把装甲点亮到接近白。
// 纯 CSS 动画、零 JS、零依赖；无客户端状态，SSR 与客户端输出一致。
//
// 造型是原创通用机甲语汇（人形比例、大型肩甲、前倾胸甲、背包喷口、单眼面罩、单支高耸头冠鳍），
// 刻意不使用任何作品的识别特征（V 字天线、面部面罩、特定机体轮廓与配色），代码与文案里也不出现
// 作品或机体名称。
//
// 三个实现要点：
// 1) 白色装甲靠"底暗 + 扫光推亮"表现：填充是深蓝灰（阴影里的白甲），扫光 screen 混合把它推到接近白。
//    直接给白色填充会失去"隐藏在黑暗中"，压低扫光又推不亮——两头都不成立。
// 2) 展开外甲 = 每片绕自己的铰链旋转。所有分片共用一条 @keyframes pf-open，铰链点/角度/延迟由
//    CSS 变量传入。静息态（基础样式）即"已展开"，故 prefers-reduced-motion 下 animation:none 落终态。
// 3) 扫光用 <mask> 限制在机甲体块上，空舞台保持黑暗。遮罩必须显式 maskUnits="userSpaceOnUse"
//    加整个舞台区域——默认区域按被遮罩对象（光带矩形）的包围盒算，光带起始在舞台外，默认区域会把
//    体块全裁掉、遮罩变全黑，扫光静默失效且页面上不报任何错。
</script>

<template>
  <svg
    class="pf"
    viewBox="0 0 400 400"
    role="presentation"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="pfStageGrad" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0%" stop-color="var(--pf-stage-1)" />
        <stop offset="100%" stop-color="var(--pf-stage-2)" />
      </linearGradient>
      <radialGradient id="pfVignette" cx="46%" cy="44%" r="62%">
        <stop offset="45%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="0.66" />
      </radialGradient>
      <linearGradient id="pfBeamGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#fff" stop-opacity="0" />
        <stop offset="34%" stop-color="#e6ebff" stop-opacity="0.34" />
        <stop offset="50%" stop-color="#fff" stop-opacity="0.62" />
        <stop offset="66%" stop-color="#e6ebff" stop-opacity="0.34" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
      </linearGradient>

      <!-- 扫光遮罩：只让光落在机甲各体块上，空舞台保持黑暗。光带只有 120 单位宽，一次只照亮一条。
           必须显式 userSpaceOnUse + 整个舞台区域，理由见文件头注释 3)。 -->
      <mask id="pfMechaMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
        <rect x="0" y="0" width="400" height="400" fill="#000" />
        <g fill="#fff">
          <path d="M142 16 L232 50 L212 56 L204 52 L188 80 L190 120 L198 150 L226 160 L262 154 L284 134 L288 100 L272 72 L246 54 Z" />
          <path d="M192 150 L250 154 L254 212 L188 208 Z" />
          <path d="M164 178 L246 184 L256 234 L248 296 L172 304 L148 250 Z" />
          <path d="M186 186 L268 192 L298 226 L300 302 L278 358 L230 382 L178 378 L166 320 L172 234 Z" />
          <path d="M256 198 L308 216 L314 290 L296 338 L260 332 L252 262 Z" />
          <path d="M154 184 L110 194 L92 232 L96 280 L132 302 L158 290 Z" />
          <path d="M104 278 L94 326 L124 334 L136 290 Z" />
          <path d="M126 290 L118 338 L150 344 L158 300 Z" />
          <path d="M182 298 L248 304 L252 400 L178 400 Z" />
        </g>
      </mask>
    </defs>

    <g class="pf-stage">
      <rect x="0" y="0" width="400" height="400" rx="20" fill="url(#pfStageGrad)" />

      <!-- 内部骨架：外甲张开后露出 -->
      <g class="pf-frame">
        <path class="pf-frame-solid" d="M188 190 L262 194 L292 224 L296 300 L276 356 L232 380 L182 376 L170 320 L176 236 Z" />
        <path class="pf-frame-solid" d="M186 300 L246 306 L248 400 L184 400 Z" />
        <path class="pf-frame-line" d="M222 232 L268 236 M220 268 L276 272 M218 304 L272 308 M214 340 L268 344" />
        <circle class="pf-frame-joint" cx="204" cy="226" r="30" />
        <circle class="pf-frame-joint" cx="214" cy="308" r="22" />
        <!-- 缝隙与导管：精神力框架的发光 -->
        <path class="pf-seam" pathLength="1" style="--pf-d: 0ms" d="M212 200 L212 396" />
        <path class="pf-seam" pathLength="1" style="--pf-d: 140ms" d="M196 208 L254 212" />
        <path class="pf-seam" pathLength="1" style="--pf-d: 280ms" d="M176 298 L246 302" />
        <path class="pf-seam" pathLength="1" style="--pf-d: 420ms" d="M210 156 L248 160" />
      </g>

      <!-- 外甲：每片绕自己的铰链张开 -->
      <g class="pf-armor">
        <!-- 头：单眼面罩 + 单支高耸头冠鳍 -->
        <g class="pf-hinge" style="--pf-ox: 206px; --pf-oy: 150px; --pf-rot: 7deg; --pf-d: 700ms">
          <path class="pf-plate" d="M204 52 L246 54 L272 74 L286 104 L280 134 L258 154 L222 158 L196 148 L186 118 L188 80 Z" />
          <path class="pf-plate" d="M238 50 L150 6 L172 2 L244 42 Z" />
          <path class="pf-plate" d="M186 90 L208 94 L206 124 L186 118 Z" />
          <path class="pf-plate" d="M242 82 L284 90 L286 102 L242 94 Z" />
          <path class="pf-visor" d="M260 96 L282 100 L280 122 L256 116 Z" />
          <path class="pf-detail" d="M204 66 L246 70 M200 92 L242 96 M206 128 L244 132" />
        </g>

        <path class="pf-plate" d="M212 150 L248 152 L250 190 L208 188 Z" />

        <!-- 领口护甲 -->
        <g class="pf-hinge" style="--pf-ox: 206px; --pf-oy: 186px; --pf-rot: -10deg; --pf-d: 200ms">
          <path class="pf-plate" d="M194 176 L254 180 L258 210 L190 206 Z" />
          <path class="pf-detail" d="M206 186 L246 189" />
        </g>

        <!-- 胸甲：向前张开 -->
        <g class="pf-hinge" style="--pf-ox: 256px; --pf-oy: 214px; --pf-rot: -13deg; --pf-d: 300ms">
          <path class="pf-plate" d="M256 198 L308 216 L314 288 L296 336 L260 330 L252 262 Z" />
          <path class="pf-detail" d="M262 214 L300 226 M266 300 L296 308" />
          <path class="pf-detail" d="M276 240 L302 246 M274 258 L302 264 M272 276 L300 282" />
        </g>

        <!-- 肩甲：大型外甲，向上后方抬起 -->
        <g class="pf-hinge" style="--pf-ox: 156px; --pf-oy: 196px; --pf-rot: -20deg; --pf-d: 120ms">
          <path class="pf-plate" d="M164 180 L240 186 L254 232 L246 294 L174 302 L150 250 Z" />
          <path class="pf-detail" d="M186 202 L238 206 M184 226 L244 230 M180 258 L246 262" />
        </g>

        <!-- 背包与喷口：向后张开 -->
        <g class="pf-hinge" style="--pf-ox: 150px; --pf-oy: 200px; --pf-rot: -15deg; --pf-d: 420ms">
          <path class="pf-plate" d="M154 184 L110 194 L92 232 L96 280 L132 302 L158 288 Z" />
          <path class="pf-plate" d="M104 278 L94 326 L124 334 L136 290 Z" />
          <path class="pf-plate" d="M126 290 L118 338 L150 344 L158 300 Z" />
          <path class="pf-detail" d="M114 210 L148 214 M112 232 L150 236" />
        </g>
      </g>

      <!-- 扫光：screen 混合 + 机甲遮罩，只把扫过的装甲推亮 -->
      <g mask="url(#pfMechaMask)">
        <rect class="pf-beam" x="-120" y="0" width="120" height="400" fill="url(#pfBeamGrad)" />
      </g>

      <rect x="0" y="0" width="400" height="400" rx="20" fill="url(#pfVignette)" />
    </g>
  </svg>
</template>

<style scoped>
.pf {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 舞台组自建层叠上下文，避免扫光的 screen 混合溢出到页面背景 */
.pf-stage {
  isolation: isolate;
}

/* ---------- 内部骨架 ---------- */
.pf-frame-solid {
  fill: var(--pf-frame-fill);
  stroke: var(--pf-line);
  stroke-width: 1.2;
}
.pf-frame-line {
  fill: none;
  stroke: var(--pf-line);
  stroke-width: 1.6;
}
.pf-frame-joint {
  fill: var(--pf-frame-fill);
  stroke: var(--pf-line);
  stroke-width: 1.6;
}

/* 缝隙里的精神力框架：扫光经过时走亮段并呼吸 */
.pf-seam {
  fill: none;
  stroke: var(--pf-seam);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: 0.26 0.74;
  animation: pf-flow 3.2s linear var(--pf-d, 0ms) infinite;
}

/* ---------- 外甲 ---------- */
.pf-plate {
  fill: var(--pf-armor-fill);
  stroke: var(--pf-armor-edge);
  stroke-width: 1.3;
  stroke-linejoin: round;
}
.pf-detail {
  fill: none;
  stroke: var(--pf-armor-edge);
  stroke-width: 1.1;
  stroke-linecap: round;
}
.pf-visor {
  fill: var(--pf-hot);
  animation: pf-visor 4s ease-in-out infinite;
}

/* 所有外甲分片共用一条关键帧：铰链点、张开角度、延迟由 CSS 变量给出 */
.pf-hinge {
  transform-box: view-box;
  transform-origin: var(--pf-ox) var(--pf-oy);
  transform: rotate(var(--pf-rot));
  animation: pf-open 900ms cubic-bezier(0.22, 0.9, 0.24, 1) var(--pf-d, 0ms) both;
}

/* ---------- 扫光：等外甲张开后再开始扫 ---------- */
.pf-beam {
  mix-blend-mode: screen;
  animation: pf-sweep 8s linear 1.6s infinite;
}

@keyframes pf-open {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(var(--pf-rot));
  }
}

@keyframes pf-sweep {
  0% {
    transform: translateX(0);
  }
  45% {
    transform: translateX(590px);
  }
  100% {
    transform: translateX(590px);
  }
}

@keyframes pf-flow {
  0% {
    stroke-dashoffset: 1;
  }
  70%,
  100% {
    stroke-dashoffset: -1;
  }
}

@keyframes pf-visor {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

/* 降级：取消动画，外甲停在张开态，扫光撤走。
   因为不再有扫光来照亮，这里把装甲整体抬高，保证静态也看得清这一身白甲。 */
@media (prefers-reduced-motion: reduce) {
  .pf-stage {
    --pf-armor-fill: #8e97b8;
    --pf-armor-edge: #dfe4ff;
    --pf-line: #7e8bd0;
  }
  .pf-hinge {
    animation: none;
  }
  .pf-beam {
    animation: none;
    opacity: 0;
  }
  .pf-seam {
    animation: none;
    stroke-dashoffset: 0;
  }
  .pf-visor {
    animation: none;
    opacity: 1;
  }
}
</style>
