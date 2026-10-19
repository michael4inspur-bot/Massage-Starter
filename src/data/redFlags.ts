import type { RedFlagItem } from "@/types/tuina";

/**
 * 临床红旗征筛查清单（Red-Flag Safety Gate）
 * 依据：NICE NG59 / ACP 2017 腰痛指南的红旗征条目、
 *       IFOMPT 颈椎血管风险评估框架（2020）、
 *       以及按摩治疗的绝对/相对禁忌症共识。
 * severity = "block"：任一勾选即锁死实操面板。
 */
export const RED_FLAGS: RedFlagItem[] = [
  {
    id: "rf-acute-trauma",
    category: "trauma",
    question: "过去 48 小时内，这个部位有没有摔伤、撞伤、扭伤或剧烈拉伤？",
    rationale:
      "急性损伤期组织处于出血与炎症渗出高峰，任何按压都可能扩大出血、延迟愈合。",
    severity: "block",
    referral: "骨科 / 急诊：先影像学排除骨折与韧带撕裂，48–72 小时内遵循 PEACE & LOVE 原则。",
  },
  {
    id: "rf-fracture",
    category: "trauma",
    question: "是否怀疑骨折：局部畸形、肿胀发亮、一碰就剧痛、或者无法承重 / 无法抬起？",
    rationale: "疑似骨折时按压会造成骨折端移位，神经血管损伤风险极高。",
    severity: "block",
    referral: "骨科 / 急诊：X 线或 CT 确诊前严禁任何手法。",
  },
  {
    id: "rf-osteoporosis",
    category: "trauma",
    question: "是否确诊骨质疏松、长期服用糖皮质激素、或 65 岁以上近期有过轻微外力后的剧烈疼痛？",
    rationale: "骨密度下降时，日常按压力度即可造成脆性骨折（尤其是椎体和肋骨）。",
    severity: "block",
    referral: "骨科 / 内分泌科：先做 DXA 骨密度检查，再由治疗师决定可承受压强。",
  },
  {
    id: "rf-radiating-numbness",
    category: "neuro",
    question: "疼痛是否沿着手臂或腿一路放射，并伴随麻木、刺痛、肌肉无力或抓不住东西？",
    rationale: "放射性症状提示神经根受压（椎间盘突出 / 椎管狭窄），局部压迫可能加重神经水肿。",
    severity: "block",
    referral: "神经内科 / 骨科脊柱专科：需要神经功能评估与 MRI。",
  },
  {
    id: "rf-cauda-equina",
    category: "neuro",
    question: "最近是否出现大小便控制困难、会阴部（骑跨区）麻木、或双腿同时无力？",
    rationale: "马尾综合征是外科急症，延误 24–48 小时可造成永久性功能丧失。",
    severity: "block",
    referral: "立即急诊：这是需要紧急手术评估的情况，不要等待。",
  },
  {
    id: "rf-vertebral-artery",
    category: "vascular",
    question: "转头或抬头时是否出现眩晕、视物模糊、说话含糊、吞咽困难、面部麻木或突然摔倒？",
    rationale:
      "这组症状（5D3N）提示椎基底动脉供血不足或颈动脉夹层，颈部任何旋转或按压都可能诱发卒中。",
    severity: "block",
    referral: "神经内科 / 急诊：需血管影像学（CTA/MRA）评估。本课程全程禁止颈椎旋转扳法。",
  },
  {
    id: "rf-dvt",
    category: "vascular",
    question: "小腿是否有一侧肿胀、发热、发红、按压深部疼痛，或近期有长途飞行 / 术后卧床 / 服用避孕药史？",
    rationale: "深静脉血栓（DVT）被挤压可能脱落造成肺栓塞，危及生命。",
    severity: "block",
    referral: "急诊 / 血管外科：D-二聚体 + 下肢静脉超声，排除前禁止任何下肢挤压引流。",
  },
  {
    id: "rf-anticoagulant",
    category: "vascular",
    question: "是否正在服用抗凝药（华法林、利伐沙班等）或有血友病等出血倾向？",
    rationale: "抗凝状态下深层按压极易造成肌肉内血肿。",
    severity: "block",
    referral: "血液科 / 处方医生：确认 INR 或凝血指标后，由治疗师决定是否仅做浅层手法。",
  },
  {
    id: "rf-systemic",
    category: "systemic",
    question: "是否伴有发热、夜间痛醒、不明原因体重下降（半年 >5 公斤）、或有癌症病史？",
    rationale: "这些是脊柱感染、肿瘤或转移的红旗征，疼痛不是肌肉骨骼来源，手法无效且可能延误诊断。",
    severity: "block",
    referral: "内科 / 肿瘤科：需血常规、炎症指标与影像学检查。",
  },
  {
    id: "rf-abdominal",
    category: "visceral",
    question: "腹部是否有手术疤痕未满 3 个月、腹主动脉瘤病史、怀孕、或腹部触碰即剧痛（反跳痛）？",
    rationale: "摩腹直接作用于内脏，上述情况下可能造成伤口裂开、动脉瘤破裂或加重急腹症。",
    severity: "block",
    referral: "外科 / 产科：阶段四摩腹模块禁止，其余阶段请经医生同意后进行。",
  },
  {
    id: "rf-skin",
    category: "skin",
    question: "操作区域皮肤是否有破损、感染、皮疹、静脉曲张或不明肿块？",
    rationale: "皮肤屏障受损或局部感染时，按压会扩散感染或造成静脉损伤。",
    severity: "block",
    referral: "皮肤科 / 普外科：处理局部病变后再练习，可先换一个健康区域。",
  },
  {
    id: "rf-recent-injection",
    category: "general",
    question: "过去 7 天内该部位是否做过封闭注射、针刀或拔罐留下淤血？",
    rationale: "局部组织仍在修复，中等以上压强可能造成二次损伤。",
    severity: "caution",
    referral: "建议等待 7 天，或只做阶段一的轻压强标定练习（VAS ≤ 2）。",
  },
  {
    id: "rf-first-time",
    category: "general",
    question: "这是你第一次给自己 / 他人做按压练习吗？",
    rationale: "新手最常见的错误是压强过大。本课程所有参数均为上限，初次练习请取下限。",
    severity: "caution",
    referral: "无需转诊。请把每个手法的 VAS 目标降低 1 分开始。",
  },
];

export const BLOCKING_RED_FLAG_IDS: ReadonlySet<string> = new Set(
  RED_FLAGS.filter((f) => f.severity === "block").map((f) => f.id),
);
