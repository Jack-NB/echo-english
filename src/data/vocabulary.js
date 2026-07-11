const vocabulary = [
  {
    id: 1,
    word: "abundant",
    phonetic: "/əˈbʌndənt/",
    meaning: "丰富的，充裕的",
    example: "The region has abundant natural resources, including oil and minerals.",
    exampleCn: "该地区拥有丰富的自然资源，包括石油和矿产。"
  },
  {
    id: 2,
    word: "accumulate",
    phonetic: "/əˈkjuːmjəleɪt/",
    meaning: "积累，积聚",
    example: "Dust had accumulated on the bookshelf during my absence.",
    exampleCn: "我不在的时候，书架上积满了灰尘。"
  },
  {
    id: 3,
    word: "ambiguous",
    phonetic: "/æmˈbɪɡjuəs/",
    meaning: "模糊不清的，模棱两可的",
    example: "His response was ambiguous, leaving us unsure of his true intentions.",
    exampleCn: "他的回答模棱两可，让我们不确定他的真实意图。"
  },
  {
    id: 4,
    word: "anticipate",
    phonetic: "/ænˈtɪsɪpeɪt/",
    meaning: "预期，期望",
    example: "We anticipate that sales will increase by 20% this quarter.",
    exampleCn: "我们预计本季度销售额将增长20%。"
  },
  {
    id: 5,
    word: "apparent",
    phonetic: "/əˈpærənt/",
    meaning: "明显的，显而易见的",
    example: "It became apparent that he was not telling the truth.",
    exampleCn: "很明显他没有说实话。"
  },
  {
    id: 6,
    word: "artificial",
    phonetic: "/ˌɑːrtɪˈfɪʃl/",
    meaning: "人造的，虚假的",
    example: "The lake is artificial, created by damming the river.",
    exampleCn: "这个湖是人造的，通过拦截河流而形成。"
  },
  {
    id: 7,
    word: "attribute",
    phonetic: "/əˈtrɪbjuːt/",
    meaning: "属性；把……归因于",
    example: "She attributes her success to hard work and determination.",
    exampleCn: "她把她的成功归因于努力和决心。"
  },
  {
    id: 8,
    word: "barrier",
    phonetic: "/ˈbæriər/",
    meaning: "障碍，屏障",
    example: "Language barriers often make international communication difficult.",
    exampleCn: "语言障碍常常使国际交流变得困难。"
  },
  {
    id: 9,
    word: "boom",
    phonetic: "/buːm/",
    meaning: "繁荣，激增",
    example: "The tech boom of the 1990s created many new industries.",
    exampleCn: "20世纪90年代的技术繁荣创造了许多新产业。"
  },
  {
    id: 10,
    word: "boundary",
    phonetic: "/ˈbaʊndri/",
    meaning: "边界，界限",
    example: "The river forms the natural boundary between the two countries.",
    exampleCn: "这条河构成了两国之间的天然边界。"
  },
  {
    id: 11,
    word: "brilliant",
    phonetic: "/ˈbrɪliənt/",
    meaning: "杰出的，明亮的",
    example: "She had a brilliant idea that solved the problem instantly.",
    exampleCn: "她有一个绝妙的主意，立刻解决了问题。"
  },
  {
    id: 12,
    word: "budget",
    phonetic: "/ˈbʌdʒɪt/",
    meaning: "预算",
    example: "We need to plan the project within the allocated budget.",
    exampleCn: "我们需要在分配的预算内规划这个项目。"
  },
  {
    id: 13,
    word: "calculate",
    phonetic: "/ˈkælkjuleɪt/",
    meaning: "计算，估算",
    example: "The engineer calculated the load capacity of the bridge.",
    exampleCn: "工程师计算了桥梁的承载能力。"
  },
  {
    id: 14,
    word: "capture",
    phonetic: "/ˈkæptʃər/",
    meaning: "捕获，捕捉",
    example: "The photographer managed to capture the beauty of the sunset.",
    exampleCn: "摄影师成功地捕捉到了日落的美景。"
  },
  {
    id: 15,
    word: "category",
    phonetic: "/ˈkætəɡɔːri/",
    meaning: "类别，种类",
    example: "The books are organized by category on the shelves.",
    exampleCn: "书籍按类别摆放在书架上。"
  },
  {
    id: 16,
    word: "challenge",
    phonetic: "/ˈtʃælɪndʒ/",
    meaning: "挑战",
    example: "Learning a new language is a rewarding challenge.",
    exampleCn: "学习一门新语言是一个有益的挑战。"
  },
  {
    id: 17,
    word: "collapse",
    phonetic: "/kəˈlæps/",
    meaning: "倒塌，崩溃",
    example: "The old building collapsed after the heavy rain.",
    exampleCn: "那栋旧楼在大雨后倒塌了。"
  },
  {
    id: 18,
    word: "compel",
    phonetic: "/kəmˈpel/",
    meaning: "强迫，迫使",
    example: "The new evidence compelled the police to reopen the case.",
    exampleCn: "新证据迫使警方重新调查此案。"
  },
  {
    id: 19,
    word: "compensate",
    phonetic: "/ˈkɒmpenseɪt/",
    meaning: "补偿，弥补",
    example: "The company agreed to compensate workers for their injuries.",
    exampleCn: "公司同意赔偿工人的工伤。"
  },
  {
    id: 20,
    word: "complicate",
    phonetic: "/ˈkɒmplɪkeɪt/",
    meaning: "使复杂化",
    example: "The new regulations could complicate the approval process.",
    exampleCn: "新规定可能会使审批过程复杂化。"
  },
  {
    id: 21,
    word: "comprehensive",
    phonetic: "/ˌkɒmprɪˈhensɪv/",
    meaning: "全面的，综合的",
    example: "The report provides a comprehensive analysis of the market.",
    exampleCn: "该报告对市场进行了全面分析。"
  },
  {
    id: 22,
    word: "confine",
    phonetic: "/kənˈfaɪn/",
    meaning: "限制，局限",
    example: "Please confine your discussion to the topic at hand.",
    exampleCn: "请将讨论限制在当前的议题上。"
  },
  {
    id: 23,
    word: "conscious",
    phonetic: "/ˈkɒnʃəs/",
    meaning: "有意识的，自觉的",
    example: "He was conscious of the fact that everyone was watching him.",
    exampleCn: "他意识到每个人都在看着他。"
  },
  {
    id: 24,
    word: "consequence",
    phonetic: "/ˈkɒnsɪkwens/",
    meaning: "结果，后果",
    example: "Make sure you understand the consequences before making a decision.",
    exampleCn: "在做决定之前，确保你明白后果。"
  },
  {
    id: 25,
    word: "conservative",
    phonetic: "/kənˈsɜːrvətɪv/",
    meaning: "保守的，传统的",
    example: "His conservative approach to investing focuses on long-term stability.",
    exampleCn: "他保守的投资方式注重长期稳定。"
  },
  {
    id: 26,
    word: "considerable",
    phonetic: "/kənˈsɪdərəbl/",
    meaning: "相当大的，重要的",
    example: "The storm caused considerable damage to the coastal area.",
    exampleCn: "暴风雨对沿海地区造成了相当大的破坏。"
  },
  {
    id: 27,
    word: "contribute",
    phonetic: "/kənˈtrɪbjuːt/",
    meaning: "贡献，捐献",
    example: "Everyone should contribute to the community in their own way.",
    exampleCn: "每个人都应该以自己的方式为社区做贡献。"
  },
  {
    id: 28,
    word: "controversy",
    phonetic: "/ˈkɒntrəvɜːrsi/",
    meaning: "争论，争议",
    example: "The new policy sparked a heated controversy among citizens.",
    exampleCn: "新政策在市民中引发了激烈的争议。"
  },
  {
    id: 29,
    word: "convey",
    phonetic: "/kənˈveɪ/",
    meaning: "传达，运输",
    example: "Her paintings convey a deep sense of loneliness.",
    exampleCn: "她的画作传达出一种深深的孤独感。"
  },
  {
    id: 30,
    word: "crash",
    phonetic: "/kræʃ/",
    meaning: "碰撞，坠毁",
    example: "The stock market crashed in 2008, causing a global recession.",
    exampleCn: "股市在2008年崩盘，引发了全球衰退。"
  },
  {
    id: 31,
    word: "cultivate",
    phonetic: "/ˈkʌltɪveɪt/",
    meaning: "培养，耕作",
    example: "She cultivated a love of reading in her children from an early age.",
    exampleCn: "她从孩子们很小的时候就开始培养他们对阅读的热爱。"
  },
  {
    id: 32,
    word: "decline",
    phonetic: "/dɪˈklaɪn/",
    meaning: "下降，衰退",
    example: "The population of the village has declined significantly over the past decade.",
    exampleCn: "过去十年里，这个村庄的人口显著下降。"
  },
  {
    id: 33,
    word: "decorate",
    phonetic: "/ˈdekəreɪt/",
    meaning: "装饰，装潢",
    example: "They decorated the hall with flowers and balloons for the party.",
    exampleCn: "他们用鲜花和气球装饰大厅来举办派对。"
  },
  {
    id: 34,
    word: "deliberate",
    phonetic: "/dɪˈlɪbərət/",
    meaning: "故意的；深思熟虑的",
    example: "The jury deliberated for three days before reaching a verdict.",
    exampleCn: "陪审团深思熟虑了三天才做出裁决。"
  },
  {
    id: 35,
    word: "demonstrate",
    phonetic: "/ˈdemənstreɪt/",
    meaning: "证明，示范",
    example: "The experiment demonstrates that the theory is correct.",
    exampleCn: "这个实验证明了该理论是正确的。"
  },
  {
    id: 36,
    word: "depress",
    phonetic: "/dɪˈpres/",
    meaning: "使沮丧；压低",
    example: "The bad news depressed everyone in the office.",
    exampleCn: "这个坏消息让办公室里的每个人都感到沮丧。"
  },
  {
    id: 37,
    word: "deserve",
    phonetic: "/dɪˈzɜːrv/",
    meaning: "值得，应得",
    example: "After all her hard work, she deserves a promotion.",
    exampleCn: "在她所有的努力之后，她值得一次晋升。"
  },
  {
    id: 38,
    word: "diminish",
    phonetic: "/dɪˈmɪnɪʃ/",
    meaning: "减少，缩小",
    example: "The value of the currency has diminished over time.",
    exampleCn: "货币的价值随着时间的推移而减少。"
  },
  {
    id: 39,
    word: "discipline",
    phonetic: "/ˈdɪsɪplɪn/",
    meaning: "纪律；学科",
    example: "Learning a musical instrument requires patience and discipline.",
    exampleCn: "学习一种乐器需要耐心和自律。"
  },
  {
    id: 40,
    word: "discrimination",
    phonetic: "/dɪˌskrɪmɪˈneɪʃn/",
    meaning: "歧视；辨别",
    example: "Laws prohibit discrimination based on race or gender.",
    exampleCn: "法律禁止基于种族或性别的歧视。"
  },
  {
    id: 41,
    word: "domestic",
    phonetic: "/dəˈmestɪk/",
    meaning: "国内的；家庭的",
    example: "The airline operates both domestic and international flights.",
    exampleCn: "这家航空公司经营国内和国际航班。"
  },
  {
    id: 42,
    word: "dominant",
    phonetic: "/ˈdɒmɪnənt/",
    meaning: "占主导地位的，支配的",
    example: "She played a dominant role in the negotiation process.",
    exampleCn: "她在谈判过程中发挥了主导作用。"
  },
  {
    id: 43,
    word: "dramatic",
    phonetic: "/drəˈmætɪk/",
    meaning: "巨大的；戏剧性的",
    example: "There has been a dramatic increase in online shopping this year.",
    exampleCn: "今年网上购物有了巨大的增长。"
  },
  {
    id: 44,
    word: "durable",
    phonetic: "/ˈdʊrəbl/",
    meaning: "耐用的，持久的",
    example: "This backpack is made of durable material that lasts for years.",
    exampleCn: "这款背包由耐用的材料制成，可以使用多年。"
  },
  {
    id: 45,
    word: "elaborate",
    phonetic: "/ɪˈlæbərət/",
    meaning: "精心制作的；详细阐述",
    example: "Could you elaborate on your proposal for the marketing campaign?",
    exampleCn: "你能详细说明一下你的营销活动方案吗？"
  },
  {
    id: 46,
    word: "eliminate",
    phonetic: "/ɪˈlɪmɪneɪt/",
    meaning: "消除，淘汰",
    example: "The new software aims to eliminate human errors in data entry.",
    exampleCn: "这款新软件旨在消除数据录入中的人为错误。"
  },
  {
    id: 47,
    word: "embrace",
    phonetic: "/ɪmˈbreɪs/",
    meaning: "拥抱；欣然接受",
    example: "The company embraced new technology to stay competitive.",
    exampleCn: "公司欣然接受新技术以保持竞争力。"
  },
  {
    id: 48,
    word: "emerge",
    phonetic: "/ɪˈmɜːrdʒ/",
    meaning: "出现，浮现",
    example: "New evidence emerged during the investigation.",
    exampleCn: "调查过程中出现了新的证据。"
  },
  {
    id: 49,
    word: "emphasize",
    phonetic: "/ˈemfəsaɪz/",
    meaning: "强调，着重",
    example: "The teacher emphasized the importance of reading every day.",
    exampleCn: "老师强调了每天阅读的重要性。"
  },
  {
    id: 50,
    word: "encounter",
    phonetic: "/ɪnˈkaʊntər/",
    meaning: "遭遇，邂逅",
    example: "During her travels, she encountered many interesting people.",
    exampleCn: "在旅途中，她遇到了许多有趣的人。"
  },
  {
    id: 51,
    word: "enormous",
    phonetic: "/ɪˈnɔːrməs/",
    meaning: "巨大的，庞大的",
    example: "The construction project required an enormous amount of resources.",
    exampleCn: "这个建设项目需要巨大的资源。"
  },
  {
    id: 52,
    word: "establish",
    phonetic: "/ɪˈstæblɪʃ/",
    meaning: "建立，设立",
    example: "The company was established in 1995 and has grown steadily since.",
    exampleCn: "该公司成立于1995年，此后稳步发展。"
  },
  {
    id: 53,
    word: "evaluate",
    phonetic: "/ɪˈvæljueɪt/",
    meaning: "评估，评价",
    example: "The manager will evaluate each employee's performance at the end of the year.",
    exampleCn: "经理将在年底评估每位员工的表现。"
  },
  {
    id: 54,
    word: "evolution",
    phonetic: "/ˌevəˈluːʃn/",
    meaning: "进化，演变",
    example: "The evolution of smartphone technology has been remarkable.",
    exampleCn: "智能手机技术的演变非常显著。"
  },
  {
    id: 55,
    word: "exceed",
    phonetic: "/ɪkˈsiːd/",
    meaning: "超过，超出",
    example: "The final cost should not exceed the initial estimate.",
    exampleCn: "最终成本不应超过最初的预算。"
  },
  {
    id: 56,
    word: "expand",
    phonetic: "/ɪkˈspænd/",
    meaning: "扩展，膨胀",
    example: "The company plans to expand its operations into Europe.",
    exampleCn: "公司计划将业务扩展到欧洲。"
  },
  {
    id: 57,
    word: "expose",
    phonetic: "/ɪkˈspoʊz/",
    meaning: "暴露，揭露",
    example: "The documentary exposed the harsh conditions in the factory.",
    exampleCn: "这部纪录片揭露了工厂里恶劣的工作条件。"
  },
  {
    id: 58,
    word: "extensive",
    phonetic: "/ɪkˈstensɪv/",
    meaning: "广泛的，大量的",
    example: "The library has an extensive collection of historical documents.",
    exampleCn: "图书馆收藏了大量的历史文献。"
  },
  {
    id: 59,
    word: "extraordinary",
    phonetic: "/ɪkˈstrɔːrdɪneri/",
    meaning: "非凡的，卓越的",
    example: "She has an extraordinary talent for playing the piano.",
    exampleCn: "她在弹钢琴方面有着非凡的天赋。"
  },
  {
    id: 60,
    word: "flexible",
    phonetic: "/ˈfleksəbl/",
    meaning: "灵活的，柔韧的",
    example: "We need a flexible schedule that can adapt to changing needs.",
    exampleCn: "我们需要一个能适应不断变化需求的灵活时间表。"
  },
  {
    id: 61,
    word: "flourish",
    phonetic: "/ˈflɜːrɪʃ/",
    meaning: "繁荣，茂盛",
    example: "The local economy flourished after the new highway was built.",
    exampleCn: "新高速公路建成后，当地经济繁荣起来。"
  },
  {
    id: 62,
    word: "forecast",
    phonetic: "/ˈfɔːrkæst/",
    meaning: "预测，预报",
    example: "The weather forecast predicts rain for the weekend.",
    exampleCn: "天气预报预测周末有雨。"
  },
  {
    id: 63,
    word: "generate",
    phonetic: "/ˈdʒenəreɪt/",
    meaning: "产生，生成",
    example: "The wind farm generates enough electricity to power 10,000 homes.",
    exampleCn: "这个风力发电场产生的电力足以供应一万户家庭。"
  },
  {
    id: 64,
    word: "generous",
    phonetic: "/ˈdʒenərəs/",
    meaning: "慷慨的，大方的",
    example: "The billionaire made a generous donation to the university.",
    exampleCn: "这位亿万富翁向大学慷慨捐赠。"
  },
  {
    id: 65,
    word: "guarantee",
    phonetic: "/ˌɡærənˈtiː/",
    meaning: "保证，担保",
    example: "The product comes with a one-year satisfaction guarantee.",
    exampleCn: "该产品享有一年的满意保证。"
  },
  {
    id: 66,
    word: "harmony",
    phonetic: "/ˈhɑːrməni/",
    meaning: "和谐，融洽",
    example: "The two communities lived together in perfect harmony.",
    exampleCn: "两个社区和睦地生活在一起。"
  },
  {
    id: 67,
    word: "hesitate",
    phonetic: "/ˈhezɪteɪt/",
    meaning: "犹豫，踌躇",
    example: "If you have any questions, please don't hesitate to ask.",
    exampleCn: "如果你有任何问题，请尽管问。"
  },
  {
    id: 68,
    word: "illustrate",
    phonetic: "/ˈɪləstreɪt/",
    meaning: "说明，阐明",
    example: "The teacher used diagrams to illustrate how the engine works.",
    exampleCn: "老师用图表来说明发动机的工作原理。"
  },
  {
    id: 69,
    word: "immense",
    phonetic: "/ɪˈmens/",
    meaning: "巨大的，无限的",
    example: "The project required an immense amount of time and effort.",
    exampleCn: "这个项目需要巨大的时间和精力。"
  },
  {
    id: 70,
    word: "implement",
    phonetic: "/ˈɪmplɪment/",
    meaning: "实施，执行",
    example: "The government plans to implement the new policy next year.",
    exampleCn: "政府计划明年实施新政策。"
  },
  {
    id: 71,
    word: "indicate",
    phonetic: "/ˈɪndɪkeɪt/",
    meaning: "表明，指示",
    example: "The latest data indicates that the economy is recovering.",
    exampleCn: "最新数据表明经济正在复苏。"
  },
  {
    id: 72,
    word: "inevitable",
    phonetic: "/ɪnˈevɪtəbl/",
    meaning: "不可避免的",
    example: "Change is inevitable in any growing organization.",
    exampleCn: "在任何成长中的组织里，变化是不可避免的。"
  },
  {
    id: 73,
    word: "influence",
    phonetic: "/ˈɪnfluəns/",
    meaning: "影响",
    example: "Social media has a huge influence on young people's opinions.",
    exampleCn: "社交媒体对年轻人的观点有着巨大的影响。"
  },
  {
    id: 74,
    word: "initiative",
    phonetic: "/ɪˈnɪʃətɪv/",
    meaning: "倡议；主动性",
    example: "She took the initiative to organize a team meeting.",
    exampleCn: "她主动组织了一次团队会议。"
  },
  {
    id: 75,
    word: "innovation",
    phonetic: "/ˌɪnəˈveɪʃn/",
    meaning: "创新，革新",
    example: "Technological innovation has transformed the way we communicate.",
    exampleCn: "技术创新改变了我们的沟通方式。"
  },
  {
    id: 76,
    word: "inspect",
    phonetic: "/ɪnˈspekt/",
    meaning: "检查，审视",
    example: "The health inspector will inspect the restaurant tomorrow.",
    exampleCn: "卫生检查员明天会来检查这家餐厅。"
  },
  {
    id: 77,
    word: "inspire",
    phonetic: "/ɪnˈspaɪər/",
    meaning: "激励，启发",
    example: "Her speech inspired everyone to pursue their dreams.",
    exampleCn: "她的演讲激励了每个人去追求自己的梦想。"
  },
  {
    id: 78,
    word: "integrate",
    phonetic: "/ˈɪntɪɡreɪt/",
    meaning: "整合，融入",
    example: "The new system integrates all our data into one platform.",
    exampleCn: "新系统把我们所有的数据整合到一个平台上。"
  },
  {
    id: 79,
    word: "intelligent",
    phonetic: "/ɪnˈtelɪdʒənt/",
    meaning: "聪明的，智能的",
    example: "Dolphins are highly intelligent and social animals.",
    exampleCn: "海豚是非常聪明且具有社交性的动物。"
  },
  {
    id: 80,
    word: "investigate",
    phonetic: "/ɪnˈvestɪɡeɪt/",
    meaning: "调查，研究",
    example: "The police are investigating the cause of the accident.",
    exampleCn: "警方正在调查事故的原因。"
  },
  {
    id: 81,
    word: "justify",
    phonetic: "/ˈdʒʌstɪfaɪ/",
    meaning: "证明……正当，为……辩护",
    example: "The benefits of the project justify the high cost involved.",
    exampleCn: "该项目带来的好处证明了其高昂成本的合理性。"
  },
  {
    id: 82,
    word: "maintain",
    phonetic: "/meɪnˈteɪn/",
    meaning: "维持，保持",
    example: "It's important to maintain a healthy work-life balance.",
    exampleCn: "保持健康的工作与生活平衡很重要。"
  },
  {
    id: 83,
    word: "massive",
    phonetic: "/ˈmæsɪv/",
    meaning: "大量的，大规模的",
    example: "The earthquake caused massive damage to the city.",
    exampleCn: "地震给这座城市造成了大规模的破坏。"
  },
  {
    id: 84,
    word: "mild",
    phonetic: "/maɪld/",
    meaning: "温和的，轻微的",
    example: "The weather in spring is usually mild and pleasant.",
    exampleCn: "春天的天气通常温和宜人。"
  },
  {
    id: 85,
    word: "modify",
    phonetic: "/ˈmɒdɪfaɪ/",
    meaning: "修改，调整",
    example: "We need to modify the design based on customer feedback.",
    exampleCn: "我们需要根据客户反馈修改设计。"
  },
  {
    id: 86,
    word: "negative",
    phonetic: "/ˈneɡətɪv/",
    meaning: "消极的，否定的",
    example: "Try to focus on the positive aspects and ignore the negative comments.",
    exampleCn: "尽量关注积极的方面，忽略消极的评论。"
  },
  {
    id: 87,
    word: "negotiate",
    phonetic: "/nɪˈɡoʊʃieɪt/",
    meaning: "谈判，协商",
    example: "The union is negotiating with management for better working conditions.",
    exampleCn: "工会正在与管理层协商改善工作条件。"
  },
  {
    id: 88,
    word: "obvious",
    phonetic: "/ˈɒbviəs/",
    meaning: "明显的，显然的",
    example: "It was obvious that she had practiced the speech many times.",
    exampleCn: "很明显她多次练习过这个演讲。"
  },
  {
    id: 89,
    word: "occupy",
    phonetic: "/ˈɒkjupaɪ/",
    meaning: "占据，使忙碌",
    example: "Reading occupies most of my free time.",
    exampleCn: "阅读占据了我大部分的业余时间。"
  },
  {
    id: 90,
    word: "overcome",
    phonetic: "/ˌoʊvərˈkʌm/",
    meaning: "克服，战胜",
    example: "She managed to overcome her fear of public speaking.",
    exampleCn: "她设法克服了对公开演讲的恐惧。"
  },
  {
    id: 91,
    word: "participate",
    phonetic: "/pɑːrˈtɪsɪpeɪt/",
    meaning: "参加，参与",
    example: "Students are encouraged to participate in extracurricular activities.",
    exampleCn: "鼓励学生参加课外活动。"
  },
  {
    id: 92,
    word: "phenomenon",
    phonetic: "/fəˈnɒmɪnən/",
    meaning: "现象",
    example: "The phenomenon of global warming is a major concern worldwide.",
    exampleCn: "全球变暖现象是全球关注的主要问题。"
  },
  {
    id: 93,
    word: "potential",
    phonetic: "/pəˈtenʃl/",
    meaning: "潜力，潜在的",
    example: "The young athlete has the potential to become a world champion.",
    exampleCn: "这位年轻运动员有潜力成为世界冠军。"
  },
  {
    id: 94,
    word: "promote",
    phonetic: "/prəˈmoʊt/",
    meaning: "促进，推广；晋升",
    example: "The campaign aims to promote healthy eating habits among children.",
    exampleCn: "这项活动旨在促进儿童的健康饮食习惯。"
  },
  {
    id: 95,
    word: "prospect",
    phonetic: "/ˈprɒspekt/",
    meaning: "前景，可能性",
    example: "The job prospects for graduates in this field are excellent.",
    exampleCn: "这个领域的毕业生就业前景非常好。"
  },
  {
    id: 96,
    word: "pursue",
    phonetic: "/pərˈsjuː/",
    meaning: "追求，追赶",
    example: "She decided to pursue a career in medicine.",
    exampleCn: "她决定追求医学事业。"
  },
  {
    id: 97,
    word: "relevant",
    phonetic: "/ˈreləvənt/",
    meaning: "相关的，切题的",
    example: "Please provide only information that is relevant to the case.",
    exampleCn: "请只提供与本案相关的信息。"
  },
  {
    id: 98,
    word: "sufficient",
    phonetic: "/səˈfɪʃnt/",
    meaning: "足够的，充分的",
    example: "One hour should be sufficient for the meeting.",
    exampleCn: "一个小时应该足够开会了。"
  },
  {
    id: 99,
    word: "tendency",
    phonetic: "/ˈtendənsi/",
    meaning: "趋势，倾向",
    example: "There is a growing tendency for people to work from home.",
    exampleCn: "人们在家工作的趋势日益增长。"
  },
  {
    id: 100,
    word: "vulnerable",
    phonetic: "/ˈvʌlnərəbl/",
    meaning: "脆弱的，易受伤的",
    example: "Children are the most vulnerable members of our society.",
    exampleCn: "儿童是我们社会中最脆弱的成员。"
  }
];

export default vocabulary;
