import type { Curriculum, LiteratureCard, Stage } from "@/types/tuina";

/* ============================================================================
 * 文献与机制微卡片库
 * 每张卡片三层：💡 小白秒懂一句话 / 🧬 生理机制解析 / 📄 原始文献溯源
 * 所有 citation 均为真实已发表文献，DOI / PMID 可直接检索。
 * ========================================================================== */

const LITERATURE: Record<string, LiteratureCard> = {
  "lit-melzack-1965": {
    id: "lit-melzack-1965",
    title: "疼痛闸门控制理论（Gate Control Theory）",
    laymanAnalogy:
      "撞到膝盖后下意识去揉，立刻没那么疼——因为揉搓的触觉信号抢先占住了脊髓里的“闸门”，疼痛信号就像高峰期进不了闸机的乘客。",
    mechanism: {
      nerveFibers: ["Aβ 粗有髓纤维（触压觉，传导快）", "Aδ 细有髓纤维（锐痛）", "C 无髓纤维（钝痛、慢痛）"],
      receptors: ["皮肤与深部机械感受器（Aβ 传入端）", "脊髓背角胶状质（SG）抑制性中间神经元"],
      biomarkers: ["背角 T 细胞（传递细胞）放电率下降", "后续研究：GABA / 甘氨酸能抑制性中间神经元"],
      explanation:
        "节律性揉压持续激活 Aβ 纤维，Aβ 传入在脊髓背角兴奋胶状质（SG）抑制性中间神经元，对 C/Aδ 纤维携带的伤害信号实施突触前抑制，使向上传递的 T 细胞放电减少——闸门“关闭”。这就是 2 Hz 节律揉法能在数秒内产生即时镇痛的脊髓层面解释。",
    },
    citation: {
      authors: "Melzack R, Wall PD",
      title: "Pain mechanisms: a new theory",
      journal: "Science",
      year: 1965,
      volumeIssuePages: "150(3699):971–979",
      doi: "10.1126/science.150.3699.971",
      pmid: "5320816",
    },
    keyData: [
      "提出脊髓背角胶状质（SG）作为“闸门”：粗纤维（L）输入关闭闸门，细纤维（S）输入打开闸门。",
      "首次把疼痛定义为感觉—情绪—认知的多维体验，而非简单的“损伤→疼痛”线性通路。",
      "引入“中枢控制触发”概念：注意力、预期等下行通路也可调节闸门，解释了安慰、专注呼吸的镇痛作用。",
    ],
    practiceImplication:
      "持续、节律、中等压强的触觉输入比一次猛压更能关闭闸门；练习中保持 2 Hz 连续节律而不是断断续续。",
  },
  "lit-bialosky-2009": {
    id: "lit-bialosky-2009",
    title: "手法治疗作用机制的综合模型",
    laymanAnalogy:
      "推拿不是“把骨头推回去”，而是用手给神经系统发了一条短信——真正改变的是大脑和脊髓对疼痛的处理方式。",
    mechanism: {
      nerveFibers: ["外周机械感受传入（Aβ）", "下行疼痛调制通路（中脑导水管周围灰质 PAG → 延髓头端腹内侧区 RVM）"],
      receptors: ["外周机械感受器", "脊髓背角神经元（时间总和下降）", "边缘系统 / 前扣带回（情绪维度）"],
      biomarkers: ["血清素、内源性阿片肽（内啡肽）", "β-内啡肽 / 大麻素系统（后续研究）", "皮质醇与自主神经指标"],
      explanation:
        "一次机械刺激同时触发三层反应：外周（局部炎症介质与血流变化）、脊髓（时间总和减弱、背角兴奋性下降）、脊髓上（下行抑制通路激活、情绪与期望改变）。镇痛效应是神经生理级联的产物，而非组织被“矫正”。",
    },
    citation: {
      authors: "Bialosky JE, Bishop MD, Price DD, Robinson ME, George SZ",
      title: "The mechanisms of manual therapy in the treatment of musculoskeletal pain: a comprehensive model",
      journal: "Manual Therapy",
      year: 2009,
      volumeIssuePages: "14(5):531–538",
      doi: "10.1016/j.math.2008.09.001",
      pmid: "19027342",
    },
    keyData: [
      "综述指出手法后出现的痛觉减退（hypoalgesia）在未接触的远端部位也能测到，说明存在中枢机制。",
      "手法后脊髓时间总和（temporal summation）即刻下降，是脊髓层面兴奋性降低的直接证据。",
      "生物力学位移通常微小且不持久，单靠“复位”无法解释临床效果。",
    ],
    practiceImplication:
      "本课程不教任何“复位”“扳法”。目标是给神经系统提供安全、可预期、足量的机械输入。",
  },
  "lit-simons-2004": {
    id: "lit-simons-2004",
    title: "肌筋膜激痛点：运动终板假说与能量危机",
    laymanAnalogy:
      "激痛点就像一台卡住的马达：开关（运动终板）漏电一直让几根肌纤维收缩，局部血管被勒住、燃料送不进来，肌肉既累又疼，却停不下来。",
    mechanism: {
      nerveFibers: ["α 运动神经元末梢（异常乙酰胆碱释放）", "III/IV 类（Aδ/C）肌肉伤害感受传入"],
      receptors: ["运动终板烟碱型乙酰胆碱受体", "肌肉伤害感受器（对缓激肽、低 pH 敏感）"],
      biomarkers: ["终板噪声（spontaneous electrical activity，EMG）", "局部 ATP 耗竭、缺氧", "致敏物质：缓激肽、P 物质、CGRP"],
      explanation:
        "功能失常的运动终板过量释放乙酰胆碱 → 肌小节持续缩短形成“紧张带” → 局部毛细血管受压 → 缺血缺氧 + 能量需求升高 = 能量危机 → 释放致敏物质 → 伤害感受器敏化 → 疼痛与更多收缩，形成恶性循环。缺血性按压先把血挤空，松开后的反应性充血打破循环。",
    },
    citation: {
      authors: "Simons DG",
      title: "Review of enigmatic MTrPs as a common cause of enigmatic musculoskeletal pain and dysfunction",
      journal: "Journal of Electromyography and Kinesiology",
      year: 2004,
      volumeIssuePages: "14(1):95–107",
      doi: "10.1016/j.jelekin.2003.09.018",
      pmid: "14759755",
    },
    keyData: [
      "针式肌电图在激痛点处记录到终板噪声（低幅高频电位），正常肌肉处几乎没有。",
      "紧张带（taut band）与局部抽搐反应（LTR）是激痛点的两大客观体征。",
      "整合假说把“终板异常—肌小节缩短—能量危机—致敏”串成闭环，解释为什么激痛点既僵硬又疼。",
    ],
    practiceImplication:
      "阶段二找到的“筋结”就是紧张带上的激痛点；按压目标是打断循环而不是“揉散”，所以用静态持续按压而非来回搓。",
  },
  "lit-schleip-2003": {
    id: "lit-schleip-2003",
    title: "筋膜可塑性的神经生物学解释：鲁菲尼小体与交感抑制",
    laymanAnalogy:
      "慢而深的按压就像给紧张的保安递上一杯热茶：筋膜里的鲁菲尼小体收到“慢压”信号后，会让交感神经（警报系统）降下来，肌肉张力自然松开。",
    mechanism: {
      nerveFibers: ["Aβ（鲁菲尼 / 帕奇尼小体传入）", "III 类（Aδ）与 IV 类（C）间质性游离神经末梢"],
      receptors: ["鲁菲尼小体（慢适应，对切向剪切与持续压力敏感）", "帕奇尼小体（快适应，对振动 / 快速压力变化敏感）", "间质受体（多数为自主神经功能，影响血管舒张）"],
      biomarkers: ["交感神经张力下降（皮肤电、心率变异性）", "局部血管舒张 / 血浆外渗", "肌张力经 γ 运动系统下调"],
      explanation:
        "筋膜不是惰性包装纸，而是密集分布机械感受器的感觉器官。鲁菲尼小体对缓慢的切向（剪切）压力特别敏感，激活后抑制交感神经活动；间质受体则改变局部血流。筋膜“变软”主要是中枢调控的张力变化，而不是手把胶原拉长了。",
    },
    citation: {
      authors: "Schleip R",
      title: "Fascial plasticity – a new neurobiological explanation: Part 1",
      journal: "Journal of Bodywork and Movement Therapies",
      year: 2003,
      volumeIssuePages: "7(1):11–19",
      doi: "10.1016/S1360-8592(02)00067-0",
    },
    keyData: [
      "引用 Threlkeld 等力学数据：让致密结缔组织产生永久性形变需要的力远超徒手能提供的范围，说明“拉长筋膜”不是主要机制。",
      "筋膜内感受器以间质性游离神经末梢（III/IV 类）为主，占比远超鲁菲尼与帕奇尼小体，其中很大一部分具有自主神经功能。",
      "鲁菲尼小体对缓慢持续的切向压力反应最强，与临床上“慢而深的手法更放松”的经验吻合。",
    ],
    practiceImplication:
      "揉法要“慢、切向、有一点剪切”而不是快速敲打；2 Hz 是上限，更慢反而更能激活鲁菲尼小体。",
  },
  "lit-shah-2008": {
    id: "lit-shah-2008",
    title: "激痛点局部生化环境：微透析实测",
    laymanAnalogy:
      "把一根比头发还细的“吸管”插进激痛点，抽出来的组织液酸得像隔夜的汤，里面泡满了发炎和疼痛信号分子。",
    mechanism: {
      nerveFibers: ["C 纤维（对低 pH 与炎症介质敏化）"],
      receptors: ["酸敏感离子通道（ASIC）", "缓激肽 B2 受体", "TRPV1"],
      biomarkers: ["P 物质、CGRP", "缓激肽", "TNF-α、IL-1β、IL-6、IL-8", "血清素、去甲肾上腺素", "组织 pH 下降"],
      explanation:
        "活动性激痛点处的组织液 pH 显著更低，且上述炎症因子与神经肽浓度显著更高。低 pH 直接激活 ASIC 与 TRPV1，使 C 纤维敏化，解释了激痛点为什么“一碰就疼”，以及为什么打破缺血循环后疼痛能下降。",
    },
    citation: {
      authors: "Shah JP, Danoff JV, Desai MJ, Parikh S, Nakamura LY, Phillips TM, Gerber LH",
      title: "Biochemicals associated with pain and inflammation are elevated in sites near to and remote from active myofascial trigger points",
      journal: "Archives of Physical Medicine and Rehabilitation",
      year: 2008,
      volumeIssuePages: "89(1):16–23",
      doi: "10.1016/j.apmr.2007.10.018",
      pmid: "18164325",
    },
    keyData: [
      "采用微透析针在上斜方肌活动性激痛点、潜在激痛点与正常肌肉三组取样。",
      "活动性激痛点组的 P 物质、CGRP、缓激肽、TNF-α、IL-1β、IL-6、IL-8、血清素、去甲肾上腺素均显著高于其他两组，pH 显著更低。",
      "有活动性激痛点的受试者，其远端未受累肌肉（腓肠肌）的致敏物质也升高，提示存在系统性影响。",
    ],
    practiceImplication:
      "激痛点处的痛感 VAS 会比周围高 2–3 分，这是正常的生化现象，不代表你压错了；但超过 VAS 6 就是压过头。",
  },
  "lit-hou-2002": {
    id: "lit-hou-2002",
    title: "缺血性按压的时间—压力参数临床验证",
    laymanAnalogy:
      "按激痛点就像按住一个被压扁的喷泉：要么轻一点按久一点（90 秒），要么重一点按短一点（30 秒），两种都有效——本课程取中间值 45 秒。",
    mechanism: {
      nerveFibers: ["Aβ（压力觉）", "C 纤维（通过持续刺激产生适应 / 脱敏）"],
      receptors: ["肌肉机械感受器", "高尔基腱器官（持续张力下促进自身抑制）"],
      biomarkers: ["压痛阈（PPT）升高", "VAS 下降", "颈椎活动度（ROM）改善"],
      explanation:
        "持续按压阻断局部血流，松手后的反应性充血带来氧气与冲刷代谢物；同时持续机械输入让伤害感受器产生适应，脊髓层面兴奋性下降。两种剂量（低压 90 s / 高压 30 s）效果相当，说明“总机械剂量”比单一参数更重要。",
    },
    citation: {
      authors: "Hou CR, Tsai LC, Cheng KF, Chung KC, Hong CZ",
      title: "Immediate effects of various physical therapeutic modalities on cervical myofascial pain and trigger-point sensitivity",
      journal: "Archives of Physical Medicine and Rehabilitation",
      year: 2002,
      volumeIssuePages: "83(10):1406–1414",
      doi: "10.1053/apmr.2002.34834",
      pmid: "12370877",
    },
    keyData: [
      "119 名颈部肌筋膜疼痛患者，上斜方肌激痛点，比较热敷、缺血性按压、牵拉、经皮电刺激等组合。",
      "缺血性按压两种剂量均即刻显著提高压痛阈并降低 VAS：低压力（痛阈水平）持续 90 s，或高压力（痛耐受水平）持续 30 s。",
      "缺血性按压与热敷、牵拉联合时效果优于单一手段。",
    ],
    practiceImplication:
      "45 秒 Hold 是两组有效剂量的折中；新手取 VAS 4–5（痛阈附近），不要追求“越疼越好”的 30 s 高压方案。",
  },
  "lit-stecco-2011": {
    id: "lit-stecco-2011",
    title: "筋膜致密化与透明质酸的触变性",
    laymanAnalogy:
      "筋膜层之间的透明质酸像冻住的蜂蜜：久坐不动它越来越稠，肌肉层之间滑不动；慢慢揉、升温，它就重新变稀、重新滑起来。",
    mechanism: {
      nerveFibers: ["筋膜内游离神经末梢（粘滞升高后被机械卡压而敏化）"],
      receptors: ["筋膜机械感受器（滑动受限时输入异常）"],
      biomarkers: ["透明质酸（HA）浓度与聚集度", "HA 溶液粘度（随温度与剪切速率下降）", "局部 pH"],
      explanation:
        "深筋膜与肌肉之间的疏松结缔组织富含透明质酸，起润滑作用。HA 浓度升高或形成聚集体时粘度上升，层间滑动受阻，称为“致密化”（densification）。HA 具触变性（thixotropy）：受剪切力与温度升高（>40°C）时粘度下降。慢速剪切推法同时提供剪切与摩擦升温，恢复滑动性。",
    },
    citation: {
      authors: "Stecco C, Stern R, Porzionato A, Macchi V, Masiero S, Stecco A, De Caro R",
      title: "Hyaluronan within fascia in the etiology of myofascial pain",
      journal: "Surgical and Radiologic Anatomy",
      year: 2011,
      volumeIssuePages: "33(10):891–896",
      doi: "10.1007/s00276-011-0876-9",
      pmid: "21964857",
    },
    keyData: [
      "解剖学证实深筋膜与肌肉之间的疏松结缔组织层富含透明质酸，是肌筋膜滑动的润滑层。",
      "HA 浓度升高、聚集或 pH 偏酸时粘度非线性上升，提出“致密化”作为肌筋膜疼痛的病因模型。",
      "温度超过 40°C 时 HA 三维结构解聚、粘度下降；剪切力同样可暂时降低粘度（触变性）。",
    ],
    practiceImplication:
      "推法要慢（0.5 Hz）、压实、带着皮肤和浅层一起走，让摩擦升温与剪切一起作用；快速搓皮肤只会发热不发功。",
  },
  "lit-acp-2017": {
    id: "lit-acp-2017",
    title: "美国内科医师学会（ACP）腰痛临床实践指南",
    laymanAnalogy:
      "医学界给腰痛开的“第一张处方”不是止痛药，而是动起来：手法可以帮你过渡，但真正的长期解药是运动。",
    mechanism: {
      nerveFibers: ["不适用（临床指南）"],
      receptors: ["不适用（临床指南）"],
      biomarkers: ["疼痛强度、功能评分（ODI / RMDQ）", "恢复工作时间"],
      explanation:
        "指南基于系统评价与证据分级（GRADE）。急性 / 亚急性腰痛多在数周内自愈，首选非药物手段（浅表热敷、按摩、针灸、脊柱手法）；慢性腰痛首选运动、多学科康复、正念减压、太极、瑜伽等。药物仅作为非药物无效后的二线选择，且不推荐阿片类作为一线。",
    },
    citation: {
      authors: "Qaseem A, Wilt TJ, McLean RM, Forciea MA; Clinical Guidelines Committee of the American College of Physicians",
      title: "Noninvasive Treatments for Acute, Subacute, and Chronic Low Back Pain: A Clinical Practice Guideline From the American College of Physicians",
      journal: "Annals of Internal Medicine",
      year: 2017,
      volumeIssuePages: "166(7):514–530",
      doi: "10.7326/M16-2367",
      pmid: "28192789",
    },
    keyData: [
      "推荐 1（急性 / 亚急性）：优先非药物治疗——浅表热敷（中等质量证据）、按摩、针灸、脊柱手法（低质量证据）。",
      "推荐 2（慢性）：优先运动、多学科康复、针灸、正念减压（中等质量证据），以及太极、瑜伽、运动控制训练、渐进式放松、脊柱手法等（低质量证据）。",
      "推荐 3：慢性腰痛非药物治疗无效时，首选 NSAIDs，其次曲马多或度洛西汀；阿片类仅作最后选择。",
    ],
    practiceImplication:
      "阶段三的手法是“让你能动起来”的工具；完成练功后必须接 GTO 牵拉与日常活动，而不是躺着等按。",
  },
  "lit-langevin-2005": {
    id: "lit-langevin-2005",
    title: "结缔组织机械转导：牵拉改变成纤维细胞形态",
    laymanAnalogy:
      "筋膜里的成纤维细胞像一群蜷着的猫：你持续、温和地拉伸组织几分钟，它们会伸展开“摊成饼”——细胞感受到了机械力并真的改变了自己。",
    mechanism: {
      nerveFibers: ["不涉及神经（细胞层面机械转导）"],
      receptors: ["整合素—黏着斑复合体", "细胞骨架（肌动蛋白）", "机械敏感离子通道"],
      biomarkers: ["成纤维细胞横截面积", "细胞形态指数（纺锤形 → 扁平扩展）", "后续研究：ATP 释放、TGF-β1 表达变化"],
      explanation:
        "组织受到持续牵拉时，机械力经整合素传入细胞，肌动蛋白骨架重塑，细胞体主动扩展。这是“机械信号 → 细胞行为”的直接证据，为手法与牵拉影响结缔组织重塑和炎症信号提供了细胞基础。",
    },
    citation: {
      authors: "Langevin HM, Bouffard NA, Badger GJ, Iatridis JC, Howe AK",
      title: "Dynamic fibroblast cytoskeletal response to subcutaneous tissue stretch ex vivo and in vivo",
      journal: "American Journal of Physiology – Cell Physiology",
      year: 2005,
      volumeIssuePages: "288(3):C747–C756",
      doi: "10.1152/ajpcell.00420.2004",
      pmid: "15496476",
    },
    keyData: [
      "小鼠皮下组织离体牵拉（约 20–30% 应变）与活体牵拉均使成纤维细胞横截面积显著增大，细胞由纺锤形变为扁平扩展形。",
      "形态变化在数分钟到数小时内发生，并可逆，依赖肌动蛋白骨架与 Rho 激酶通路。",
      "证明结缔组织细胞对生理范围内的机械牵拉具有主动、动态的响应。",
    ],
    practiceImplication:
      "牵拉要“持续而温和”（30 秒以上），强度在 VAS 2–3 的拉伸感即可；猛拉只刺激保护性收缩。",
  },
  "lit-crane-2012": {
    id: "lit-crane-2012",
    title: "按摩通过机械转导抑制运动后炎症并促进线粒体生成",
    laymanAnalogy:
      "剧烈运动后肌肉像着了小火的仓库：按摩不是“把乳酸挤出去”（实验证明乳酸根本没变），而是按下了炎症警报的静音键，并下令多造几台“发电机”（线粒体）。",
    mechanism: {
      nerveFibers: ["不涉及神经传导（肌细胞内信号通路）"],
      receptors: ["整合素 / 黏着斑激酶（FAK）", "细胞外信号调节激酶（ERK1/2）"],
      biomarkers: ["NF-κB 核转位 ↓", "TNF-α、IL-6 mRNA ↓", "PGC-1α ↑（线粒体生物合成主调控因子）", "乳酸、糖原：无显著变化"],
      explanation:
        "机械压力经整合素激活 FAK / ERK 通路，抑制炎症主开关 NF-κB 进入细胞核，从而降低 TNF-α 与 IL-6 表达；同时上调 PGC-1α 促进线粒体生成。传统“排酸”说法不成立：乳酸与糖原清除速度没有改变。",
    },
    citation: {
      authors: "Crane JD, Ogborn DI, Cupido C, Melov S, Hubbard A, Bourgeois JM, Tarnopolsky MA",
      title: "Massage therapy attenuates inflammatory signaling after exercise-induced muscle damage",
      journal: "Science Translational Medicine",
      year: 2012,
      volumeIssuePages: "4(119):119ra13",
      doi: "10.1126/scitranslmed.3002882",
      pmid: "22301554",
    },
    keyData: [
      "11 名健康年轻男性力竭骑行后，一侧股四头肌接受 10 分钟按摩，另一侧对照，双侧肌肉活检比较。",
      "按摩侧 NF-κB（p65）核聚集减少，TNF-α 与 IL-6 表达显著降低，PGC-1α 显著升高。",
      "按摩侧与对照侧的肌肉乳酸、糖原含量无差异——否定“按摩排乳酸”假说。",
    ],
    practiceImplication:
      "阶段四的“排酸”只是传统叫法，真实目标是提供 10 分钟左右中等压力的机械输入；不需要压到疼。",
  },
  "lit-diego-field-2009": {
    id: "lit-diego-field-2009",
    title: "中等压力按摩激活副交感（迷走）神经",
    laymanAnalogy:
      "轻飘飘的触摸像有人在耳边吹气，会让人警觉；而沉稳、中等压力的慢速触压像被厚被子裹住，身体的“刹车”（迷走神经）才会踩下去。",
    mechanism: {
      nerveFibers: ["Aβ（压力觉）", "C 触觉纤维（CT afferents，对缓慢轻抚敏感，传入岛叶）", "迷走神经传出"],
      receptors: ["皮肤与深部压力感受器", "鲁菲尼小体", "压力感受器反射通路"],
      biomarkers: ["心率变异性（HRV）高频成分 ↑", "心率 ↓", "EEG：δ 波 ↑，α/β 波 ↓（放松 / 困倦模式）", "皮质醇 ↓（相关研究）"],
      explanation:
        "中等压力触压激活深部压力感受器并经迷走传入提高副交感张力，表现为 HRV 升高、心率下降与脑电向慢波偏移；轻压力反而引起交感觉醒。因此助眠手法必须“有分量但不疼”，且节律缓慢。",
    },
    citation: {
      authors: "Diego MA, Field T",
      title: "Moderate pressure massage elicits a parasympathetic nervous system response",
      journal: "International Journal of Neuroscience",
      year: 2009,
      volumeIssuePages: "119(5):630–638",
      doi: "10.1080/00207450802329605",
      pmid: "19283590",
    },
    keyData: [
      "成年受试者随机接受中等压力或轻压力按摩，同步记录心电（HRV）与脑电。",
      "中等压力组：迷走活动（HRV）升高、心率下降、EEG 出现 δ 波增加与 α/β 波减少的放松模式。",
      "轻压力组：出现觉醒反应（心率与 β 波方向相反），说明压力量级决定自主神经效应方向。",
    ],
    practiceImplication:
      "摩腹和小腿引流的压强保持“按到软组织明显下陷但不疼”（VAS 1–2），速度放慢到 0.5 Hz 以下，配合延长呼气。",
  },
  "lit-guo-2017": {
    id: "lit-guo-2017",
    title: "按摩缓解延迟性肌肉酸痛（DOMS）：系统评价与 Meta 分析",
    laymanAnalogy:
      "练完腿第二天下楼梯像踩刀尖？把多项随机试验汇总后发现：运动后按摩确实能把这种酸痛削掉一截，而且肌肉力量恢复更快。",
    mechanism: {
      nerveFibers: ["III/IV 类肌肉传入（DOMS 的痛觉来源）", "Aβ（闸门控制镇痛）"],
      receptors: ["肌肉机械与化学感受器"],
      biomarkers: ["VAS（24 / 48 / 72 h）↓", "血清肌酸激酶（CK）↓", "最大等长收缩力（MIF）恢复 ↑"],
      explanation:
        "DOMS 源于离心收缩造成的微损伤与随后的炎症反应。按摩通过闸门控制即时镇痛、抑制炎症信号（见 Crane 2012）并改善局部血流，综合表现为疼痛评分下降与肌肉功能恢复加快。",
    },
    citation: {
      authors: "Guo J, Li L, Gong Y, Zhu R, Xu J, Zou J, Chen X",
      title: "Massage Alleviates Delayed Onset Muscle Soreness after Strenuous Exercise: A Systematic Review and Meta-Analysis",
      journal: "Frontiers in Physiology",
      year: 2017,
      volumeIssuePages: "8:747",
      doi: "10.3389/fphys.2017.00747",
      pmid: "29021762",
    },
    keyData: [
      "纳入 11 项随机对照试验，比较运动后按摩与无干预对 DOMS 的影响。",
      "按摩组在运动后 24、48、72 小时的肌肉酸痛评分均显著低于对照组。",
      "按摩组血清 CK 水平更低、最大等长收缩力恢复更好，提示肌肉损伤与功能同时获益。",
    ],
    practiceImplication:
      "运动后 2 小时内做 10 分钟小腿引流效果最佳；力度中等，方向向心，别在肌肉最酸的那一点反复深压。",
  },
  "lit-sinclair-2011": {
    id: "lit-sinclair-2011",
    title: "腹部按摩的躯体—内脏反射与肠道蠕动",
    laymanAnalogy:
      "肚子上顺时针画圈，等于顺着大肠的“传送带”方向轻推：皮肤和腹壁的信号经脊髓传给肠道，蠕动节律被重新唤醒。",
    mechanism: {
      nerveFibers: ["腹壁皮节传入（T7–T12）", "副交感传出（迷走神经 + 骶部 S2–S4）"],
      receptors: ["腹壁机械感受器", "肠壁牵张感受器（肌间神经丛）"],
      biomarkers: ["结肠传输时间 ↓", "排便频率 ↑", "腹胀 / 不适评分 ↓"],
      explanation:
        "腹壁的节律性机械刺激经同一脊髓节段影响内脏传出（躯体—内脏反射），并提高副交感张力促进肠蠕动；顺时针方向与升结肠→横结肠→降结肠的解剖走向一致。副交感激活同时也是助眠的生理基础。",
    },
    citation: {
      authors: "Sinclair M",
      title: "The use of abdominal massage to treat chronic constipation",
      journal: "Journal of Bodywork and Movement Therapies",
      year: 2011,
      volumeIssuePages: "15(4):436–445",
      doi: "10.1016/j.jbmt.2010.07.007",
      pmid: "21943617",
    },
    keyData: [
      "综述多项临床研究：腹部按摩可缩短结肠传输时间、增加排便次数并减轻腹部不适。",
      "机制归纳为：刺激肠蠕动、激活副交感神经、放松腹壁与盆底肌肉。",
      "干预通常为每日 10–15 分钟、持续数周，无严重不良事件报告（需排除腹部禁忌症）。",
    ],
    practiceImplication:
      "摩腹顺时针、慢、轻（VAS 0–2），睡前做 5–10 分钟；有腹部红旗征者此模块自动禁用。",
  },
};

export const LITERATURE_LIBRARY: LiteratureCard[] = Object.values(LITERATURE);

export function getLiterature(id: string): LiteratureCard | undefined {
  return LITERATURE[id];
}

function pick(...ids: string[]): LiteratureCard[] {
  return ids.map((id) => {
    const card = LITERATURE[id];
    if (!card) throw new Error(`Unknown literature id: ${id}`);
    return card;
  });
}

/* ============================================================================
 * Stage 1：破除玄学与手感建立（30 分钟速成）
 * ========================================================================== */

const STAGE_1: Stage = {
  id: "stage-1",
  order: 1,
  title: "破除玄学与手感建立",
  subtitle: "压强标尺 · 三层触感 · 2 Hz 基础掌揉",
  durationMinutes: 30,
  goals: [
    "能用 VAS 0–10 痛感标尺描述并稳定复现 3 个压强档位（VAS 2 / 4 / 6）",
    "用指腹区分骨头（硬、不动）、肌腱（韧、像琴弦）、痉挛肌腹（有弹性、按下去会“让”）",
    "跟着 2 Hz 节拍完成连续 3 分钟掌揉，节拍偏差小于 ±10%",
    "理解为什么“揉一揉就不疼”是脊髓闸门而不是“把气血揉开”",
  ],
  relevantRedFlagIds: ["rf-acute-trauma", "rf-fracture", "rf-skin", "rf-first-time"],
  palpation: {
    title: "前臂伸肌群三层触诊导航",
    regions: ["forearm-posterior"],
    intro:
      "前臂是最安全的练习场：没有大血管神经干，骨头、肌腱、肌腹三种触感一次集齐。把练习手的前臂放在桌上，掌心朝下，用另一只手的食指 + 中指指腹探索。",
    landmarks: [
      {
        id: "lm-lateral-epicondyle",
        name: "肱骨外上髁",
        latin: "Epicondylus lateralis humeri",
        kind: "bone",
        region: "forearm-posterior",
        position: { x: 112, y: 118 },
        howToFind: [
          "屈肘 90°，掌心朝下。",
          "从肘尖（尺骨鹰嘴）向外侧（拇指侧）滑 2–3 cm。",
          "摸到一个圆形骨性凸起，像半颗埋在肉里的乒乓球，按压它完全不会“让”。",
        ],
        feel: "坚硬、边界清楚、按压无弹性，位置不随握拳改变。",
        pitfalls: "太靠内侧会摸到鹰嘴（更尖）；太靠远端会滑到肌腹上（有弹性）。",
      },
      {
        id: "lm-olecranon",
        name: "尺骨鹰嘴",
        latin: "Olecranon ulnae",
        kind: "bone",
        region: "forearm-posterior",
        position: { x: 88, y: 150 },
        howToFind: ["屈肘，肘尖最突出的那块骨头就是它。", "它是判断“骨头是什么触感”的基准点。"],
        feel: "尖锐、硬、皮下几乎没有软组织。",
        pitfalls: "肘尖与外上髁之间有一条浅沟，不要把沟误当作骨头。",
      },
      {
        id: "lm-extensor-belly",
        name: "前臂伸肌群肌腹（桡侧腕短伸肌）",
        latin: "M. extensor carpi radialis brevis",
        kind: "muscle",
        region: "forearm-posterior",
        position: { x: 176, y: 126 },
        howToFind: [
          "从肱骨外上髁向手腕方向滑 3–5 cm。",
          "让练习手反复“抬腕”（手背向上翘），指腹下会感到一团肉在鼓起、放松——那就是伸肌群肌腹。",
          "停止抬腕，肌腹应该变软；如果一直硬并且按下去酸胀，那是痉挛肌腹。",
        ],
        feel: "放松时像生面团，有弹性、会“让”；收缩时像硬橡皮。",
        pitfalls: "压得太深会直接顶到桡骨（硬），这不是肌肉的触感。",
      },
      {
        id: "lm-extensor-tendon",
        name: "伸肌肌腱（腕背侧）",
        latin: "Tendines mm. extensorum",
        kind: "muscle",
        region: "forearm-posterior",
        position: { x: 330, y: 138 },
        howToFind: [
          "滑到手腕背面上方 3 cm。",
          "抬起手指、翘手腕，皮下会浮起几根绷紧的“琴弦”。",
          "横向轻轻拨动它，能感到它在指下滚动。",
        ],
        feel: "韧、圆、像一根拉紧的鞋带；横向可以拨动，纵向不动。",
        pitfalls: "新手常把肌腱当成“筋结”去猛按。肌腱不是激痛点，猛按它只会损伤腱鞘。",
      },
    ],
    selfCheck:
      "闭上眼，让同伴把你的手指分别放到外上髁、肌腹、肌腱上，你能在 3 秒内说出“骨 / 肌 / 腱”吗？三次全对才算过。",
  },
  practice: {
    title: "压强标定 + 2 Hz 基础掌揉",
    intro:
      "本阶段只练两件事：把手上的力“量化”，以及跟上一个稳定的慢节拍。所有后续手法都建立在这两项之上。",
    techniques: [
      {
        id: "t1-pressure-calibration",
        demo: "press",
        name: "指腹压强标定（VAS 阶梯按压）",
        modernName: "Graded Pressure Calibration",
        summary:
          "用静态按压练习“按到 VAS 2、4、6 分别是什么感觉”，建立压强—痛感的个人标尺。",
        mechanics: {
          mode: "holdRelease",
          holdSeconds: 10,
          releaseSeconds: 5,
          targetDepth: 0.4,
          vas: { min: 2, max: 4 },
          direction: "perpendicular",
          neuroTarget: "Aβ 压力觉校准（建立压强内感受）",
          breathing: { inhaleSeconds: 3, exhaleSeconds: 5, exhaleAction: "sink" },
          requiredSeconds: 120,
        },
        steps: [
          "拇指指腹垂直放在前臂伸肌群肌腹上，手臂放松。",
          "第 1 轮：按到“刚好有感觉但完全不疼”= VAS 2，保持 10 秒，松 5 秒。",
          "第 2 轮：加深到“酸胀、可以边按边说话”= VAS 4，保持 10 秒，松 5 秒。",
          "第 3 轮：再加深到“明显疼但能忍、会皱眉”= VAS 6，保持 10 秒后立即松开——这是上限，之后所有手法不许超过它。",
          "回到 VAS 4 重复 3 轮，确认自己能稳定复现。",
        ],
        handPosition: "拇指指腹着力，其余四指在前臂另一侧托住做支点；手腕保持中立，不要用指尖。",
        stopSignals: ["出现刺痛或麻电感（压到神经）", "松手后痛感持续超过 10 秒", "皮肤出现白圈久久不退"],
        literatureIds: ["lit-bialosky-2009"],
      },
      {
        id: "t1-palm-kneading",
        demo: "knead",
        name: "慢速掌揉法（Ruffini 激活模式）",
        modernName: "Slow Tangential Kneading @ 2.0 Hz",
        summary:
          "掌根贴住肌腹，带着皮肤做小圆周切向运动，频率锁定 2.0 Hz（120 次/分），深度按压至肌腹 50% 形变。",
        mechanics: {
          mode: "rhythmic",
          frequencyHz: 2.0,
          targetDepth: 0.5,
          vas: { min: 3, max: 4 },
          direction: "tangential",
          neuroTarget: "鲁菲尼小体（慢适应切向压力）+ Aβ 闸门控制",
          requiredSeconds: 180,
        },
        steps: [
          "打开节拍器，先空手跟拍 10 秒，让手腕记住 2 Hz 的速度。",
          "掌根（大鱼际 + 小鱼际）贴在前臂伸肌群肌腹上，沉到 VAS 3–4。",
          "每一拍画一个直径 2 cm 的小圆，皮肤要跟着手一起动——不是在皮肤表面摩擦。",
          "盯着压力计波形，让自己的下沉—回弹和曲线同步；深度目标线在 50%。",
          "连续 3 分钟不停，节拍偏差指示保持在绿色区。",
        ],
        handPosition: "肘微屈，用上身重量而不是手臂力量下沉；手指自然放松，不抓握。",
        stopSignals: ["皮肤发红发烫像擦伤（说明在摩擦而不是带动皮肤）", "痛感升到 VAS 5 以上", "手腕或拇指自己先酸"],
        literatureIds: ["lit-melzack-1965", "lit-schleip-2003"],
      },
    ],
    forbidden: [
      "指尖戳按（压强过大且不可控）",
      "用手臂猛力下压（应使用体重）",
      "在肌腱上做任何揉压",
      "任何快速敲击、拍打",
    ],
  },
  literature: pick("lit-melzack-1965", "lit-bialosky-2009", "lit-schleip-2003"),
  quiz: {
    title: "阶段一通关自测",
    passScore: 3,
    requiredPracticeSeconds: 300,
    questions: [
      {
        id: "q1-1",
        scenario: "你按前臂时，指腹下有一根韧韧的“弦”，横向拨动会滚，抬手指时它会绷紧。",
        question: "这是什么组织？应该怎么处理？",
        options: [
          { id: "a", text: "痉挛的肌腹，应该用力按压揉开" },
          { id: "b", text: "伸肌肌腱，不是激痛点，不应揉压" },
          { id: "c", text: "骨性标志，可以作为定位基准" },
        ],
        correctOptionId: "b",
        explanation: "韧、可横向滚动、随手指活动绷紧 = 肌腱。肌腱不含激痛点，反复按压会损伤腱鞘。",
      },
      {
        id: "q1-2",
        scenario: "同伴说“你揉得我皮肤发烫像被擦伤”，但肌肉没有酸胀感。",
        question: "最可能的错误是什么？",
        options: [
          { id: "a", text: "频率太慢，应提高到 3 Hz" },
          { id: "b", text: "手在皮肤表面摩擦，没有带动皮肤做切向运动" },
          { id: "c", text: "压强太大，应该减到 VAS 1" },
        ],
        correctOptionId: "b",
        explanation: "掌揉的要点是皮肤随手一起移动。表面摩擦只产生热和刺激，不能激活深部鲁菲尼小体。",
      },
      {
        id: "q1-3",
        scenario: "揉了 30 秒，同伴说酸痛明显减轻，你松手后 2 分钟疼痛又回来了。",
        question: "最符合循证的解释是？",
        options: [
          { id: "a", text: "气血刚被揉开又堵回去了" },
          { id: "b", text: "Aβ 触觉输入暂时关闭了脊髓闸门，停止输入后闸门重新打开" },
          { id: "c", text: "揉得不够深，肌肉里的毒素没排出去" },
        ],
        correctOptionId: "b",
        explanation: "闸门控制理论解释的正是即时、短暂的镇痛：触觉输入持续时抑制存在，输入停止抑制减弱。",
      },
    ],
  },
};

/* ============================================================================
 * Stage 2：久坐族颈肩拯救 —— 斜方肌与肩胛提肌激痛点（45 分钟）
 * ========================================================================== */

const STAGE_2: Stage = {
  id: "stage-2",
  order: 2,
  title: "久坐族颈肩拯救",
  subtitle: "上斜方肌 TrP1/TrP2 · 肩胛提肌 · 缺血性按压 · 严禁颈椎旋转扳法",
  durationMinutes: 45,
  goals: [
    "用 C7 棘突、肩胛冈、肩峰三点定位上斜方肌游离缘，找到 TrP1 / TrP2 紧张带",
    "完成 45 s Hold / 15 s Release 缺血性按压 ×6 组，呼气时下沉",
    "用拿法（1 Hz）做泵血，消除按压后的酸胀",
    "明确：本课程全程禁止任何颈椎旋转、拔伸、扳动",
  ],
  relevantRedFlagIds: ["rf-vertebral-artery", "rf-radiating-numbness", "rf-osteoporosis", "rf-anticoagulant"],
  palpation: {
    title: "颈肩骨性三角与斜方肌激痛点导航",
    regions: ["neck-shoulder-posterior"],
    intro:
      "对象坐直、双手放在大腿上，头略前倾让 C7 突出。你站在身后。先找三个骨性标志搭建“三角”，激痛点就在三角的上边缘。",
    landmarks: [
      {
        id: "lm-c7",
        name: "C7 棘突（隆椎）",
        latin: "Processus spinosus C7",
        kind: "bone",
        region: "neck-shoulder-posterior",
        position: { x: 200, y: 72 },
        howToFind: [
          "让对象低头，颈根部最突出的一块骨头。",
          "验证：手指按住它，让对象慢慢仰头——C6 会往前“缩”回去，C7 基本不动。",
        ],
        feel: "硬、尖、位于正中线。",
        pitfalls: "肥胖或颈短者 T1 也很突出；用“仰头不动”法验证。",
      },
      {
        id: "lm-scapular-spine",
        name: "肩胛冈",
        latin: "Spina scapulae",
        kind: "bone",
        region: "neck-shoulder-posterior",
        position: { x: 292, y: 126 },
        howToFind: [
          "从肩峰（肩膀最外侧的骨头）向脊柱方向横着摸，一条斜向内下的骨嵴。",
          "它把肩胛骨分成上面的冈上窝和下面的冈下窝。",
        ],
        feel: "细长的骨性山脊，像一把横放的尺子。",
        pitfalls: "肩胛冈上方 1 指宽是冈上肌，不是斜方肌游离缘。",
      },
      {
        id: "lm-acromion",
        name: "肩峰",
        latin: "Acromion",
        kind: "bone",
        region: "neck-shoulder-posterior",
        position: { x: 340, y: 112 },
        howToFind: ["把手掌盖在肩膀最顶端，掌下最外侧的平台状骨头。", "它是上斜方肌的外侧止点。"],
        feel: "扁平、宽、位置最浅。",
        pitfalls: "不要和锁骨外端混淆（锁骨在前方、更圆）。",
      },
      {
        id: "lm-trap-trp1",
        name: "上斜方肌 TrP1（游离缘中点）",
        latin: "M. trapezius pars descendens, TrP1",
        kind: "triggerPoint",
        region: "neck-shoulder-posterior",
        position: { x: 256, y: 86 },
        howToFind: [
          "连接 C7 与肩峰的连线，上斜方肌游离缘就在这条线上方的肉嵴。",
          "拇指在前、四指在后，用“拿”的方式把肌肉捏起来，在连线中点附近来回捻。",
          "捻到一条像铅笔芯的硬条（紧张带），条上最痛、按下去会往同侧颈部和太阳穴放射的点就是 TrP1。",
        ],
        feel: "绳索样硬条上的一个豌豆大结节，按压时对象常会“啊”一声并感到头部牵涉痛。",
        pitfalls: "压得太靠前会压到锁骨上窝（臂丛、锁骨下动脉），这是禁区。",
      },
      {
        id: "lm-trap-trp2",
        name: "上斜方肌 TrP2（偏后偏外）",
        latin: "M. trapezius pars descendens, TrP2",
        kind: "triggerPoint",
        region: "neck-shoulder-posterior",
        position: { x: 276, y: 96 },
        howToFind: ["从 TrP1 向后、向外各滑 1–2 cm，仍在同一条紧张带上。", "牵涉痛更偏向乳突后方与颈后。"],
        feel: "与 TrP1 相似，通常稍小。",
        pitfalls: "两个点有时融合成一条，不必强求分开。",
      },
      {
        id: "lm-levator-insertion",
        name: "肩胛提肌止点（肩胛骨上角）",
        latin: "M. levator scapulae, angulus superior",
        kind: "triggerPoint",
        region: "neck-shoulder-posterior",
        position: { x: 240, y: 108 },
        howToFind: [
          "沿肩胛骨内侧缘向上摸到最顶端的角——肩胛骨上角。",
          "肩胛提肌像一根缆绳从这里斜向上连到 C1–C4。",
          "在上角上方 1 指处横向拨动，能摸到绷紧的条索，落枕时这里最痛。",
        ],
        feel: "比斜方肌更深、更细的条索，拨动时像拨琴弦。",
        pitfalls: "需要先用拇指把斜方肌推开才摸得到；不要用力戳上角骨面。",
      },
    ],
    selfCheck:
      "在同伴身上标出 C7、肩峰、肩胛骨上角三点，然后蒙眼只靠手指重新找到 TrP1，误差不超过 1 cm。",
  },
  practice: {
    title: "缺血性按压 + 拿法泵血 + 肩胛提肌弹拨",
    intro:
      "激痛点处理的顺序永远是：先静态按压打断能量危机循环，再用节律性手法把血泵回去。按压过程中让对象持续呼吸，不要憋气。",
    techniques: [
      {
        id: "t2-ischemic-compression",
        demo: "press",
        name: "激痛点缺血性按压",
        modernName: "Ischemic Compression 45 s / 15 s",
        summary:
          "拇指垂直压在 TrP1 上，保持 45 秒，松 15 秒，共 6 组。呼气时下沉一点，吸气时保持不动。",
        mechanics: {
          mode: "holdRelease",
          holdSeconds: 45,
          releaseSeconds: 15,
          targetDepth: 0.6,
          vas: { min: 4, max: 6 },
          direction: "perpendicular",
          neuroTarget: "打断终板—缺血—致敏循环；反应性充血；伤害感受器适应",
          breathing: { inhaleSeconds: 4, exhaleSeconds: 6, exhaleAction: "sink" },
          requiredSeconds: 360,
        },
        steps: [
          "拇指指腹放在 TrP1 上，另一只手扶住对象前额或肩前方做反向支撑。",
          "缓慢加压到对象报告 VAS 4–5（“有点疼但舒服”），进入 45 秒 Hold。",
          "每次对象呼气时，跟着呼吸引导圆圈下沉 1–2 mm；吸气时保持不动。",
          "Hold 中途若痛感自动降到 VAS 2–3（组织“释放”），可以再加深一点点回到 VAS 4。",
          "15 秒 Release 时完全松手，让反应性充血发生；可以看到皮肤先白后红。",
          "重复 6 组；如果第 3 组后痛感不再下降，换 TrP2。",
        ],
        handPosition: "拇指与前臂成一直线，用身体前倾施力；拇指指间关节不要过伸。",
        stopSignals: [
          "放射到手臂的麻电感（压到臂丛 → 立即松手、换位置更靠后）",
          "对象头晕、眼花、恶心（立即停止，这是血管红旗）",
          "疼痛超过 VAS 6 或对象屏住呼吸",
        ],
        literatureIds: ["lit-simons-2004", "lit-hou-2002", "lit-shah-2008"],
      },
      {
        id: "t2-pincer-pumping",
        demo: "pincer",
        name: "拿法泵血（节律性捏提）",
        modernName: "Pincer-Grip Rhythmic Pumping @ 1.0 Hz",
        summary:
          "拇指与四指把上斜方肌整条捏起、提起再放下，1 Hz 节律，像慢慢挤一块海绵，把按压后淤积的代谢物泵走。",
        mechanics: {
          mode: "rhythmic",
          frequencyHz: 1.0,
          targetDepth: 0.5,
          vas: { min: 2, max: 3 },
          direction: "tangential",
          neuroTarget: "肌肉泵 + 闸门控制镇痛 + 交感抑制",
          requiredSeconds: 120,
        },
        steps: [
          "拇指在前、四指在后，把上斜方肌游离缘整条“拿”在手里。",
          "每一拍：捏紧（50% 形变）→ 向上提起 1 cm → 松开，一拍一个周期。",
          "从 C7 侧向肩峰侧走，每拍移动 1–2 cm，到肩峰再回来。",
          "连续 2 分钟，力度保持在“舒服的酸”（VAS 2–3）。",
        ],
        handPosition: "手掌张开呈 C 形，用整个指腹而不是指尖捏；肩膀放松，别耸肩。",
        stopSignals: ["捏出淤青样疼痛", "对象说“掐”（说明用了指尖）"],
        literatureIds: ["lit-melzack-1965", "lit-schleip-2003"],
      },
      {
        id: "t2-levator-strum",
        demo: "strum",
        name: "肩胛提肌条索横向弹拨",
        modernName: "Transverse Friction / Strumming @ 1.0 Hz",
        summary: "在肩胛骨上角上方找到肩胛提肌条索，拇指垂直于肌纤维方向横向拨动，1 Hz。",
        mechanics: {
          mode: "strum",
          frequencyHz: 1.0,
          targetDepth: 0.5,
          vas: { min: 3, max: 5 },
          direction: "transverse",
          neuroTarget: "触变性剪切 + 局部充血 + 帕奇尼小体",
          requiredSeconds: 90,
        },
        steps: [
          "拇指把斜方肌向外推开，沉到下方的肩胛提肌条索。",
          "肌纤维走向是从肩胛骨上角斜向上内，所以拨动方向是“横着”——与条索垂直。",
          "每拍拨过条索一次，像拨吉他弦；力度 VAS 3–5。",
          "每侧 45 秒，结束后让对象缓慢做 5 次耸肩放下。",
        ],
        handPosition: "拇指指腹侧面着力，手腕做小幅度桡偏尺偏，不要用拇指关节硬掰。",
        stopSignals: ["向头顶的剧烈放射痛", "拨动时有“咔嗒”弹响伴剧痛（可能压到神经）"],
        literatureIds: ["lit-stecco-2011", "lit-simons-2004"],
      },
    ],
    forbidden: [
      "任何形式的颈椎旋转扳法、拔伸、“掰脖子”（椎动脉与颈动脉夹层风险）",
      "按压锁骨上窝（臂丛与锁骨下动脉）",
      "按压颈前侧（颈动脉窦）",
      "在对象报告头晕时继续操作",
    ],
  },
  literature: pick("lit-simons-2004", "lit-schleip-2003", "lit-shah-2008", "lit-hou-2002"),
  quiz: {
    title: "阶段二通关自测",
    passScore: 3,
    requiredPracticeSeconds: 570,
    questions: [
      {
        id: "q2-1",
        scenario: "同伴落枕，转头受限。他说“你帮我把脖子掰一下，听到响就好了”。",
        question: "正确的做法是？",
        options: [
          { id: "a", text: "小心地快速旋转颈椎，听到弹响即可" },
          { id: "b", text: "拒绝旋转扳法；先做红旗筛查，再处理肩胛提肌与上斜方肌激痛点" },
          { id: "c", text: "先热敷再做慢速旋转" },
        ],
        correctOptionId: "b",
        explanation: "颈椎旋转扳法与椎动脉夹层相关，本课程绝对禁止。落枕的主要责任肌是肩胛提肌，用按压与弹拨处理。",
      },
      {
        id: "q2-2",
        scenario: "缺血性按压 TrP1 到第 20 秒，同伴说手臂外侧突然麻、像过电。",
        question: "你应该？",
        options: [
          { id: "a", text: "坚持到 45 秒，麻是激痛点释放的表现" },
          { id: "b", text: "立即松手，重新定位到更靠后的位置，避开锁骨上窝方向" },
          { id: "c", text: "加大力度冲过去" },
        ],
        correctOptionId: "b",
        explanation: "麻电感 = 压到臂丛神经，不是激痛点牵涉痛。牵涉痛是酸胀、放射到头颈，不是电击感。",
      },
      {
        id: "q2-3",
        scenario: "按压 45 秒松手后，皮肤先发白，几秒后变得比周围更红。",
        question: "这说明什么？",
        options: [
          { id: "a", text: "压伤了毛细血管，应该停止" },
          { id: "b", text: "反应性充血：按压阻断的血流在释放后涌回，正是我们想要的" },
          { id: "c", text: "按压位置偏了，没找到激痛点" },
        ],
        correctOptionId: "b",
        explanation: "缺血性按压的设计就是“先缺血后充血”，充血带来氧气并冲刷致敏物质。皮肤红晕数分钟内消退属正常。",
      },
    ],
  },
};

/* ============================================================================
 * Stage 3：慢性下背痛核心解法 —— 胸腰筋膜与竖脊肌解痉（45 分钟）
 * ========================================================================== */

const STAGE_3: Stage = {
  id: "stage-3",
  order: 3,
  title: "慢性下背痛核心解法",
  subtitle: "胸腰筋膜滑动性 · 竖脊肌解痉 · 掌根剪切推法 · GTO 牵拉",
  durationMinutes: 45,
  goals: [
    "用髂嵴、髂后上棘、L4 棘突三点建立腰部坐标，避开肾区与脊柱棘突",
    "完成掌根慢速剪切推法（0.5 Hz）10 分钟，感受组织由“粘”变“滑”",
    "用横向弹拨处理竖脊肌条索，再用 GTO 被动牵拉完成解痉",
    "理解指南立场：手法是让人“动起来”的桥梁，运动才是慢性腰痛的一线治疗",
  ],
  relevantRedFlagIds: ["rf-cauda-equina", "rf-radiating-numbness", "rf-systemic", "rf-osteoporosis"],
  palpation: {
    title: "腰部坐标系与胸腰筋膜导航",
    regions: ["lumbar-posterior"],
    intro:
      "对象俯卧，腹下垫薄枕让腰部放平。你站在对象一侧，操作对侧腰部（手法要从你这边推向对侧，便于用体重）。先搭坐标，再找筋膜与肌肉。",
    landmarks: [
      {
        id: "lm-iliac-crest",
        name: "髂嵴",
        latin: "Crista iliaca",
        kind: "bone",
        region: "lumbar-posterior",
        position: { x: 272, y: 214 },
        howToFind: [
          "双手叉腰，拇指向后——掌下最高的骨缘就是髂嵴。",
          "两侧髂嵴最高点的连线通过 L4 棘突（Tuffier 线）。",
        ],
        feel: "弧形骨缘，皮下清楚，向后内延伸到髂后上棘。",
        pitfalls: "髂嵴上方 2–3 指宽是腰方肌和肾区，不要在那里深压。",
      },
      {
        id: "lm-psis",
        name: "髂后上棘（PSIS）",
        latin: "Spina iliaca posterior superior",
        kind: "bone",
        region: "lumbar-posterior",
        position: { x: 230, y: 246 },
        howToFind: [
          "沿髂嵴向后内侧滑到尽头，一个圆钝的骨性凸起，表面常有小酒窝（Venus dimple）。",
          "两侧 PSIS 连线约过 S2。",
        ],
        feel: "圆钝、硬，像埋在肉里的核桃。",
        pitfalls: "骶髂关节就在 PSIS 内下方，不是本阶段操作对象。",
      },
      {
        id: "lm-l4-spinous",
        name: "L4 棘突",
        latin: "Processus spinosus L4",
        kind: "bone",
        region: "lumbar-posterior",
        position: { x: 200, y: 208 },
        howToFind: ["从两侧髂嵴最高点画一条横线，正中线上被横线穿过的骨突。", "向上数到 L1，向下到 L5、骶骨。"],
        feel: "正中线上一排硬结节，每个之间有指尖宽的凹陷。",
        pitfalls: "棘突本身是绝对不推不压的区域，它只是坐标。",
      },
      {
        id: "lm-erector-spinae",
        name: "竖脊肌（腰段）",
        latin: "M. erector spinae, pars lumbalis",
        kind: "muscle",
        region: "lumbar-posterior",
        position: { x: 236, y: 132 },
        howToFind: [
          "棘突旁开 2–3 指宽，一条纵向的肉柱。",
          "让对象把头和肩膀抬离床面 2 cm，肉柱会明显鼓起——那就是竖脊肌。",
          "放松后在肉柱上纵向滑动，找到局部变硬、按压酸胀的“条索”段。",
        ],
        feel: "放松时像充气不足的气球，痉挛段像一根埋在里面的绳子。",
        pitfalls: "条索往往比棘突旁更靠外 1 指；按住棘突旁的肌肉问“哪里最酸”是最快的定位法。",
      },
      {
        id: "lm-thoracolumbar-fascia",
        name: "胸腰筋膜（菱形区）",
        latin: "Fascia thoracolumbalis",
        kind: "fascia",
        region: "lumbar-posterior",
        position: { x: 200, y: 160 },
        howToFind: [
          "以 L1 为顶、两侧 PSIS 为底角的菱形区，筋膜在此最厚、最浅。",
          "用整个手掌压住皮肤，向头侧“推”——健康的筋膜应该能带着皮肤滑动 1–2 cm；久坐者往往只能滑几毫米且发涩。",
        ],
        feel: "像一张铺在肌肉上的厚帆布；致密化时手掌推不动、有“粘住”的阻力感。",
        pitfalls: "滑动性测试用手掌整体施力，不是用手指抠。",
      },
    ],
    selfCheck: "蒙眼在同伴腰部标出 L4、两侧 PSIS 并画出胸腰筋膜菱形区，再用手掌测试并口述左右两侧滑动性差异。",
  },
  practice: {
    title: "掌根剪切推法 + 竖脊肌弹拨 + GTO 牵拉",
    intro:
      "顺序：先用慢速剪切推法给筋膜“升温解冻”，再处理肌肉条索，最后用牵拉把解痉效果锁定。全程避开棘突、肾区（第 12 肋下）。",
    techniques: [
      {
        id: "t3-shear-glide",
        demo: "shear",
        name: "掌根慢速剪切推法（触变升温模式）",
        modernName: "Slow Shear Glide @ 0.5 Hz (Thixotropy)",
        summary:
          "掌根压实胸腰筋膜，带着皮肤和浅层组织向头侧慢推再回位，一个周期 2 秒（0.5 Hz），摩擦升温 + 剪切力让透明质酸“变稀”。",
        mechanics: {
          mode: "rhythmic",
          frequencyHz: 0.5,
          targetDepth: 0.4,
          vas: { min: 2, max: 4 },
          direction: "tangential",
          neuroTarget: "透明质酸触变性 + 鲁菲尼小体 + 筋膜滑动恢复",
          requiredSeconds: 300,
        },
        steps: [
          "站在对象一侧，双掌叠放，掌根压在对侧竖脊肌外缘的筋膜上（棘突旁开 3 指）。",
          "沉到 40% 形变，然后随节拍向头侧推 3–5 cm——皮肤、浅筋膜一起走，掌下有“拖着一块布”的阻力感。",
          "回程不离开皮肤，轻轻带回起点。一推一回正好一拍（2 秒）。",
          "每 1 分钟向外或向下移动一掌宽，覆盖整个菱形区。",
          "持续 5 分钟后再做一次滑动性测试，应能感到明显变“滑”和局部发热。",
        ],
        handPosition: "肘伸直，肩膀位于手的正上方，用身体前倾而不是手臂推；手指自然翘起不触碰皮肤。",
        stopSignals: ["皮肤被搓红发烫但深层无变化（说明没压实）", "对象腰部出现向腿部的放射痛", "对象说“像在搓澡”"],
        literatureIds: ["lit-stecco-2011", "lit-schleip-2003", "lit-langevin-2005"],
      },
      {
        id: "t3-erector-strum",
        demo: "strum",
        name: "竖脊肌条索横向弹拨",
        modernName: "Transverse Strumming of Erector Spinae @ 1.0 Hz",
        summary: "拇指或叠指在痉挛条索上横向（内外方向）拨动，垂直于纵向走行的肌纤维，1 Hz。",
        mechanics: {
          mode: "strum",
          frequencyHz: 1.0,
          targetDepth: 0.5,
          vas: { min: 3, max: 5 },
          direction: "transverse",
          neuroTarget: "条索机械解离 + 帕奇尼小体 + 局部充血",
          requiredSeconds: 120,
        },
        steps: [
          "定位条索段（通常 L3–L5 水平，棘突旁开 3–4 指）。",
          "双拇指并排压在条索外侧，沉到 50%。",
          "每一拍把条索从外向内“拨”过去，拇指感受条索在下面滚动，然后回位。",
          "每段条索 60 秒，不超过 2 段；结束后让对象俯卧放松 30 秒。",
        ],
        handPosition: "双拇指并排或一手叠在另一手拇指上加力，前臂与拨动方向一致。",
        stopSignals: ["按压诱发下肢放射痛或麻木（立即停止，转红旗）", "条索越拨越硬（保护性痉挛，改回剪切推法）"],
        literatureIds: ["lit-stecco-2011", "lit-simons-2004"],
      },
      {
        id: "t3-gto-stretch",
        demo: "stretch",
        name: "竖脊肌被动牵拉（GTO 自身抑制）",
        modernName: "Sustained Passive Stretch 30 s / 10 s",
        summary:
          "对象仰卧抱膝（或儿童式），你在膝盖上方轻轻加压让腰部屈曲，保持 30 秒松 10 秒 ×4，呼气时再多弯一点。",
        mechanics: {
          mode: "holdRelease",
          holdSeconds: 30,
          releaseSeconds: 10,
          targetDepth: 0.3,
          vas: { min: 2, max: 3 },
          direction: "longitudinal",
          neuroTarget: "高尔基腱器官（Ib 传入）自身抑制 + 成纤维细胞机械转导",
          breathing: { inhaleSeconds: 4, exhaleSeconds: 6, exhaleAction: "sink" },
          requiredSeconds: 160,
        },
        steps: [
          "对象仰卧，双手抱住双膝贴向胸口；你一手扶膝、一手轻托骶骨。",
          "缓慢加压到腰部有“拉开”的感觉（VAS 2–3，不是疼），开始 30 秒 Hold。",
          "每次对象呼气时顺势多推 1 cm；吸气时保持。",
          "10 秒 Release 时把膝盖放回一半，不完全放平。",
          "4 组后让对象侧身起床，站立做 3 次缓慢前屈，感受活动度变化。",
        ],
        handPosition: "用手掌面整体接触，不要用手指抓膝盖；你的脊柱保持中立。",
        stopSignals: ["出现放射性腿痛或麻木", "对象憋气、面部发紧（说明牵拉过度）", "腰部出现尖锐疼痛"],
        literatureIds: ["lit-langevin-2005", "lit-acp-2017"],
      },
    ],
    forbidden: [
      "任何腰椎旋转扳法、“斜扳”",
      "直接按压棘突或椎间隙",
      "第 12 肋下方（肾区）的深压",
      "出现下肢放射症状后继续任何手法",
    ],
  },
  literature: pick("lit-stecco-2011", "lit-acp-2017", "lit-langevin-2005"),
  quiz: {
    title: "阶段三通关自测",
    passScore: 3,
    requiredPracticeSeconds: 580,
    questions: [
      {
        id: "q3-1",
        scenario: "同伴腰酸 3 个月，做完剪切推法后说舒服多了，问“以后每天让你推就好了吧？”",
        question: "最符合 ACP 2017 指南的回答是？",
        options: [
          { id: "a", text: "对，慢性腰痛就靠按摩维持" },
          { id: "b", text: "手法用来降低疼痛让你能动起来，长期首选是运动、瑜伽/太极等主动训练" },
          { id: "c", text: "应该尽快吃止痛药和肌松剂" },
        ],
        correctOptionId: "b",
        explanation: "指南对慢性腰痛的一线推荐是运动与多学科康复等主动手段；手法是辅助与桥梁。",
      },
      {
        id: "q3-2",
        scenario: "推法做了 2 分钟，对象皮肤发红发烫，但你手掌下的“粘”感一点没变。",
        question: "最可能的问题？",
        options: [
          { id: "a", text: "推得太慢，应该提高到 2 Hz" },
          { id: "b", text: "没有压实到筋膜层，只在皮肤表面摩擦；应该沉到 40% 形变再带着组织走" },
          { id: "c", text: "透明质酸需要 20 分钟才会变化，继续等" },
        ],
        correctOptionId: "b",
        explanation: "触变性需要剪切力作用在筋膜层间；只有压实并带着组织移动，剪切才能传递到透明质酸层。",
      },
      {
        id: "q3-3",
        scenario: "弹拨竖脊肌条索时，对象突然说右小腿外侧发麻。",
        question: "你应该？",
        options: [
          { id: "a", text: "换成更轻的手法继续" },
          { id: "b", text: "立即停止所有手法，这是神经放射红旗征，建议就医评估" },
          { id: "c", text: "改做 GTO 牵拉，拉开神经" },
        ],
        correctOptionId: "b",
        explanation: "下肢放射性麻木提示神经根受累，属于阻断级红旗征；任何手法（包括牵拉）都应停止。",
      },
    ],
  },
};

/* ============================================================================
 * Stage 4：运动后排酸与助眠调节 —— 下肢泵血与迷走神经激活（30 分钟）
 * ========================================================================== */

const STAGE_4: Stage = {
  id: "stage-4",
  order: 4,
  title: "运动后恢复与助眠调节",
  subtitle: "小腿三头肌向心引流 · 顺时针摩腹 · 迷走神经激活 · HRV",
  durationMinutes: 30,
  goals: [
    "完成 10 分钟小腿三头肌向心性挤压引流，缓解 DOMS",
    "用 0.5 Hz 顺时针摩腹 + 延长呼气，把心率带下来",
    "理解“排酸”是传统叫法：真正机制是抑制炎症信号与激活副交感",
    "掌握深静脉血栓与腹部禁忌的识别",
  ],
  relevantRedFlagIds: ["rf-dvt", "rf-abdominal", "rf-anticoagulant", "rf-skin"],
  palpation: {
    title: "小腿三头肌与腹部摩腹路径导航",
    regions: ["calf-posterior", "abdomen-anterior"],
    intro:
      "小腿部分对象俯卧、脚踝垫枕；腹部部分对象仰卧、屈膝放松腹肌。先确认没有 DVT 体征（单侧肿胀、发热、深压痛）。",
    landmarks: [
      {
        id: "lm-gastrocnemius",
        name: "腓肠肌内外侧头",
        latin: "M. gastrocnemius, caput mediale / laterale",
        kind: "muscle",
        region: "calf-posterior",
        position: { x: 200, y: 112 },
        howToFind: [
          "让对象踮脚（俯卧时绷脚尖），小腿后方鼓起的两块“心形”肌肉。",
          "两块之间的纵沟就是内外侧头的分界。",
        ],
        feel: "收缩时像两块硬馒头，放松时饱满有弹性。运动后 DOMS 时压痛弥漫。",
        pitfalls: "腘窝（膝后方凹陷）有腘动脉与胫神经，是禁区，引流到腘窝下方 3 指处就停。",
      },
      {
        id: "lm-soleus",
        name: "比目鱼肌",
        latin: "M. soleus",
        kind: "muscle",
        region: "calf-posterior",
        position: { x: 200, y: 186 },
        howToFind: ["在腓肠肌下方、跟腱上方，从两侧探入腓肠肌深层。", "屈膝 90° 再踮脚时，腓肠肌松弛而比目鱼肌仍收缩，可借此区分。"],
        feel: "扁平宽阔，比腓肠肌更深更韧。",
        pitfalls: "比目鱼肌的 DOMS 往往比腓肠肌更明显但更深，用掌根而非拇指。",
      },
      {
        id: "lm-achilles",
        name: "跟腱",
        latin: "Tendo calcaneus",
        kind: "muscle",
        region: "calf-posterior",
        position: { x: 200, y: 254 },
        howToFind: ["脚跟上方那根粗绳。", "引流手法从这里开始向上。"],
        feel: "粗、韧、像一根缆绳；不应有局部增粗结节。",
        pitfalls: "跟腱本身不揉压，只作为引流起点。",
      },
      {
        id: "lm-popliteal",
        name: "腘窝（禁压区）",
        latin: "Fossa poplitea",
        kind: "bone",
        region: "calf-posterior",
        position: { x: 200, y: 44 },
        howToFind: ["膝关节后方的菱形凹陷。", "引流到此处下方 3 指时手必须抬起。"],
        feel: "柔软凹陷，可触到腘动脉搏动。",
        pitfalls: "压迫腘窝可能损伤血管神经，也是 DVT 好发位置。",
      },
      {
        id: "lm-umbilicus",
        name: "脐（摩腹中心）",
        latin: "Umbilicus",
        kind: "bone",
        region: "abdomen-anterior",
        position: { x: 200, y: 150 },
        howToFind: ["仰卧，肚脐即圆心。", "摩腹路径是以脐为中心、半径约一掌的圆。"],
        feel: "不适用。",
        pitfalls: "有脐疝者禁做。",
      },
      {
        id: "lm-colon-path",
        name: "结肠走行（升→横→降）",
        latin: "Colon ascendens → transversum → descendens",
        kind: "fascia",
        region: "abdomen-anterior",
        position: { x: 128, y: 120 },
        howToFind: [
          "从对象右下腹（你看过去是左下方）开始：升结肠在右侧向上。",
          "到肋弓下转为横结肠向左。",
          "左侧降结肠向下到左下腹。这就是顺时针方向。",
        ],
        feel: "放松腹壁下偶可触到柔软可移动的肠管，不应有硬块。",
        pitfalls: "顺时针是以对象为主体（对象的右侧→上→左侧），不是你看过去的方向。",
      },
      {
        id: "lm-asis",
        name: "髂前上棘（ASIS）",
        latin: "Spina iliaca anterior superior",
        kind: "bone",
        region: "abdomen-anterior",
        position: { x: 118, y: 222 },
        howToFind: ["腹部两侧最前方的骨突，裤腰带最容易卡住的地方。", "两侧 ASIS 之间是摩腹范围的下界。"],
        feel: "硬、尖、表浅。",
        pitfalls: "ASIS 内侧有股外侧皮神经，不要压。",
      },
    ],
    selfCheck: "在同伴身上标出腘窝禁压区与引流终点，再用手掌在腹部走一圈并口述对象自身的顺时针方向。",
  },
  practice: {
    title: "向心引流 + 顺时针摩腹 + 迷走激活",
    intro:
      "本阶段力度最轻、速度最慢。目标不是“按透”而是提供持续 10 分钟中等压力、可预期的输入，让副交感神经接管。关灯、调暗屏幕效果更好。",
    techniques: [
      {
        id: "t4-calf-drainage",
        demo: "drain",
        name: "小腿三头肌向心性挤压引流",
        modernName: "Centripetal Compression Drainage @ 1.0 Hz",
        summary: "双手环握小腿，从跟腱上方开始每拍挤压一次并向膝方向移动 2 cm，到腘窝下 3 指抬手回到起点。",
        mechanics: {
          mode: "rhythmic",
          frequencyHz: 1.0,
          targetDepth: 0.4,
          vas: { min: 2, max: 3 },
          direction: "centripetal",
          neuroTarget: "机械转导抑制 NF-κB + 静脉淋巴回流 + 闸门控制",
          requiredSeconds: 300,
        },
        steps: [
          "对象俯卧，脚踝下垫枕让小腿肌肉完全放松。",
          "双手虎口相对环握小腿最下端（跟腱上方）。",
          "每一拍：挤压（40% 形变）→ 保持挤压向膝方向滑 2 cm → 松开一半。",
          "到达腘窝下 3 指处抬手，轻抚回到起点，重新开始。一趟约 10 拍。",
          "每条腿 5 分钟；中等压力——“有分量但不疼”。",
        ],
        handPosition: "手掌面整体包裹，手指并拢不抓；前臂与小腿平行，用身体重心前后移动带动。",
        stopSignals: ["单侧小腿发热、肿胀、深压剧痛（DVT 红旗，立即停止）", "压痛点出现明显皮下硬块", "对象说“抽筋”"],
        literatureIds: ["lit-crane-2012", "lit-guo-2017"],
      },
      {
        id: "t4-abdominal-clockwise",
        demo: "circle",
        name: "腹部顺时针摩腹（躯体—内脏反射）",
        modernName: "Clockwise Abdominal Effleurage @ 0.5 Hz",
        summary: "手掌平放在脐周，沿升→横→降结肠方向画圆，一圈 2 秒（0.5 Hz），压力只到“腹壁轻轻下陷”。",
        mechanics: {
          mode: "rhythmic",
          frequencyHz: 0.5,
          targetDepth: 0.2,
          vas: { min: 0, max: 2 },
          direction: "clockwise",
          neuroTarget: "躯体—内脏反射 + 副交感（迷走）激活 + HRV 提升",
          breathing: { inhaleSeconds: 4, exhaleSeconds: 6, exhaleAction: "hold" },
          requiredSeconds: 300,
        },
        steps: [
          "对象仰卧屈膝，你坐在对象右侧（便于顺时针）。",
          "手掌平贴脐周，掌心温热后再开始。",
          "以脐为圆心、一掌宽为半径，顺着对象的右下→右上→左上→左下画圆，一圈 2 秒。",
          "压力让腹壁下陷约 1–2 cm（20%），不要顶到肠管。",
          "引导对象用 4 秒吸气 / 6 秒呼气的节律呼吸，你的圆圈不随呼吸改变速度。",
          "持续 5 分钟；多数人在第 3 分钟心率会明显放慢、肠鸣音出现。",
        ],
        handPosition: "手腕放松，肩膀下沉；另一只手可轻放在对象胸骨下方作为“锚”。",
        stopSignals: ["腹部出现尖锐疼痛或反跳痛", "对象恶心", "触到搏动性包块（立即停止，腹主动脉瘤红旗）"],
        literatureIds: ["lit-sinclair-2011", "lit-diego-field-2009"],
      },
      {
        id: "t4-vagal-slow-stroke",
        demo: "stroke",
        name: "背部慢速中压轻抚（助眠收尾）",
        modernName: "Slow Moderate-Pressure Stroking @ 0.25 Hz",
        summary: "对象俯卧，双手从颈根沿竖脊肌向下滑到骶骨，一趟 4 秒（0.25 Hz），中等压力，收尾时逐渐减轻。",
        mechanics: {
          mode: "rhythmic",
          frequencyHz: 0.25,
          targetDepth: 0.3,
          vas: { min: 1, max: 2 },
          direction: "tangential",
          neuroTarget: "C 触觉纤维 + 鲁菲尼小体 + 迷走张力（HRV ↑、δ 波 ↑）",
          breathing: { inhaleSeconds: 4, exhaleSeconds: 8, exhaleAction: "hold" },
          requiredSeconds: 180,
        },
        steps: [
          "双手平放在对象肩胛骨之间，手掌全接触。",
          "随节拍向下滑到骶骨，一趟正好一拍（4 秒），回程轻轻抬手回到起点。",
          "压力中等——皮肤与浅筋膜一起被带动，但不酸不疼。",
          "最后 1 分钟每趟减轻一点，直到只剩皮肤接触，然后停留 10 秒再离开。",
        ],
        handPosition: "手指并拢自然伸直，手掌贴合身体曲线；用腿部重心移动带动而不是弯腰。",
        stopSignals: ["对象出现寒战或起鸡皮疙瘩（压力过轻引起觉醒，加重一点）", "任何疼痛"],
        literatureIds: ["lit-diego-field-2009", "lit-schleip-2003"],
      },
    ],
    forbidden: [
      "DVT 任何疑似体征下的小腿挤压",
      "压迫腘窝",
      "孕期、术后 3 个月内、腹主动脉瘤病史的摩腹",
      "逆时针摩腹（与肠道蠕动方向相反）",
      "任何深压与疼痛性手法——本阶段目标是副交感激活",
    ],
  },
  literature: pick("lit-crane-2012", "lit-diego-field-2009", "lit-guo-2017", "lit-sinclair-2011"),
  quiz: {
    title: "阶段四通关自测",
    passScore: 3,
    requiredPracticeSeconds: 780,
    questions: [
      {
        id: "q4-1",
        scenario: "朋友跑完马拉松第二天让你帮忙“排乳酸”，并要求按得越重越好。",
        question: "最符合 Crane 2012 证据的做法是？",
        options: [
          { id: "a", text: "按越重乳酸排得越快" },
          { id: "b", text: "乳酸早已代谢完，按摩的价值在抑制炎症信号；用中等压力做 10 分钟向心引流即可" },
          { id: "c", text: "先排除深静脉血栓，然后按重一点把炎症挤走" },
        ],
        correctOptionId: "b",
        explanation: "Crane 等用肌肉活检证明按摩不改变乳酸与糖原，但显著降低 TNF-α/IL-6 并提升 PGC-1α。重压不是必要条件。",
      },
      {
        id: "q4-2",
        scenario: "引流时发现对象左小腿比右侧明显肿、摸起来发热，深压很痛，他说昨天刚坐了 12 小时飞机。",
        question: "你应该？",
        options: [
          { id: "a", text: "加强左腿引流帮助消肿" },
          { id: "b", text: "立即停止并建议急诊排查深静脉血栓" },
          { id: "c", text: "改做轻抚，避开最肿的地方" },
        ],
        correctOptionId: "b",
        explanation: "单侧肿胀 + 发热 + 深压痛 + 长途制动史 = DVT 典型表现，挤压可能导致血栓脱落造成肺栓塞。",
      },
      {
        id: "q4-3",
        scenario: "睡前给家人做背部轻抚，你用极轻的力道羽毛般掠过，对方说“有点痒、更清醒了”。",
        question: "按 Diego & Field 2009 应如何调整？",
        options: [
          { id: "a", text: "再轻一点，让他慢慢适应" },
          { id: "b", text: "加到中等压力——轻触引起交感觉醒，中等压力才激活迷走神经" },
          { id: "c", text: "加快速度到 2 Hz" },
        ],
        correctOptionId: "b",
        explanation: "实验显示轻压力按摩引起觉醒反应，中等压力才提高 HRV 与 δ 波；助眠手法必须“有分量但不疼”。",
      },
    ],
  },
};

/* ============================================================================
 * 课程树导出
 * ========================================================================== */

export const CURRICULUM: Curriculum = {
  title: "EvidenceTuina 循证推拿实验室",
  tagline: "解剖定位 → 安全筛查 → 物理参数化实操 → 机制文献内化",
  stages: [STAGE_1, STAGE_2, STAGE_3, STAGE_4],
};

export const STAGES: Stage[] = CURRICULUM.stages;

export function getStage(id: string): Stage | undefined {
  return STAGES.find((s) => s.id === id);
}

export function getTechnique(stageId: string, techniqueId: string) {
  return getStage(stageId)?.practice.techniques.find((t) => t.id === techniqueId);
}

/** 本阶段所有技术的达标秒数之和（用于地图进度与闯关校验） */
export function stageRequiredSeconds(stage: Stage): number {
  return stage.practice.techniques.reduce((acc, t) => acc + t.mechanics.requiredSeconds, 0);
}
