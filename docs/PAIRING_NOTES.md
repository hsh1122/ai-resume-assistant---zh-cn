# 结对记录

## 用途

这个文件用于保存我们协作过程中的重要信息，只记录高价值内容，不记录完整聊天流水。

## 记录原则

- 只保留关键问题、关键结论、方案选择、学习目标和下一步动作。
- 优先保留对后续开发、复盘、面试表达有帮助的信息。
- 每一轮结束后可以继续追加新的中文摘要。

## 当前对话摘要

### 日期

2026-03-25

### 1. 用户最开始的问题

用户询问：这个项目接下来应该做什么。

### 2. 仓库现状检查结果

已完成的检查结论：

- Git 工作区是干净的，没有未提交改动。
- 前端 `npm run test` 通过。
- 前端 `npm run build` 通过。
- 后端 `.venv\\Scripts\\python.exe -m unittest tests.test_history_api` 通过。
- 当前项目已经具备一个可运行、可测试、可演示的小型全栈产品基础。

### 3. 对“下一步”的判断

当前最值得优先做的不是继续补基础设施，也不是盲目加新功能，而是提升 AI 简历优化结果本身的质量。

原因：

- 这个项目的核心价值在于“优化结果是否真的有帮助”。
- 如果输出内容不稳定、不真实、丢关键信息，再多界面优化也无法真正提升投递价值。
- 当前仓库已经比较稳定，适合进入“产品质量打磨”阶段。

### 4. 推荐的优先级顺序

最初建议的下一步顺序：

1. 先优化后端 Prompt，提高输出质量。
2. 再优化结果展示，让分析区更容易阅读。
3. 模式说明已经基本存在，不是当前最高优先级。

### 5. 用户关于“自己做还是助手接管”的问题

用户询问：第一步应该自己做，还是由助手直接接管。

建议结论：

- 推荐用户自己动手。
- 助手负责结对指导。

推荐原因：

- 第一阶段改动集中在一个核心文件里，学习成本低，收益高。
- 很适合作为一次 Prompt 工程优化练习。
- 更容易沉淀成你自己的项目经验，而不是“看助手改完”。

### 6. 用户的学习与求职目标

用户明确表示，希望把这次工作作为“Prompt 工程优化”的学习案例，并且未来可以用于找工作时的项目叙述和面试表达。

### 7. 方向选择

围绕“Prompt 工程优化”，推荐优先解决的问题是：

减少关键信息丢失，同时明确禁止虚构。

更具体地说，希望模型做到：

- 保留原简历中的真实事实。
- 更好地对齐 JD 关键词。
- 不为了显得更专业而编造经历、数据、头衔、技术栈或结果。

### 8. 为什么选这个方向

之所以先做这件事，而不是先改格式或展示，是因为：

- 这更符合真正的 Prompt 工程优化场景。
- 更容易讲成求职故事。
- 更容易验证效果。

这项工作特别适合表达为：

- 在招聘场景下控制 LLM 幻觉风险。
- 提高事实保留率与岗位匹配度。
- 把模糊的产品风险转成可执行、可验证的 Prompt 约束。

### 9. 方案讨论结果

讨论过三种思路：

1. 只加一句“不要编造内容”。
2. 把现有 Prompt 改成分层约束 Prompt。
3. 改成两阶段流程，先抽取事实，再生成优化版。

最终推荐方案：

- 采用第 2 种，也就是“分层 Prompt”。

原因：

- 效果更稳定。
- 改动范围适中。
- 最适合当前这一轮学习，不会把复杂度一下拉太高。

### 10. 这轮 Prompt 计划加入的核心约束

目标修改位置：

- `backend/app/services/ai_service.py`
- 重点函数：`_build_prompt(...)`

计划加入的核心内容：

- 角色定义：把模型设定为保守型、真实性优先的简历优化助手。
- 硬性约束：只能基于输入内容改写，不得补充未提供的经历或结果。
- 事实保留要求：优先保留学校、公司、项目名、技术栈、时间线、量化结果等信息。
- 重写目标：允许重组、突出重点、压缩低相关信息，但不允许虚构。
- 匹配分析要求：不仅说“匹配”，还要指出缺什么证据。
- 建议要求：输出要可执行，不能只是泛泛而谈。
- 输出契约：继续返回严格 JSON。

### 11. 约定的工程化做法

为了把这次 Prompt 调整做得更像工程实践，而不是临时改文案，约定使用一个很轻量的 TDD 思路：

1. 先写一个失败测试。
2. 再修改 `_build_prompt(...)`。
3. 再跑相关测试验证通过。

### 12. 已经约定的第一个测试

准备在 `backend/tests/test_history_api.py` 中的 `AiServiceCompatibilityTests` 里新增一个测试，用来检查 Prompt 是否包含以下关键约束：

- 不得编造事实。
- 要保留原简历中的重要事实。
- 要保留公司名、项目名、技术、日期、量化结果等关键信息。
- 匹配分析中要指出缺失证据。
- 只能返回严格 JSON。

### 13. 这一步为什么适合拿来讲给面试官

这一步可以作为一个很好的项目表达点，因为它体现了：

- 你不是“感觉上”在改 Prompt，而是在把风险转成明确约束。
- 你先控制真实性和幻觉问题，再追求语气和包装。
- 你知道在招聘类产品里，失真内容会直接影响用户信任和面试风险。

### 14. 可能被问到的问题与建议回答

#### 问题 1

为什么先测 Prompt，而不是直接观察模型输出？

建议回答：

我先写 Prompt 契约测试，是因为模型输出天然带有一定随机性。如果一上来只看生成结果，很容易把偶然表现当成稳定能力。先用测试锁定“禁止虚构、保留事实、指出证据缺口、返回严格 JSON”这些高价值约束，可以先保证底线，再做样例对比和人工评估。

#### 问题 2

你怎么定义 Prompt 变好了？

建议回答：

我主要看三类指标。第一类是事实保留，像学校、公司、项目、技术栈、量化结果有没有被保留。第二类是岗位对齐，看输出是否更贴近 JD 的关键词和重点要求。第三类是风险控制，看有没有新增用户没有提供的信息，或者把原本模糊的信息说得过于确定。对这个项目来说，真实性和针对性比文案华丽更重要。

#### 问题 3

你怎么防止模型为了匹配 JD 而编造内容？

建议回答：

我在 Prompt 里加了明确的硬约束，只允许模型基于输入内容重写，不允许补充未提供的经历、数字、头衔、技术或结果。同时我会要求模型在匹配分析里指出“已有证据”和“缺失证据”，这样模型更容易保持诚实表达，而不是为了显得匹配就自动补全背景。简单说，就是把“对齐岗位”限制在“重组和突出已有事实”的范围内，而不是扩写事实本身。

#### 问题 4

为什么不用更复杂的多阶段流程？

建议回答：

我考虑过两阶段方案，比如先抽取结构化事实，再基于事实生成优化版本，那样理论上更强。但这个项目当前是一个小型产品，我优先选择低复杂度、高收益的改法。先把单轮 Prompt 的真实性约束和输出稳定性做扎实，能更快验证价值，也更容易维护。如果后面发现单轮 Prompt 仍然不够稳，再升级成多阶段流程会更合理。

### 15. 用户新增的文件需求

用户提出希望新建一个文件，用来保存当前聊天页中的重要信息，只挑关键内容保存，便于以后回看。

因此做出的决定：

- 创建本文件作为“结对记录”。
- 使用中文保存。
- 只保留高价值摘要，不写成完整聊天记录。

### 16. 这一轮关于文件本身的调整

用户随后反馈：

- 希望把文件改成中文。
- 希望先把当前聊天页里已经发生的重要内容整理进去。
- 希望把“可能被问到的问题”对应的建议回答也一起写进文件里。

因此本文件已更新为中文摘要版，并补充了本轮对话中的核心信息与面试答法。

### 17. 当前下一步

当前最近的执行动作仍然是：

在 `backend/tests/test_history_api.py` 中补上第一个失败测试，然后再去修改 `backend/app/services/ai_service.py` 里的 `_build_prompt(...)`。

### 18. 本轮最新进展

本轮已经完成的动作：

- 在 `backend/tests/test_history_api.py` 中新增了一个针对 Prompt 关键约束的测试。
- 先运行单个测试，确认它会失败。
- 然后修改了 `backend/app/services/ai_service.py` 中的 `_build_prompt(...)`。
- 再次运行单个测试后，测试通过。
- 最后运行完整的 `tests.test_history_api`，共 8 个测试全部通过。

### 19. 关于测试输出里出现的报错日志

运行完整后端测试时，终端中出现了 `provider_authentication_failed` 和一段 `AuthenticationError` 堆栈。

这不是新的程序故障，而是测试里故意构造的一种场景：

- 用 mock 的方式模拟 AI 提供商认证失败。
- 验证后端是否会正确返回认证失败，而不是错误地回退成 mock 结果。
- 这条测试本来就会触发日志输出。

判断是否真正失败，应该看最后测试总结：

- `Ran 8 tests`
- `OK`

只要最后是 `OK`，就说明这一轮回归测试整体通过。

### 20. 这一轮可以怎么讲给面试官

可以表达为：

- 我先把 Prompt 优化的目标收敛成“保留事实、禁止虚构、提升 JD 对齐度”。
- 然后把这些要求写成测试，而不是只凭主观观察模型输出。
- 在新增测试失败后，我再调整 Prompt，把真实性和缺失证据分析等约束加入提示词。
- 最后我跑了整个相关后端测试集，确认这次 Prompt 调整没有破坏已有接口行为。

### 21. 这一轮的可提炼能力点

这一轮最值得沉淀的能力点包括：

- 能把模糊的 Prompt 优化目标转成可验证的测试约束。
- 理解招聘场景下真实性约束的重要性。
- 知道如何用小步快跑的方式迭代 Prompt，而不是一次性堆复杂流程。
- 有基本的回归验证意识，不会只让新增测试通过就结束。

### 22. 下一步建议

下一步可以继续做两个方向中的一个：

1. 继续补第二条测试，约束 `match_analysis` 和 `suggestions` 的输出质量。
2. 暂时先停下来，把这一轮整理成简历项目描述和面试口语表达。

### 23. 本轮可直接用于简历的表达

可作为项目经历的描述：

- 在 AI 简历助手项目中负责 Prompt 工程优化，围绕“保留事实、禁止虚构、提升 JD 对齐度”重构后端提示词，加入真实性约束、事实保留、缺失证据分析等分层指令，提升生成结果可信度。
- 采用测试驱动方式为 Prompt 增加契约测试，完成“失败测试 -> Prompt 调整 -> 回归验证”闭环，相关后端 8 项测试通过，确保优化未破坏既有接口行为。

更压缩的一条简历表述：

- 负责 AI 简历助手的 Prompt 工程优化，将真实性与事实保留要求转化为可测试约束，通过分层 Prompt 和回归测试降低生成内容的幻觉风险并提升岗位匹配质量。

### 24. 面试口语版

#### 30 秒版本

我当时发现这个简历助手虽然已经能生成内容，但模型为了贴近 JD，存在两个风险：一个是把候选人的关键信息压缩掉，另一个是过度改写甚至潜在虚构。所以我先做了一轮 Prompt 工程优化，没有直接凭感觉改文案，而是先把这些要求转成测试约束，比如禁止编造经历、保留项目名和量化结果、在分析里指出缺失证据。然后我按失败测试、修改 Prompt、回归验证的方式做完这轮优化，最后相关后端 8 个测试都通过了。

#### 1 分钟版本

这轮工作我主要做的是 Prompt 工程优化。背景是这个项目已经能跑起来了，但我判断核心问题不是再加功能，而是提升生成结果的可信度。因为在招聘场景里，如果模型把原简历的重要事实改没了，或者为了匹配 JD 自动补全经历，其实会直接影响用户信任，甚至影响面试风险。

所以我把目标收敛成三个点：保留事实、禁止虚构、提升 JD 对齐度。实现上我没有直接去反复试模型，而是先写了一个失败测试，要求 Prompt 里必须明确包含真实性约束、事实保留要求、缺失证据分析和严格 JSON 输出。测试失败后，我再去重构后端 `_build_prompt(...)`，把它改成分层 Prompt。最后我跑了完整后端测试，8 个测试都通过，说明这次 Prompt 优化没有破坏已有接口行为。这个过程让我比较明确地把 Prompt 调整做成了一个可验证、可复用的工程优化，而不是一次性的文案修改。

### 25. 面试追问短答

#### 如果被问：你怎么定义这次优化变好了？

建议回答：

我主要看三件事：事实保留、JD 关键词对齐、以及有没有出现用户没提供的信息。对这个场景来说，真实性和针对性比单纯文案更重要。

#### 如果被问：为什么先写测试？

建议回答：

因为模型输出有随机性，我先把关键底线约束写成测试，再去看生成效果，这样更工程化，也更容易复现和验证。

#### 如果被问：为什么不用两阶段流程？

建议回答：

我评估过，但当前项目是小型产品，所以我优先做低复杂度、高收益的改法，先把单轮 Prompt 的真实性和稳定性做扎实，后面如果还不够稳，再升级成更复杂的多阶段流程。

### 26. 面试 15 秒版本

如果只需要一句很短的表达，可以说：

我在这个 AI 简历助手里做了一轮 Prompt 工程优化，把“保留事实、禁止虚构、提升 JD 对齐度”转成可测试约束，再通过分层 Prompt 和回归测试把这轮优化落地，重点提升了招聘场景下生成内容的可信度。

### 27. 第二轮 Prompt 约束补强

在第一轮完成真实性和事实保留约束后，又继续做了第二个小闭环，重点补强：

- `match_analysis` 不只是泛泛说明匹配，而是要点出最强证据和最重要缺口。
- `suggestions` 必须基于已有简历和 JD 给出简历修改动作，而不是泛泛的求职建议。

这轮的工程动作是：

- 先新增一条失败测试。
- 测试约束 Prompt 中必须包含：
  - strongest matched evidence
  - most important gaps
  - suggestions only on the provided resume and job description
  - no generic job-search advice
  - highest-impact resume edits first
- 然后对 `_build_prompt(...)` 做最小增量修改。
- 最后重新跑完整后端测试。

### 28. 第二轮验证结果

验证结果如下：

- 新增的单测通过。
- 完整后端测试 `tests.test_history_api` 共 9 个测试全部通过。
- 终端中的 `provider_authentication_failed` 仍然是测试里故意模拟的认证失败场景，不代表本轮修改出错。

### 29. 第二轮可提炼的求职表达

这一轮可以进一步讲成：

- 我不是只优化 Prompt 的真实性，还进一步把“分析质量”和“建议质量”也约束成了可测试规则。
- 通过第二轮测试，我要求模型在分析里明确指出最强匹配证据和关键缺口，在建议里只输出高优先级、可落地的简历修改动作。
- 这使 Prompt 工程优化从“避免胡编”进一步提升到“输出更可用、更可执行”。

### 30. 用户对测试与 Prompt 关系的理解校正

用户提出的理解大体方向是对的，但需要补几个关键细节。

准确版结论如下：

- `backend/tests/test_history_api.py` 这个文件名本身不是必须的，关键不是“必须叫这个名字”，而是需要有某种自动化测试来验证 Prompt 约束。
- 测试本身不会参与线上运行逻辑，它的作用是帮助开发时检查：`ai_service.py` 里是否真的写入了我们想要的约束性提示词。
- 从这个角度说，测试确实可以理解成一种“额外保障”或“回归保护网”。
- `backend/app/services/ai_service.py` 里的 Prompt 才是运行时真正发给大模型的内容，它会直接影响模型更倾向输出什么样的结果。
- 但要注意，Prompt 对大模型的作用更准确地说是“引导和约束倾向”，不是 100% 的硬性保证。也就是说，Prompt 很核心，但不能理解成绝对控制。
- 所以更完整的理解应该是：
  - `ai_service.py` 里的 Prompt 是核心运行逻辑的一部分，负责引导模型输出。
  - 测试负责验证这些关键约束有没有被写进去，并防止以后改代码时不小心删掉或改坏。

可直接记住的一句话：

`Prompt 是运行时真正影响模型输出的核心指令，测试不是业务逻辑本身，但它负责验证这些核心指令有没有被正确写进去。`

### 31. 测试相关概念的白话定义

- 单元测试：测一个小功能。
- 断言：检查一个具体条件。
- 失败测试：先证明问题真的存在。
- 回归测试：确认旧功能没被改坏。
- TDD：先写测试，再写代码。

结合当前项目的例子：

- 单元测试：单独测试 `_build_prompt(...)` 这个小函数。
- 断言：比如检查 Prompt 里是否包含某一句关键约束。
- 失败测试：先写出“Prompt 里必须有某条规则”的测试，并先看到它失败。
- 回归测试：改完 Prompt 后，再运行整个 `tests.test_history_api`，确认历史接口和旧逻辑没有被带坏。
- TDD：先写失败测试，再最小修改 `_build_prompt(...)`，最后跑完整测试确认通过。

### 32. 用户的笔记偏好

用户明确提出：

- 像这种“学习过程中的疑问”和“概念理解上的追问”，以后也要默认写进笔记。
- 不只是记录做了什么改动，也要记录为什么这样做、哪些理解是对的、哪些地方需要修正。

后续记录原则补充为：

- 用户提出的重要疑问，默认加入 `PAIRING_NOTES.md`。
- 对于理解正确的部分，记录成可复述的结论。
- 对于不够准确的部分，记录成“修正后的准确版”。

### 33. 为什么 `assertIn` 适合测 Prompt，但不适合直接测模型质量

核心结论：

- `assertIn` 本质上是在检查：某段固定文字是否真的出现在某个字符串里。
- 这很适合测 Prompt，因为 Prompt 是 `_build_prompt(...)` 返回的确定性字符串。
- 但它不适合直接测模型质量，因为模型质量通常不是“有没有某一句原话”这么简单，而是“意思是否正确、内容是否有洞察、结果是否稳定可用”。

更准确地说：

- Prompt 适合做字面级检查，因为它是代码直接拼出来的，可以明确要求某些约束必须出现。
- 模型输出不适合只靠 `assertIn` 判断质量，因为：
  - 同一个高质量意思可以有很多不同表达方式。
  - 关键词出现，不代表整体质量就高。
  - 某个固定句子没出现，也不代表输出就差。
  - 模型输出本身具有随机性和语义变化。

在当前项目中的理解可以记成：

- `assertIn` 适合检查：Prompt 里有没有写上“不要编造事实”“保留关键信息”“Style-specific guidance”等规则。
- `assertIn` 不适合直接判断：`match_analysis` 是否真的有洞察，`suggestions` 是否真的高质量，优化后的简历是否真的更好。

一句话总结：

`先用 assertIn 验证你有没有把正确的话告诉模型，再用样例评估、规则检查或人工评审去看模型最终做得好不好。`

### 34. 第三轮 Prompt 补强：让 style 真正生效

这一轮继续做了第三个小闭环，目标是让 `Professional / Concise / Achievement-Oriented` 不再只是一个标签，而是真正变成 Prompt 中的风格指令。

这轮采取的做法：

- 先新增失败测试，检查不同 style 下的 Prompt 是否包含不同写作指导。
- 测试覆盖了三类风格要求：
  - Professional：更正式、专业、平衡
  - Concise：更精炼，删除低优先级信息
  - Achievement-Oriented：更强调量化成果、责任承担和业务影响
- 然后在 `_build_prompt(...)` 中引入 style 到 guidance 的映射逻辑，再拼接进 Prompt。

### 35. 第三轮验证结果

用户运行了完整后端测试：

- 命令：`.venv\\Scripts\\python.exe -m unittest tests.test_history_api`
- 结果：`Ran 10 tests`
- 结果：`OK`

说明：

- 第三轮新增的 style 相关测试也已经包含在完整回归里，并且通过了。
- 中间出现的 `provider_authentication_failed` 仍然是测试里故意模拟的认证失败场景，不代表这轮修改有问题。

### 36. 第三轮可提炼的求职表达

这轮可以进一步讲成：

- 我把简历优化模式从“前端可选标签”推进成“后端 Prompt 的真实控制参数”。
- 通过 style-specific guidance，让不同模式在写作风格上有明确差异，而不是只在界面上展示不同名称。
- 这说明我不仅关注 Prompt 的真实性，也关注 Prompt 参数化与产品功能的一致性。

### 37. 第四轮 Prompt 补强：结构化分析与建议格式

这一轮继续补强 Prompt，目标是让输出不仅“真实、贴岗”，还要“更好读、更好用”。

新增约束重点：

- `match_analysis` 需要包含：
  - 最强匹配点
  - 最重要缺口
  - 总体匹配判断
- `suggestions` 需要：
  - 返回 3 到 5 条
  - 按优先级从高到低排序
  - 每条都是具体的简历修改动作

### 38. 第四轮中的回归教训

这一轮出现过一次很典型的回归问题：

- 新增测试先通过了。
- 但完整回归时，旧测试失败。
- 原因不是新测试写错，而是修改 Prompt 时把旧测试依赖的一句关键约束改没了。

这轮的关键学习点是：

- 新需求通过，不代表改动就是安全的。
- 回归测试的价值就在于发现“你为了满足新要求，是否不小心破坏了旧约束”。
- 修复方式应优先选择“最小兼容修复”，而不是推翻重写。

### 39. 第四轮验证结果

用户最终重新运行了完整后端测试：

- 命令：`.venv\\Scripts\\python.exe -m unittest tests.test_history_api`
- 结果：`Ran 12 tests`
- 结果：`OK`

说明：

- 第四轮新增的结构化分析和建议格式约束已经通过验证。
- 此前的真实性、风格、关键词对齐相关约束也都没有被破坏。
- 日志中的 `provider_authentication_failed` 仍然是测试里故意模拟的认证失败场景，不代表程序异常。

### 40. 这一轮可以怎么讲

这轮很适合拿来表达“我不仅会加 Prompt 约束，也会处理约束之间的兼容性”：

- 我把 Prompt 进一步做成结构化输出规范，要求匹配分析给出最强匹配点、关键缺口和总体判断，并要求修改建议按优先级输出具体动作。
- 在实现过程中，我通过回归测试发现新约束覆盖了旧约束，于是采用最小兼容修复，把新旧要求一起保留下来。
- 这体现的不只是 Prompt 优化能力，也包括回归意识和兼容性修复能力。

### 41. 手动真实样例验证结果

在后端接口手动验证中，用户使用真实样例调用了 `/api/optimize`，返回结果 `result_source=ai`，说明这次不是 mock，而是真实模型输出。

这次手动验证暴露了一个非常重要的问题：

- 测试虽然全部通过，但真实输出仍然出现了明显幻觉和事实偏移。

具体表现：

- `optimized_resume` 中出现了用户没有提供的内容，例如：
  - SQL proficiency
  - data analysis and database management
  - scalable applications
  - maintaining data integrity
  - actionable insights
- 同时，原始简历中的关键信息被弱化或丢失，例如：
  - 清华大学
  - 与产品和运营协作
  - 优化周报流程
  - 提升汇报效率
  - 参与后端接口开发和内部工具维护

`match_analysis` 里也继续放大了这种偏移：

- 它声称候选人“explicitly mentions Python and SQL proficiency”，但原始简历并没有写 SQL。
- 说明 Prompt 里的“不要硬塞不被简历支持的关键词”虽然写进去了，但真实模型仍未稳定遵守。

### 42. 这次手动验证带来的关键认识

这次验证非常适合记住的结论是：

- Prompt 单元测试通过，只能证明“约束写进去了”。
- 不能证明“模型一定会老老实实遵守这些约束”。
- 所以 Prompt 工程不能只做字符串级测试，还需要真实样例验证，必要时还要增加输出级评估。

一句话总结：

`测试保障的是 Prompt 契约，手动验证看到的才是模型真实行为。`

### 43. 用户在这一步形成的理解

用户提出并确认了一类很重要的学习问题：

- 为什么 `assertIn` 适合检查 Prompt，但不适合直接判断模型输出质量。

这次真实样例正好验证了这个问题：

- Prompt 里已经写了很多真实性约束。
- `assertIn` 测试也都通过了。
- 但模型仍然可能在真实输出中编造 SQL、数据库管理、业务优化成果等内容。

因此这一步可以作为一个非常典型的学习案例：

`Prompt 层验证通过，不代表模型层行为已经可靠。`

### 44. 下一步最值得做的事

基于这次真实样例，下一步最值得做的不是再加更多字符串级断言，而是：

- 针对真实输出里的幻觉问题，补一条“输出级”回归测试或至少建立固定样例评估标准。
- 继续强化 Prompt 中“不要把 JD 里的关键词当作候选人已有技能写回简历”这类约束。
- 必要时把流程升级成两阶段：
  - 先抽取候选人已提供的事实
  - 再基于这些事实重写简历

### 45. 用户对当前效果的真实反馈

用户在看到界面结果后明确表达了一个很重要的感受：

- “感觉还不如不加提示词约束。”

这个反馈非常有价值，因为它指出了 Prompt 工程里一个典型问题：

- 如果只不断增加“禁止做什么”的约束，而没有同时补足“应该怎么写”的正向目标，模型就可能变得过于保守。

当前界面结果体现出的现象是：

- `optimized_resume` 比之前更安全，没有继续明显乱编 SQL 等内容。
- 但它也几乎只是把原文保留下来，优化幅度偏小。
- `match_analysis` 和 `suggestions` 仍然是英文，不符合当前中文产品体验。
- 建议虽然比之前更靠谱，但仍然偏长、偏学术，不够像真实求职场景里的中文简历修改建议。

### 46. 这次反馈对应的准确结论

不能简单下结论说“提示词约束没用”，更准确的判断是：

- 约束确实起作用了，它降低了明显幻觉。
- 但我们当前 Prompt 还缺少足够强的“正向写作指令”，导致模型为了避免犯错而倾向于保守输出。

一句话总结：

`现在不是约束太多本身有问题，而是只有护栏，没有足够明确的驾驶方向。`

### 47. 由此得到的下一步优化思路

如果继续优化，重点不应只是继续加“不要做什么”，而是补充：

- 输出语言必须跟随输入语言，当前场景应输出中文。
- `optimized_resume` 要在保留事实的前提下，明确要求“重写表达、优化结构、增强岗位相关性”，而不是简单照抄原文。
- `match_analysis` 应更短、更清晰，最好按固定小结构输出。
- `suggestions` 应更像真实中文简历修改建议，简短、直接、可执行。

这个反馈本身也很适合作为学习结论保留：

`Prompt 工程不能只加限制，还要给模型清晰的正向写作目标，否则输出会变得安全但平庸。`

### 48. 基于真实反馈继续做的正向写作目标补强

基于“结果太保守、英文输出、不像真的优化过”的反馈，又继续做了一轮更偏正向目标的 Prompt 优化，新增要求包括：

- 输出语言跟随输入语言，中文输入时三段输出都应为中文。
- `optimized_resume` 不能只是轻微润色或照抄原文，而要在保留事实前提下重写和重排。
- `match_analysis` 要更短、更好扫读。
- `suggestions` 要写成简短、实用、和输入同语言的简历修改动作。

### 49. 基于真实反馈继续做的事实溯源补强

在继续手动验证时发现，模型虽然不再总是把 SQL 写进 `optimized_resume`，但仍然存在把 JD 缺口写回简历、或者把建议写成“去补你可能并不会的技能”的风险。

为此又补强了这些规则：

- `optimized_resume` 必须把简历视为唯一事实来源。
- 不允许把 JD 要求直接改写成候选人已有能力。
- 如果某个关键词只出现在 JD 而不在简历里，不能写进 `optimized_resume`。
- 当证据不足时，措辞要保守。
- 对于缺失技能，建议必须写成条件式：
  - 如果你确实有这项经验，就补证据
  - 否则不要声称自己有

### 50. 参数层优化

除了 Prompt 约束，还新增了一条测试并完成了一个参数层优化：

- 将 `optimize_resume(...)` 调用模型时的 `temperature` 从 `0.7` 降到了 `0.2`

目的：

- 降低模型自由发挥和胡乱扩写的概率
- 让它更倾向于遵守给定 Prompt 约束

### 51. 当前自动化验证状态

本轮新增与补强之后，完整后端测试结果为：

- `Ran 17 tests`
- `OK`

这说明目前围绕 Prompt 的契约测试、参数测试和兼容性回归都已经通过。

### 52. 当前真实效果判断

目前可以得出的较准确判断是：

- 自动化测试已经明显更强，Prompt 契约也比最初完整得多。
- 真实模型输出比最开始更少直接乱写技能，但仍然不够稳定。
- 真实调用中仍然出现过：
  - 无效 JSON，触发 fallback
  - 中文内容编码/展示异常
  - 内容质量仍然会随模型返回波动

因此当前阶段最准确的结论不是“Prompt 已经调好”，而是：

`Prompt 已经比最开始更有保护网，但真实模型层面的稳定性问题仍未彻底解决。`

### 53. 当前最重要的开放问题

后续如果继续深入，最值得优先解决的问题可能不再只是“补更多 Prompt 句子”，而是：

- 是否要把流程升级成两阶段：
  - 先抽取事实
  - 再基于事实重写
- 是否要加强对模型原始返回内容的调试与记录，特别是无效 JSON 和中文异常输出
- 是否要设计一套更明确的真实样例评估标准，而不只依赖字符串级契约测试


### 37. 三次代码修改
class AiServiceCompatibilityTests(unittest.TestCase):
    def test_build_prompt_emphasizes_truthfulness_and_fact_preservation(self):
        prompt = ai_service._build_prompt(
            "Tsinghua University\nBuilt an internal dashboard and reduced review time by 30%.",
            "Need Python, dashboard experience, stakeholder communication, and measurable business impact.",
            "Professional",
        )

        self.assertIn("Do not invent or assume any experience, project, metric, title, technology, or result", prompt)
        self.assertIn("Preserve important facts from the original resume", prompt)
        self.assertIn("company names, project names, technologies, dates, and quantified outcomes", prompt)
        self.assertIn("missing evidence", prompt)
        self.assertIn("Return STRICT JSON only", prompt)

    def test_optimize_resume_accepts_fenced_json_content(self):
        ...
--------------------------------------------------------------------------------------------------------------------
现在只做一个最小改动：把 ai_service.py (line 35) 里的 _build_prompt(...) 整个函数替换掉，别动其他函数。

可运行版
把它改成下面这样：

def _build_prompt(resume_text: str, jd_text: str, style: str) -> str:
    """Build clear prompt asking model to return strict JSON."""
    return f"""
You are an expert resume coach.

Task:
Given the original resume and a job description, generate:
1) optimized_resume: improved resume text
2) match_analysis: short analysis of fit between resume and JD
3) suggestions: list of concrete edit suggestions

Writing style requirement: {style}

Important constraints:
- Do not invent or assume any experience, project, metric, title, technology, or result.
- Preserve important facts from the original resume.
- Prioritize retaining company names, project names, technologies, dates, and quantified outcomes.
- Reorganize or compress content only when it improves relevance to the JD without changing facts.
- In match_analysis, explain what evidence from the resume supports the JD and point out any missing evidence.
- Suggestions must be concrete and actionable.

Return STRICT JSON only (no markdown, no extra text), with this schema:
{{
  "optimized_resume": "string",
  "match_analysis": "string",
  "suggestions": ["string", "string"]
}}

Original Resume:
{resume_text}

Job Description:
{jd_text}
""".strip()
中文理解版
这份是给你看懂逻辑的，不要直接贴进项目里运行。

class AiServiceCompatibilityTests(unittest.TestCase):
    def test_build_prompt_emphasizes_truthfulness_and_fact_preservation(self):
        # 生成一段给模型使用的提示词
        prompt = ai_service._build_prompt(
            "清华大学\n搭建了一个内部仪表盘，并将审核时间缩短了 30%。",
            "需要 Python 能力、仪表盘经验、跨方沟通能力，以及可量化的业务成果。",
            "专业风格",
        )

        # 检查 Prompt 是否明确禁止编造经历、项目、指标、头衔、技术或结果
        self.assertIn("不要编造或臆测任何经历、项目、指标、头衔、技术或结果", prompt)

        # 检查 Prompt 是否要求保留原始简历中的重要事实
        self.assertIn("保留原始简历中的重要事实", prompt)

        # 检查 Prompt 是否点名要求保留公司名、项目名、技术、日期、量化成果
        self.assertIn("公司名称、项目名称、技术、日期和量化成果", prompt)

        # 检查 Prompt 是否要求分析里指出缺失证据
        self.assertIn("缺失的证据", prompt)

        # 检查 Prompt 是否要求只返回严格 JSON
        self.assertIn("只能返回严格 JSON", prompt)

中文理解版
这份是给你学习看的，不要直接贴进项目里运行：
现在只做一个最小改动：把 ai_service.py (line 35) 里的 _build_prompt(...) 整个函数替换掉，别动其他函数。
def _build_prompt(resume_text: str, jd_text: str, style: str) -> str:
    """构建 Prompt，要求模型返回严格 JSON。"""
    return f"""
你是一名资深简历优化顾问。

任务：
基于原始简历和岗位描述，生成：
1）优化后的简历
2）匹配分析
3）修改建议

写作风格要求：{style}

重要约束：
- 不要编造或臆测任何经历、项目、指标、头衔、技术或结果。
- 保留原始简历中的重要事实。
- 优先保留公司名称、项目名称、技术、日期和量化成果。
- 只有在不改变事实的前提下，才允许为了贴近 JD 而重组或压缩内容。
- 在匹配分析中，要说明简历里哪些内容支持 JD，同时指出缺失的证据。
- 建议必须具体、可执行。

只能返回严格 JSON（不要 markdown，不要额外解释），格式如下：
{{
  "optimized_resume": "字符串",
  "match_analysis": "字符串",
  "suggestions": ["字符串", "字符串"]
}}

原始简历：
{resume_text}

岗位描述：
{jd_text}
""".strip()


### 个人补充
这一步我继续带你走小闭环：先补一个失败测试，把 match_analysis 和 suggestions 的格式要求写死，再去改 Prompt。

  def test_build_prompt_requires_structured_analysis_and_prioritized_suggestions(self):
        prompt = ai_service._build_prompt(
            "Built Python dashboards, improved reporting efficiency, and worked with product stakeholders.",
            "Need Python, SQL, dashboard ownership, stakeholder communication, and measurable business impact.",
            "Professional",
        )

        self.assertIn("In match_analysis, summarize the strongest alignment, the most important gaps, and an overall fit judgment", prompt)
        self.assertIn("Return 3 to 5 suggestions", prompt)
        self.assertIn("Order suggestions from highest priority to lowest priority", prompt)
        self.assertIn("Each suggestion should describe a concrete resume revision action", prompt)
中文理解版
这份是给你学习看的，不要直接贴进项目里运行：

    def test_build_prompt_requires_structured_analysis_and_prioritized_suggestions(self):
        # 生成 Prompt，用来检查分析和建议的输出格式是否被明确约束
        prompt = ai_service._build_prompt(
            "做过 Python 看板开发，提升了汇报效率，并和产品相关方协作。",
            "需要 Python、SQL、看板负责人经验、跨方沟通能力，以及可量化业务成果。",
            "专业风格",
        )

        # 检查 Prompt 是否要求：match_analysis 要写出最强匹配点、关键缺口和总体判断
        self.assertIn("匹配分析里要总结最强匹配点、最重要缺口和总体匹配判断", prompt)

        # 检查 Prompt 是否要求：返回 3 到 5 条建议
        self.assertIn("返回 3 到 5 条建议", prompt)

        # 检查 Prompt 是否要求：建议按优先级从高到低排序
        self.assertIn("建议要按优先级从高到低排序", prompt)

        # 检查 Prompt 是否要求：每条建议都必须是具体的简历修改动作
        self.assertIn("每条建议都必须描述一个具体的简历修改动作", prompt)


这次失败是对的，说明 Prompt 里还没把“结构化分析 + 建议格式”写清楚。
你现在只做一个最小修改：改 ai_service.py 里的 Important constraints: 那一段。
把当前这句：

- In match_analysis, explain what evidence from the resume supports the JD, point out any missing evidence, and call out the strongest matched evidence and the most important gaps.
替换成下面两句，并在后面补 3 条建议约束：

- In match_analysis, summarize the strongest alignment, the most important gaps, and an overall fit judgment.
- Explain what evidence from the resume supports the JD and point out any missing evidence.
- Return 3 to 5 suggestions.
- Order suggestions from highest priority to lowest priority.
- Each suggestion should describe a concrete resume revision action.
所以这一小段最后应该长这样：

- Reorganize or compress content only when it improves relevance to the JD without changing facts.
- In match_analysis, summarize the strongest alignment, the most important gaps, and an overall fit judgment.
- Explain what evidence from the resume supports the JD and point out any missing evidence.
- Suggestions must be concrete and actionable.
- Base suggestions only on the provided resume and job description.
- Do not give generic job-search advice.
- Prioritize the highest-impact resume edits first.
- Return 3 to 5 suggestions.
- Order suggestions from highest priority to lowest priority.
- Each suggestion should describe a concrete resume revision action.
- Mirror important job-description keywords only when they are supported by the resume.
- Do not force unsupported keywords into the optimized resume.
- Prefer ATS-friendly wording while staying truthful.

## 54. 两阶段 grounded rewrite 继续补强

### 本轮做了什么
- 继续围绕 `backend/app/services/ai_service.py` 和 `backend/tests/test_history_api.py` 优化第二阶段 grounded rewrite prompt。
- 新增测试：当 grounded facts 是中文时，Prompt 必须明确禁止生成英文通用 profile summary，且不能把具体事实改写成空泛能力描述。
- 在 `_build_grounded_rewrite_prompt(...)` 里新增了三类约束：
  - 明确写出：如果 grounded facts 是中文，不要写英文 profile summary 或英文通用小标题。
  - 明确写出：不要用泛泛的能力描述替换具体事实。
  - 把 `source_facts` 再单独列成 `Grounded facts that must stay visible in optimized_resume`，强化“这些事实要保留可见”。

### 测试结果
- 新增的 grounded rewrite 单测通过。
- 后端完整回归测试通过：`backend/.venv/Scripts/python.exe -m unittest tests.test_history_api`
- 当前结果：`Ran 20 tests ... OK`
- 终端里的 `provider_authentication_failed` 依然是测试里故意模拟的场景，不是这轮改坏。

### 真实样例验证结论
- 我又做了一次真实样例调用验证。
- 这次没有看到新的业务逻辑错误，但最终仍然落到了 fallback，`fallback_reason` 是 `invalid_json_response`。
- 这说明当前阶段的主风险已经从“Prompt 里有没有写约束”转移到了“真实模型返回的 JSON 和内容是否稳定”。

### 目前最准确的判断
- 两阶段架构已经真正落地，不再只是单轮 Prompt 堆规则。
- 自动化测试层面，保护网已经更完整，当前 20 个后端测试全绿。
- 但真实模型层面还没有完全稳定，尤其是：
  - 偶发无效 JSON
  - 中文输出在某些调用链里仍可能不稳定
- 所以下一步如果继续深挖，重点不应该只是再加约束句，而应该考虑：
  - 进一步收紧第二阶段输出格式
  - 或者增加更稳的解析/重试策略
  - 或者补一组固定真实样例评测，专门看模型真实表现

### 这轮可以怎么对外表达
- 我把 Prompt 工程从单阶段约束迭代到了“两阶段生成”：先抽取简历事实，再基于事实重写简历。
- 我继续通过契约测试收紧 grounded rewrite 的中文输出和事实保留要求，并完成 20 项后端回归测试。
- 这轮也暴露了一个更真实的问题：测试能验证 Prompt 契约，但真实模型返回仍可能出现无效 JSON，因此工程上还需要补稳定性策略。

## 55. 无效 JSON 重试保护 + 最新真实样例结果

### 本轮做了什么
- 围绕真实调用里出现的 `invalid_json_response`，新增测试：如果 grounded rewrite 第一次返回无效 JSON、第二次返回有效 JSON，系统应该在同一次优化里自动重试一次，而不是直接 fallback。
- 在 `backend/tests/test_history_api.py` 里新增了对应的失败测试，然后在 `backend/app/services/ai_service.py` 的 `_request_ai_json(...)` 里补了最小重试逻辑。
- 当前策略：只对“空响应 / 无效 JSON”做一次重试；认证失败这类错误仍然直接抛出，不走重试。

### 测试结果
- 新增的“无效 JSON 后重试一次”测试通过。
- 后端完整回归测试通过：`backend/.venv/Scripts/python.exe -m unittest tests.test_history_api`
- 当前结果更新为：`Ran 21 tests ... OK`

### 最新真实样例验证
- 这次我重新用中文样例做了真实调用，并改用 Unicode 转义方式传参，避免 PowerShell 把中文样例本身弄乱码。
- 结果不再 fallback，而是成功返回 `result_source = "ai"`。
- 这次真实输出的变化很关键：
  - `optimized_resume` 变成了中文结构化版本，不再是英文通用 profile summary。
  - 原始事实被保留下来：学校、Python 数据看板开发、与产品和运营协作、优化周报流程、后端接口开发与内部工具维护都还在。
  - `SQL` 没有被硬写进 `optimized_resume`。
  - `match_analysis` 把 `SQL`、负责人经验、量化成果当作缺口，而不是当作已有能力。

### 目前还剩的小问题
- `suggestions` 的质量已经明显好于之前，但有些示例句仍然偏“顾问腔”，比如会给出比较模板化的补写示例。
- 这说明当前阶段已经从“先防乱编”推进到了“开始打磨建议质量和表达自然度”。

### 当前判断
- 两阶段架构 + grounded rewrite 约束 + 无效 JSON 单次重试，这三个组合起来，已经把系统从“容易乱编 / 易失稳”推进到了“基本可信、可以继续精修”的阶段。
- 现在最值得继续优化的方向，已经不再是单纯增加禁止性提示词，而是：
  - 继续打磨建议的中文表达和自然度
  - 视情况增加固定样例评测，观察真实输出质量是否稳定

## 56. 继续打磨中文建议口吻

### 本轮做了什么
- 针对真实样例里 suggestions 偏“顾问腔”、偏长的问题，继续围绕 grounded rewrite prompt 做小步约束。
- 新增测试，要求当 grounded facts 为中文时：
  - suggestions 要写成简短的中文简历修改动作
  - 不要写成长段解释型建议
  - 更偏向“明确、量化、前置、补充”等直接动作
- 在 `backend/app/services/ai_service.py` 中补了对应约束后，后端完整回归测试通过。

### 测试结果
- 本轮完成后，后端完整测试更新为：`Ran 24 tests ... OK`

### 真实样例观察
- suggestions 的语气相比之前更收敛了，不再那么像长段顾问式 coaching。
- 但真实结果里仍然出现了一个问题：建议中给出了 `Flask/Django` 这类原始事实里没有出现的技术示例，这依然可能误导用户。

## 57. 禁止在建议里举未提供的技术/成果示例

### 本轮做了什么
- 针对“suggestions 里会冒出原简历没写过的框架/工具/指标示例”这个问题，新增测试并补了 Prompt 约束：
  - 不要建议具体的工具、框架、指标或成果示例，除非 grounded facts 里已经存在
  - 如果需要提示用户补充，使用中性占位方式，比如“如果属实，请补充你实际使用过的工具或指标”
- 同时又发现一个更细的问题：模型会把 `unsupported_requirements` 写成“部分匹配”。
- 所以继续新增测试，并把 grounded rewrite prompt 改成更显式的形式：
  - 单独列出 `Supported requirements that may be described as matched`
  - 单独列出 `Unsupported requirements that must remain gaps`
  - 明确禁止把 unsupported requirement 写成“部分匹配 / 间接满足”

### 测试结果
- 这两轮之后，后端完整测试更新为：`Ran 25 tests ... OK`

### 最新真实样例结果
- `optimized_resume` 仍然保持中文、结构清晰，且没有把 `SQL` 硬写回简历。
- `match_analysis` 不再把“数据看板开发”直接升级成“负责人经验已满足”，而是更明确地把负责人经验列为缺口。
- `suggestions` 也明显更中性了，不再举 `Flask/Django` 这种越界示例。

### 当前最准确的判断
- 现在系统已经从“会明显乱编、会误把 JD 缺口写成已满足”推进到了“基本可信、输出方向更稳”的阶段。
- 当前仍可继续优化，但重点已经从“堵大漏洞”转向“磨质量细节”，例如：
  - suggestions 的中文表达再更自然一点
  - 对“跨团队沟通能力”这类软技能，区分“有协作事实”与“已充分证明能力”之间的表述力度

## 58. 固定样例评测体系落地

### 本轮做了什么
- 新增了一个最小可用的固定样例评测体系，用来验证真实输出质量，而不只是 Prompt 契约是否存在。
- 新增文件：
  - `backend/app/services/eval_service.py`
  - `backend/scripts/run_eval_samples.py`
  - `backend/evals/cases/` 下的 3 个固定样例
  - `backend/evals/README.md`
- 这套评测的核心维度目前有 5 个：
  - `language_ok`
  - `must_keep_ok`
  - `must_not_claim_ok`
  - `gap_flagged_ok`
  - `actionable_suggestions_ok`

### 为什么这一步重要
- 之前的测试主要验证“Prompt 里有没有写这些约束”。
- 现在这一步开始验证“真实样例跑出来的结果，是否真的像一个靠谱的简历助手”。
- 这也正好回应了前面一个很重要的学习点：
  - `assertIn` 很适合测 Prompt 契约
  - 但不适合直接测模型质量
  - 所以需要固定样例评测来补上这一层

### 本轮的 TDD 过程
- 先在现有 `backend/tests/test_history_api.py` 中新增了 `EvalSampleScoringTests`
- 先让它因为 `eval_service` 不存在而失败
- 然后实现 `eval_service.py`
- 之后又补了一条失败测试，修正了评测器“字符串匹配太死板”的问题，让它在 `must_keep` / `gap` 检查时忽略空格差异

### 当前测试结果
- 后端完整测试更新为：`Ran 28 tests ... OK`

### 当前评测样例
- `cn_gap_sql`
- `cn_quantified_dashboard`
- `en_backend_general`

### 当前运行命令
在 `backend/` 目录执行：

```powershell
.venv\Scripts\python.exe scripts\run_eval_samples.py
```

只跑一个 case：

```powershell
.venv\Scripts\python.exe scripts\run_eval_samples.py --case cn_gap_sql
```

### 最近一次试跑结论
- 评测脚本已经成功运行，并能输出时间戳报告。
- 在最近一次 3 组样例试跑里，整体分数是 `11 / 15`。
- 这说明：
  - 评测体系已经能稳定工作
  - 也开始能帮助我们定位“是哪一类真实输出还不够好”

### 当前评测体系的意义
- 以后每次改 Prompt 或两阶段逻辑后，都可以用同一批样例再跑一次。
- 分数变化就能帮助判断：
  - 是真的更好了
  - 还是只是在某一个样例上偶然变好
  - 或者修了一个问题，又让另一类样例退化了

## 59. 2026-03-26 固定样例评测实跑结果

### 本次运行结果
- 用户亲自运行了：
  - `backend/.venv/Scripts/python.exe scripts/run_eval_samples.py`
  - `backend/.venv/Scripts/python.exe scripts/run_eval_samples.py --case cn_gap_sql`
- 当天完整 3 组样例结果是：`12 / 15`
- 各 case 分数：
  - `cn_gap_sql`: `5 / 5`
  - `cn_quantified_dashboard`: `3 / 5`
  - `en_backend_general`: `4 / 5`
- 单独跑 `cn_gap_sql` 时结果是：`5 / 5`

### 这次结果说明了什么
- 这说明固定样例评测脚本已经可以稳定工作，而且用户也已经能独立跑起来。
- `cn_gap_sql` 现在已经比较稳，是当前表现最好的一组样例。
- 当前最主要的薄弱点集中在：
  - `cn_quantified_dashboard`
  - `en_backend_general`

### 从报告里读出的关键信息
- `cn_quantified_dashboard` 当前主要丢分在：
  - `must_keep_ok = false`
  - `actionable_suggestions_ok = false`
- `en_backend_general` 当前主要丢分在：
  - `actionable_suggestions_ok = false`

### 这轮最值得记住的工程意义
- 分数不是完全固定的，真实模型输出会有波动，这本身是正常现象。
- 真正重要的是：
  - 固定样例能让我们看到“哪一类样例稳定通过”
  - 也能让我们看到“哪一类问题还在反复出现”
- 这正是固定样例评测的价值：
  - 不是追求每次都一模一样
  - 而是让质量波动变得可观察、可比较、可迭代

## 63. 2026-03-26 评测达到 15 / 15

### 本次结果
- 用户先单独运行了：
  - `backend/.venv/Scripts/python.exe scripts/run_eval_samples.py --case cn_quantified_dashboard`
- 结果：
  - `cn_quantified_dashboard = 5 / 5`
- 随后又运行了完整 3 组固定样例：
  - `backend/.venv/Scripts/python.exe scripts/run_eval_samples.py`
- 最新总分：
  - `15 / 15`
- 各 case 分数：
  - `cn_gap_sql = 5 / 5`
  - `cn_quantified_dashboard = 5 / 5`
  - `en_backend_general = 5 / 5`

### 这一步为什么重要
- 这说明当前这套最小评测体系已经真正跑通，而且可以稳定地：
  - 读取固定样例
  - 调用真实优化流程
  - 给出结构化评分
  - 帮助我们定位问题，再验证修复结果
- 对当前项目来说，这已经不是“只会跑通功能”的阶段，而是开始具备了：
  - Prompt 契约测试
  - 两阶段优化流程
  - 固定样例评测闭环

### 当前阶段的准确判断
- 站在“3 个月内尽快做出能找工作的项目”这个目标上看，现在这个项目已经进入：
  - `可以收束主功能、开始准备展示和面试表达`
- 后面继续优化当然还能做，但优先级可以从“补关键缺口”切换到：
  - 做展示
  - 做简历表达
  - 做项目讲述

## 60. 3 个月内的精力分配建议（找工作优先级）

### 当前最重要的方向
- 对当前阶段来说，最优先的不是“把每一行代码都完全吃透”，而是“先把项目做出来，并做到自己能讲清楚”。
- 如果时间上限只有 3 个月，应该以项目产出为主，而不是以逐行深挖代码为主。

### 推荐的精力分配
- 建议按 `70% 做出项目 + 30% 边做边理解` 的方式推进。
- 这里的“理解”不是全量理解整个项目，而是优先理解自己亲手改过、面试高频会问到的核心部分。

### 为什么不能把主要时间花在逐行理解上
- 如果把大量时间花在“每一行都搞懂”上，风险会很高：
  - 项目做不完
  - 没有完整作品可展示
  - 简历上很难写出完整闭环
  - 面试时既没有成型成果，也未必能形成更强表达

### 现在真正需要优先拿到的东西
- 能写进简历的项目成果
- 能跑给别人看的成品
- 能讲成完整故事的优化过程

### 哪些内容要优先做
- 先把项目核心功能做完整，让它能跑、能演示、能写进简历。
- 只对自己亲手做过的核心改动做深理解，例如：
  - Prompt 为什么要加约束
  - 为什么从单阶段升级成两阶段
  - 为什么要做固定样例评测
- 每做完一轮，就沉淀：
  - 这轮改了什么
  - 为什么改
  - 怎么验证
  - 面试怎么讲

### 哪些内容只要会讲，不必现在深挖到最底层
- 不需要把全项目每个函数、每个工具函数都研究到非常深。
- 不需要把所有底层实现细节都背下来。
- 只要能把系统主流程讲清楚，并能解释自己改过的部分解决了什么问题，就已经足够支撑当前阶段的求职目标。

### 哪些是当前最不该掉进去的坑
- 陷入“逐行理解焦虑”：觉得某一行没完全懂，就不敢继续推进项目。
- 只会照抄，不形成自己的表达：项目虽然做出来了，但一问为什么这么做，就答不上来。

### 当前最准确的行动原则
- 不是追求“全懂”，而是追求：
  - 先做出一个能演示、能复盘、能讲清楚的项目
- 判断一件事是否值得优先做，可以问自己 3 个问题：
  - 这会不会让项目更完整、更像一个作品？
  - 这会不会变成我简历里能写的一条内容？
  - 这会不会帮助我回答面试官的问题？
- 如果答案都是“会”，就优先做；如果只是“让我感觉更懂一点”，但对项目产出帮助不大，就先放后面。

### 一句话总结
- 现在不是追求“全懂”，而是追求：
  - `先做出一个你能演示、能复盘、能讲清楚的项目。`

## 61. “30% 边做边理解”具体怎么做

### 核心原则
- “边做边理解”不是一边做项目、一边漫无目的地看所有代码。
- 更准确的做法是：
  - 只理解当前这一步会用到的代码
  - 只深挖那些自己改过、面试高概率会问到的部分

### 每做一轮时的最小理解动作
- 每完成一轮改动，只补 4 个理解点：
  - 这轮改了什么
  - 为什么要改
  - 代码是在哪里改的
  - 我怎么验证它生效了
- 如果这 4 个点能说清楚，就说明这轮已经达到“求职够用的理解深度”。

### 一个推荐节奏
- 第一步：先让功能跑通，不要一开始就逐行啃代码。
- 第二步：只看和当前任务直接相关的 1 到 2 个文件。
- 第三步：改完后，用一句话总结这一轮解决的问题。
- 第四步：再补一句话，总结自己怎么验证它有效。
- 第五步：把这轮内容沉淀进笔记，变成以后能复述的表达。

### 在这个项目里，30% 理解最该盯哪些内容
- 项目主流程：
  - 用户输入简历和 JD
  - 前端发请求
  - 后端调用 `optimize_resume(...)`
  - 返回 `optimized_resume / match_analysis / suggestions`
- 自己真正改过的地方：
  - `_build_prompt(...)`
  - 两阶段生成流程
  - grounded rewrite 约束
  - 固定样例评测
- 验证方式：
  - 单元测试
  - 回归测试
  - 固定样例评测
  - 手动真实样例验证

### 哪些不用现在深挖
- 不需要把整个项目所有文件都看完再动手。
- 不需要把每个辅助函数的底层实现全背下来。
- 不需要为了“完全理解”而卡住项目推进。

### 一个最实用的判断标准
- 如果某段代码满足下面任一条件，就值得进入“30% 理解”范围：
  - 这是你亲手改过的
  - 这是项目主流程上的关键节点
  - 面试官大概率会问到
- 如果都不满足，就先不深挖。

### 最落地的执行模板
- 每做完一轮，强制写下这 4 句：
  - 我改了什么：
  - 我为什么改：
  - 我改的是哪几个文件：
  - 我怎么验证它有效：

### 一句话总结
- “30% 边做边理解”的本质不是少学，而是：
  - `只学当前最值钱、最会被问到、最能转化成项目表达的那部分。`

## 62. `test_history_api.py` 和 `eval_service.py` 的关系

### 这两个文件分别干什么
- `backend/tests/test_history_api.py` 里的相关代码，负责定义“我们希望系统表现成什么样”。
- `backend/app/services/eval_service.py` 里的相关代码，负责真正实现“系统现在实际上怎么判断”。

### 放到当前这个例子里怎么理解
- 在测试里，我们构造了一个 `case` 和一个 `result`，然后调用：
  - `eval_service.evaluate_case_output(case, result)`
- 测试最后检查：
  - `evaluation["checks"]["actionable_suggestions_ok"]`
- 也就是说：
  - 测试文件负责提出要求
  - 实现文件负责给出结果

### 更白话的理解
- `test_history_api.py` 像“出题老师”
- `eval_service.py` 像“答题的人”
- 如果测试失败，不是说测试在“做业务逻辑”，而是在说明：
  - 现在的实现还没有满足我们期望的行为

### 这次具体为什么会失败
- 测试里给了一个包含“增加协作频率和业务问题示例”的建议。
- 我们认为“增加”也是一个有效的中文修改动作词。
- 但 `eval_service.py` 里的 `CHINESE_ACTION_HINTS` 还没把“增加”算进去。
- 所以 `evaluate_case_output(...)` 最终返回：
  - `actionable_suggestions_ok = False`
- 测试就失败了。

### 一句话总结
- 测试文件不是重复实现逻辑，而是在验证实现文件是否满足我们想要的行为。 
