# -*- coding: utf-8 -*-
"""emoji 官方英文名专用词表 + 机械直译引擎 —— 给 符号/build_emoji_zh.py 与 符号/build_zwj.py 共用。

两个消费者共用**同一份词表和同一个引擎**（`translate` / `segment` / `token_of`），
只是取的语料不同：`build_emoji_zh.py` 翻**单码位**的官方英文名（`GRINNING FACE`），
`build_zwj.py` 翻**序列**的（`man rowing boat`）。所以引擎放在这里而不是任一脚本里，
两份语料的词条也**分块写在下面**（「ZWJ 序列专用」那块），免得各自维护、语义漂移。

**为什么和 符号/译名词表.py 的 WORD 分开**

同一串字母在两边归属不同，合表会互相污染：

    CAT   音节表里是加拿大原住民音节的记音（`CAAI CAP CAT CAU CAX`），
          emoji 里是 🐱 的「猫」。
    MAN   卢恩/其他文字系统里是字母本名，emoji 里是「男人」。
    PIN / BAG / CAR / COW / HAT / BOX / EAR … 同理。

`译名词表.py` 的判据是「这个词在名字里的实际用法」，而它服务的直译名是
全局的、上下文无关的；emoji 名则是**独立语料**，自己的词频和义项都不同。
所以两边各自成表，同名不同义由**调用方**决定用哪张，不靠合并去调和。

导出的两个结构：

  EMOJI_WORD    单词 → 中文。emoji 名里该词的机械直译。
  EMOJI_PHRASE  整块短语 → 中文。优先于 EMOJI_WORD 命中（按最长匹配）。

⚠️ **改词表会把之前脚本产出的名字变成孤儿**：`build_emoji_zh.find_scope` 的放行条件是
「值 == CLDR 俗名」**或**「值 == 本脚本产出的直译」，第二条拿的是**当前引擎的输出**。
一改词表，旧引擎产出的值就既不等于新输出、也不是 CLDR 值，于是被当成「人工改过的名字」
永久冻结。实测（2026-09-14 加 `HOLDING HANDS` / `WITH BUNNY EARS` 等短语后）搁浅 6 条，
判定与修法见 `符号/docs/设计/数据说明.md` §六。

找不到的词走 符号/译名词表.py 的 WORD 兜底（只兜 WORD，**不兜 KEEP**：
KEEP 是"原样保留"的记音/专名，emoji 名里没有这种词）。
两边都没有的词，翻译器原样保留并在报告里列出来，等人补。
"""

# ---- 单词 ----

EMOJI_WORD = {
    # ============ 脸 / 表情 / 情绪 ============
    'FACE': '脸', 'FACING': '朝向', 'FRONT-FACING': '正面',
    'SMILING': '微笑', 'SMILE': '微笑', 'GRINNING': '咧嘴笑', 'GRIMACING': '龇牙咧嘴',
    'BEAMING': '露齿笑', 'LAUGHING': '大笑', 'ROLLING': '打滚',
    'WINKING': '眨眼', 'KISSING': '亲吻', 'KISS': '亲吻', 'BLOWING': '吹',
    'THROWING': '抛出', 'HEART-SHAPED': '心形', 'STAR-STRUCK': '追星',
    'MOUTH': '嘴', 'OPEN': '张开', 'LIPS': '嘴唇', 'TONGUE': '舌头',
    'STUCK-OUT': '伸出的', 'MONEY-MOUTH': '金钱嘴', 'ZIPPER-MOUTH': '拉链嘴',
    'TIGHTLY-CLOSED': '紧闭', 'CLOSED': '闭', 'EYES': '眼睛', 'EYE': '眼睛',
    'EYEBROW': '眉毛', 'NOSE': '鼻子', 'EAR': '耳朵', 'EARS': '耳朵',
    'HAND': '手', 'HANDS': '双手', 'PALM': '手掌', 'PALMS': '双手手掌',
    'BACKHAND': '手背', 'FINGER': '手指', 'FINGERS': '手指', 'THUMB': '拇指',
    'THUMBS': '拇指', 'INDEX': '食指', 'NAIL': '指甲', 'POLISH': '抛光',
    'LEG': '腿', 'FOOT': '脚', 'FOOTPRINTS': '脚印', 'PRINTS': '印迹',
    'FINGERPRINT': '指纹', 'BRAIN': '脑', 'LUNGS': '肺', 'TOOTH': '牙齿',
    'BONE': '骨头', 'SKULL': '骷髅', 'HEART': '心', 'HEARTS': '心', 'HEARTBEAT': '心跳',
    'SWEAT': '汗', 'DROPLET': '水滴', 'DROP': '滴', 'TEAR': '泪', 'TEARS': '泪',
    'DIZZY': '晕眩', 'SUNGLASSES': '太阳镜', 'GLASSES': '眼镜', 'EYEGLASSES': '眼镜',
    'GOGGLES': '护目镜', 'MASK': '口罩', 'MEDICAL': '医疗', 'THERMOMETER': '温度计',
    'BANDAGE': '绷带', 'HEAD-BANDAGE': '头绷带', 'ADHESIVE': '胶布',
    'CRUTCH': '拐杖', 'STETHOSCOPE': '听诊器', 'SYRINGE': '注射器',
    'BLOOD': '血', 'X-RAY': 'X光', 'PILL': '药丸',
    'HEAD': '头', 'HORN': '角', 'HORNS': '角', 'HALO': '光环',
    'CROWN': '皇冠', 'RIBBON': '丝带', 'BALLOON': '气球', 'BUBBLE': '气泡',
    'BUBBLES': '泡泡', 'SPEECH': '对话', 'THOUGHT': '思考',
    'MONOCLE': '单片眼镜', 'NERD': '书呆子', 'COWBOY': '牛仔', 'DISGUISED': '伪装',
    'CLOWN': '小丑', 'OGRE': '食人魔', 'GOBLIN': '哥布林', 'GHOST': '鬼',
    'ALIEN': '外星人', 'EXTRATERRESTRIAL': '外星', 'MONSTER': '怪物', 'ROBOT': '机器人',
    'IMP': '小恶魔', 'POO': '便便', 'PILE': '堆',
    # 表情状态词
    'HAPPY': '开心', 'JOY': '喜悦', 'LOVE': '爱', 'KISSING_': '亲吻',
    'SLIGHTLY': '微微', 'RELIEVED': '释然', 'WEARY': '疲惫', 'TIRED': '疲倦',
    'SLEEPING': '睡觉', 'SLEEPY': '困倦', 'YAWNING': '打哈欠', 'DROOLING': '流口水',
    'PENSIVE': '沉思', 'THINKING': '思考', 'NEUTRAL': '无表情',
    'EXPRESSIONLESS': '面无表情', 'SMIRKING': '坏笑', 'UNAMUSED': '不悦',
    'DISAPPOINTED': '失望', 'WORRIED': '担忧', 'ANXIOUS': '焦虑',
    'FROWNING': '皱眉', 'POUTING': '撅嘴', 'CRYING': '哭', 'SOBBING': '抽泣',
    'ANGUISHED': '痛苦', 'FEARFUL': '恐惧', 'FEAR': '恐惧', 'SCREAMING': '尖叫',
    'LOUDLY': '大声', 'SHOCKED': '震惊', 'ASTONISHED': '惊愕',
    'FLUSHED': '脸红', 'CONFUSED': '困惑', 'CONFOUNDED': '错愕',
    'PERSEVERING': '坚持', 'TRIUMPH': '得意', 'ANGRY': '生气', 'ANGER': '生气',
    'SERIOUS': '严肃', 'PLEADING': '恳求', 'HUSHED': '噤声', 'SALUTING': '敬礼',
    'DISTORTED': '扭曲', 'UNEVEN': '歪斜', 'WAVY': '波浪',
    'NAUSEATED': '恶心', 'VOMITING': '呕吐', 'SNEEZING': '打喷嚏',
    'OVERHEATED': '过热', 'FREEZING': '冻僵', 'EXPLODING': '爆炸',
    'SPARKLING': '闪亮', 'GROWING': '生长', 'BEATING': '跳动', 'BROKEN': '破碎',
    'SHAKING': '颤动', 'DOTTED': '虚线', 'LINE': '线', 'SPLAYED': '张开',
    'WRY': '苦笑', 'SEE-NO-EVIL': '非礼勿视', 'HEAR-NO-EVIL': '非礼勿听',
    'SPEAK-NO-EVIL': '非礼勿言', 'MELTING': '融化', 'UPSIDE-DOWN': '颠倒',
    'HUGGING': '拥抱', 'PEEKING': '偷看', 'SAVOURING': '品味', 'DELICIOUS': '美味',
    'FLEXED': '屈起', 'BICEPS': '肱二头肌', 'RAISED': '抬起', 'RAISING': '抬起',
    'HOLDING': '持', 'COVERING': '遮住', 'PUSHING': '推', 'PINCHED': '捏住',
    'PINCHING': '捏', 'FISTED': '握拳', 'FOLDED': '合拢', 'BOTH': '双手',
    'VICTORY': '胜利', 'CALL': '通话', 'ME': '我', 'GESTURE': '手势',
    'OK': 'OK', 'PRAY': '祈祷', 'TOGETHER': '合十', 'HANDSHAKE': '握手',
    'CELEBRATION': '庆祝', 'PARTY': '派对', 'POPPER': '拉炮', 'CONFETTI': '彩纸',
    'SELFIE': '自拍', 'VIEWER': '观察', 'INFORMATION': '信息', 'DESK': '服务台',
    'GOOD': '好', 'DEAF': '耳聋', 'AID': '辅助', 'HEARING': '听力',
    'BOWING': '鞠躬', 'DEEPLY': '深深', 'SHRUG': '耸肩', 'SLEUTH': '侦探',
    'SPY': '间谍', 'GUARDSMAN': '卫兵', 'NINJA': '忍者', 'WORKER': '工人',
    'OFFICER': '警官', 'POLICE': '警察', 'PART': '部分', 'BETWEEN': '之间',
    'ANATOMICAL': '解剖', 'BITING': '咬', 'CROSSED': '交叉', 'BAGS': '袋子',
    'UNDER': '下方', 'FIRST': '第一', 'SECOND': '第二', 'THIRD': '第三',
    # ============ 人 / 职业 / 家庭 ============
    'PERSON': '人', 'PEOPLE': '人', 'ADULT': '成人', 'CHILD': '儿童',
    'BABY': '婴儿', 'BOY': '男孩', 'GIRL': '女孩', 'MAN': '男人', 'WOMAN': '女人',
    'MANS': '男士', 'MENS': '男', 'WOMANS': '女士', 'WOMENS': '女',
    'MEN': '男人', 'WOMEN': '女人', 'OLDER': '年长', 'OLD': '老',
    'FAMILY': '家庭', 'COUPLE': '情侣', 'MOTHER': '母亲', 'FATHER': '父亲',
    'BRIDE': '新娘', 'PRINCE': '王子', 'PRINCESS': '公主', 'ANGEL': '天使',
    'SUPERHERO': '超级英雄', 'SUPERVILLAIN': '超级反派', 'MAGE': '法师',
    'VAMPIRE': '吸血鬼', 'MERPERSON': '人鱼', 'ELF': '精灵', 'ZOMBIE': '僵尸',
    'TROLL': '巨魔', 'HAIRY': '多毛', 'CREATURE': '生物', 'GENIE': '灯神',
    'BLOND': '金发', 'BEARDED': '有胡子', 'BALD': '秃顶', 'CURLY': '卷发',
    'HAIR': '头发', 'HAIRCUT': '理发', 'PREGNANT': '怀孕', 'BREAST-FEEDING': '哺乳',
    # KNEELING 是「下跪」不是「跪」：单用「跪」拼出的是「跪人」「男人跪」这种不成词的中文
    'KNEELING': '下跪', 'STANDING': '站立', 'RUNNER': '跑者', 'RUNNING': '跑步',
    'DANCER': '舞者', 'DANCING': '跳舞', 'LEVITATING': '飘浮',
    'BUSINESS': '商务', 'SUIT': '西装', 'TUXEDO': '燕尾服', 'TURBAN': '头巾',
    'GUA': '瓜皮帽', 'PI': '便帽', 'MAO': '毛式', 'HEADSCARF': '头巾',
    'VEIL': '头纱', 'MASSAGE': '按摩', 'PEDESTRIAN': '行人', 'WORKOUT': '健身',
    'CLIMBING': '攀爬', 'ROWBOAT': '划艇', 'SWIMMER': '游泳者',
    'CARTWHEEL': '侧手翻', 'JUGGLING': '杂耍', 'POSITION': '姿势',
    'BATH': '沐浴', 'STEAMY': '蒸汽', 'ROOM': '房间', 'CAMPING': '露营',
    'BUNNY': '兔耳', 'MARTIAL': '武术', 'UNIFORM': '制服', 'DOING': '做',
    'BUST': '半身像', 'BUSTS': '半身像', 'SILHOUETTE': '剪影',
    'FAMILIES': '家庭', 'GUIDE': '导盲', 'SERVICE': '服务', 'DOG_': '狗',
}

EMOJI_WORD.update({
    # ============ 动物 ============
    'MONKEY': '猴', 'GORILLA': '大猩猩', 'ORANGUTAN': '猩猩', 'DOG': '狗',
    'POODLE': '贵宾犬', 'WOLF': '狼', 'FOX': '狐狸', 'RACCOON': '浣熊',
    'CAT': '猫', 'LION': '狮子', 'TIGER': '老虎', 'LEOPARD': '豹',
    'HORSE': '马', 'UNICORN': '独角兽', 'ZEBRA': '斑马', 'DEER': '鹿',
    'BISON': '野牛', 'OX': '公牛', 'BUFFALO': '水牛', 'COW': '奶牛',
    'BOAR': '野猪', 'PIG': '猪', 'RAM': '公羊', 'GOAT': '山羊',
    'DROMEDARY': '单峰驼', 'BACTRIAN': '双峰驼', 'CAMEL': '骆驼',
    'LLAMA': '羊驼', 'GIRAFFE': '长颈鹿', 'ELEPHANT': '大象',
    'MAMMOTH': '猛犸', 'RHINOCEROS': '犀牛', 'HIPPOPOTAMUS': '河马',
    'MOUSE': '老鼠', 'RAT': '鼠', 'HAMSTER': '仓鼠', 'RABBIT': '兔子',
    'CHIPMUNK': '花栗鼠', 'BEAVER': '海狸', 'HEDGEHOG': '刺猬',
    'BAT': '蝙蝠', 'BEAR': '熊', 'KOALA': '考拉', 'PANDA': '熊猫',
    'SLOTH': '树懒', 'OTTER': '水獭', 'SKUNK': '臭鼬', 'KANGAROO': '袋鼠',
    'BADGER': '獾', 'PAW': '爪', 'TURKEY': '火鸡', 'CHICKEN': '鸡',
    'ROOSTER': '公鸡', 'CHICK': '小鸡', 'HATCHING': '孵化', 'BIRD': '鸟',
    'PENGUIN': '企鹅', 'EAGLE': '鹰', 'DUCK': '鸭子', 'SWAN': '天鹅',
    'OWL': '猫头鹰', 'DODO': '渡渡鸟', 'FEATHER': '羽毛', 'FLAMINGO': '火烈鸟',
    'PEACOCK': '孔雀', 'PARROT': '鹦鹉', 'WING': '翅膀', 'WINGS': '翅膀',
    'GOOSE': '鹅', 'FROG': '青蛙', 'CROCODILE': '鳄鱼', 'TURTLE': '乌龟',
    'LIZARD': '蜥蜴', 'SNAKE': '蛇', 'SAUROPOD': '蜥脚龙', 'T-REX': '霸王龙',
    'SPOUTING': '喷水', 'WHALE': '鲸', 'DOLPHIN': '海豚', 'ORCA': '虎鲸',
    'SEAL': '海豹', 'BLOWFISH': '河豚', 'SHARK': '鲨鱼', 'OCTOPUS': '章鱼',
    'SHELL': '贝壳', 'CORAL': '珊瑚', 'JELLYFISH': '水母', 'LOBSTER': '龙虾',
    'SHRIMP': '虾', 'SQUID': '鱿鱼', 'OYSTER': '牡蛎', 'SNAIL': '蜗牛',
    'BUTTERFLY': '蝴蝶', 'BUG': '虫', 'ANT': '蚂蚁', 'HONEYBEE': '蜜蜂',
    'LADY': '瓢虫', 'BEETLE': '甲虫', 'COCKROACH': '蟑螂', 'WEB': '蛛网',
    'SPIDER': '蜘蛛', 'SCORPION': '蝎子', 'CRICKET': '蟋蟀', 'MOSQUITO': '蚊子',
    'FLY': '苍蝇', 'WORM': '蠕虫', 'MICROBE': '微生物',
    # ============ 植物 ============
    'BOUQUET': '花束', 'CHERRY': '樱花', 'BLOSSOM': '花', 'ROSETTE': '莲座',
    'ROSE': '玫瑰', 'HIBISCUS': '木槿', 'SUNFLOWER': '向日葵', 'TULIP': '郁金香',
    'HYACINTH': '风信子', 'SEEDLING': '幼苗', 'POTTED': '盆栽', 'PLANT': '植物',
    'EVERGREEN': '常绿', 'DECIDUOUS': '落叶', 'TREE': '树', 'PALM': '手掌',
    'CACTUS': '仙人掌', 'HERB': '香草', 'CLOVER': '三叶草', 'MAPLE': '枫',
    'FALLEN': '落叶的', 'LEAF': '叶', 'LEAFY': '多叶', 'FLUTTERING': '飘扬',
    'EMPTY': '空', 'NEST': '巢', 'NESTING': '套叠', 'EGGS': '蛋', 'EGG': '蛋',
    'MUSHROOM': '蘑菇', 'LEAFLESS': '光秃', 'LOTUS': '莲花', 'FLOWER': '花',
    'WILTED': '枯萎', 'FLOWERS': '花', 'SPROUT': '芽',
    # ============ 食物 ============
    'GRAPES': '葡萄', 'MELON': '甜瓜', 'WATERMELON': '西瓜',
    'TANGERINE': '柑橘', 'LEMON': '柠檬', 'BANANA': '香蕉', 'PINEAPPLE': '菠萝',
    'MANGO': '芒果', 'APPLE': '苹果', 'PEAR': '梨', 'PEACH': '桃',
    'CHERRIES': '樱桃', 'STRAWBERRY': '草莓', 'BLUEBERRIES': '蓝莓',
    'KIWIFRUIT': '猕猴桃', 'TOMATO': '番茄', 'OLIVE': '橄榄', 'COCONUT': '椰子',
    'AVOCADO': '牛油果', 'AUBERGINE': '茄子', 'POTATO': '土豆', 'CARROT': '胡萝卜',
    'MAIZE': '玉米', 'CUCUMBER': '黄瓜', 'BROCCOLI': '西兰花', 'PEANUTS': '花生',
    'BEANS': '豆', 'CHESTNUT': '栗子', 'GINGER': '姜', 'ROOT': '根',
    'PEA': '豌豆', 'POD': '豆荚', 'TROPICAL': '热带', 'FRUIT': '水果',
    'CROISSANT': '牛角包', 'BAGUETTE': '法棍', 'FLATBREAD': '薄饼',
    'PRETZEL': '椒盐卷饼', 'BAGEL': '贝果', 'PANCAKES': '薄煎饼',
    'WAFFLE': '华夫饼', 'CHEESE': '奶酪', 'WEDGE': '一角', 'POULTRY': '禽肉',
    'CUT': '切块', 'BACON': '培根', 'HAMBURGER': '汉堡', 'FRENCH': '法式',
    'FRIES': '薯条', 'SLICE': '片', 'PIZZA': '披萨', 'SANDWICH': '三明治',
    'TACO': '墨西哥卷饼', 'BURRITO': '墨西哥卷', 'TAMALE': '墨西哥粽',
    'FALAFEL': '炸豆丸', 'COOKING': '烹饪', 'SHALLOW': '浅', 'PAN': '平底锅',
    'POT': '锅', 'FONDUE': '奶酪火锅', 'SALAD': '沙拉', 'POPCORN': '爆米花',
    'BUTTER': '黄油', 'SALT': '盐', 'SHAKER': '瓶', 'CANNED': '罐装',
    'BENTO': '便当', 'CRACKER': '饼干', 'COOKED': '熟', 'RICE': '米饭',
    'CURRY': '咖喱', 'STEAMING': '冒热气', 'SPAGHETTI': '意大利面',
    'ROASTED': '烤', 'SWEET': '甜', 'ODEN': '关东煮', 'SUSHI': '寿司',
    'SWIRL': '漩涡', 'DESIGN': '花纹', 'DUMPLING': '饺子', 'FORTUNE': '幸运',
    'TAKEOUT': '外卖', 'SOFT': '软', 'SHAVED': '刨', 'ICE': '冰',
    'CREAM': '奶油', 'DOUGHNUT': '甜甜圈', 'BIRTHDAY': '生日', 'CAKE': '蛋糕',
    'SHORTCAKE': '海绵蛋糕', 'CUPCAKE': '纸杯蛋糕', 'PIE': '派', 'CHOCOLATE': '巧克力',
    'CANDY': '糖果', 'LOLLIPOP': '棒棒糖', 'CUSTARD': '蛋奶冻', 'HONEY': '蜂蜜',
    'MILK': '牛奶', 'BABY_': '婴儿', 'BOTTLE': '瓶', 'TEAPOT': '茶壶',
    'TEACUP': '茶杯', 'HANDLE': '柄', 'SAKE': '清酒', 'POPPING': '开瓶',
    'CORK': '软木塞', 'WINE': '葡萄酒', 'COCKTAIL': '鸡尾酒', 'MUG': '马克杯',
    'MUGS': '马克杯', 'POURING': '倾倒', 'LIQUID': '液体', 'STRAW': '吸管',
    'TEA': '茶', 'MATE': '马黛茶', 'CUBE': '块', 'CHOPSTICKS': '筷子',
    'PLATE': '盘', 'HOCHO': '巧克力', 'AMPHORA': '双耳瓶', 'DRINK': '饮品',
    'BEER': '啤酒', 'CLINKING': '碰杯', 'FORK': '叉', 'SPOON': '勺',
    'KNIFE': '刀', 'BOWL': '碗', 'COOKIE': '曲奇', 'CUP': '杯',
    'HOT': '热', 'PEPPER': '辣椒', 'BREAD': '面包', 'MEAT': '肉',
    'FOOD': '食物', 'TRAY': '托盘', 'BUBBLE_': '泡泡',
})

EMOJI_WORD.update({
    # ============ 自然 / 天气 / 天文 ============
    'SUN': '太阳', 'SUNRISE': '日出', 'SUNSET': '日落', 'DUSK': '黄昏',
    'MOON': '月亮', 'WAXING': '盈', 'WANING': '亏', 'GIBBOUS': '凸',
    'CRESCENT': '新月', 'FULL': '满', 'NEW': '新', 'LAST': '末',
    'STAR': '星', 'STARS': '星星', 'SHOOTING': '流星', 'GLOWING': '发光',
    'MILKY': '银河', 'WAY': '带', 'EARTH': '地球', 'GLOBE': '地球',
    'MERIDIANS': '子午线', 'WORLD': '世界', 'PLANET': '行星', 'RINGED': '带环',
    'CLOUD': '云', 'RAIN': '雨', 'STORM': '风暴', 'LIGHTNING': '闪电',
    'TORNADO': '龙卷风', 'FOG': '雾', 'FOGGY': '有雾', 'BLOWING': '吹',
    'CYCLONE': '气旋', 'RAINBOW': '彩虹', 'SNOW': '雪', 'SNOWFLAKE': '雪花',
    'SNOWMAN': '雪人', 'WIND': '风', 'WAVE': '浪', 'WAVES': '波浪',
    'WATER': '水', 'POTABLE': '饮用', 'NON-POTABLE': '非饮用',
    'FIRE': '火', 'FLAME': '火焰', 'VOLCANO': '火山', 'MOUNTAIN': '山',
    'MOUNTAINS': '群山', 'MOUNT': '山', 'FUJI': '富士', 'VOLCANIC': '火山',
    'DESERT': '沙漠', 'ISLAND': '岛', 'BEACH': '海滩', 'CAMPING_': '露营',
    'TENT': '帐篷', 'ROCK': '岩石', 'STONE': '石头', 'WOOD': '木头',
    'WOOD_': '木', 'BRICK': '砖', 'COLD': '冷', 'THERMOMETER_': '温度计',
    'LANDSLIDE': '滑坡', 'GARDEN': '花园', 'PARK': '公园', 'NATIONAL': '国家',
    'LEAF_': '叶',
    # ============ 交通 / 出行 ============
    'CAR': '汽车', 'CARS': '汽车', 'AUTOMOBILE': '汽车', 'AUTO': '汽车',
    'TAXI': '出租车', 'BUS': '公交车', 'MINIBUS': '小巴', 'TROLLEYBUS': '无轨电车',
    'TRUCK': '卡车', 'LORRY': '货车', 'DELIVERY': '配送', 'PICKUP': '皮卡',
    'ARTICULATED': '铰接式', 'TRACTOR': '拖拉机', 'MOTORCYCLE': '摩托车',
    'SCOOTER': '踏板车', 'MOTOR': '机动', 'MANUAL': '手动', 'MOTORIZED': '电动',
    'WHEELCHAIR': '轮椅', 'RICKSHAW': '人力车', 'BICYCLE': '自行车',
    'BICYCLES': '自行车', 'BICYCLIST': '骑自行车的人', 'SKATEBOARD': '滑板',
    'SKATE': '滑冰', 'ROLLER': '轮滑', 'WHEEL': '轮', 'RAILWAY': '铁路',
    'RAIL': '铁轨', 'TRAIN': '火车', 'LOCOMOTIVE': '机车', 'STEAM': '蒸汽',
    'BULLET': '高速', 'HIGH-SPEED': '高速', 'METRO': '地铁', 'TRAM': '有轨电车',
    'TRAMWAY': '缆车', 'CABLEWAY': '索道', 'AERIAL': '架空', 'SUSPENSION': '悬索',
    'MONORAIL': '单轨', 'STATION': '车站', 'DEPARTURE': '出发', 'ARRIVING': '到达',
    'ONCOMING': '迎面', 'POLICE_': '警车', 'AMBULANCE': '救护车',
    'ENGINE': '引擎', 'RECREATIONAL': '休闲', 'VEHICLE': '车辆', 'TRAFFIC': '交通',
    'LIGHT': '灯', 'MOTORWAY': '高速公路', 'TRACK': '赛道', 'OIL': '油',
    'RACING': '赛车', 'STOP': '停止', 'HORIZONTAL': '横', 'VERTICAL': '竖',
    'OCTAGONAL': '八角', 'BUOY': '浮标', 'SHIP': '船', 'BOAT': '船',
    'CANOE': '独木舟', 'SPEEDBOAT': '快艇', 'PASSENGER': '客', 'FERRY': '渡轮',
    'SAILBOAT': '帆船', 'AIRPLANE': '飞机', 'FLYING': '飞行', 'SAUCER': '飞碟',
    'ROCKET': '火箭', 'SATELLITE': '卫星', 'PARACHUTE': '降落伞',
    'HELICOPTER': '直升机', 'SEAT': '座位', 'LUGGAGE': '行李', 'BAGGAGE': '行李',
    'PILOT': '飞行员', 'TRAVEL': '旅行',
    # ============ 场所 / 建筑 ============
    'BUILDING': '建筑', 'BUILDINGS': '建筑', 'HOUSE': '房屋', 'HUT': '小屋',
    'DERELICT': '废弃', 'OFFICE': '办公楼', 'POST': '邮政', 'EUROPEAN': '欧洲',
    'HOSPITAL': '医院', 'BANK': '银行', 'HOTEL': '酒店', 'CONVENIENCE': '便利',
    'STORE': '商店', 'SCHOOL': '学校', 'DEPARTMENT': '百货', 'FACTORY': '工厂',
    'CASTLE': '城堡', 'JAPANESE': '日本', 'WEDDING': '婚礼', 'TOKYO': '东京',
    'TOWER': '塔', 'STATUE': '雕像', 'LIBERTY': '自由', 'MOSQUE': '清真寺',
    'HINDU': '印度教', 'TEMPLE': '寺庙', 'SYNAGOGUE': '犹太会堂', 'KAABA': '克尔白',
    'CHURCH': '教堂', 'CITYSCAPE': '城市景观', 'NIGHT': '夜', 'BRIDGE': '桥',
    'CAROUSEL': '旋转木马', 'PLAYGROUND': '游乐场', 'SLIDE': '滑梯',
    'FERRIS': '摩天', 'COASTER': '过山车', 'BARBER': '理发店', 'CIRCUS': '马戏团',
    'STADIUM': '体育场', 'CLASSICAL': '古典', 'PLACE': '场所', 'FOUNTAIN': '喷泉',
    'HEADSTONE': '墓碑', 'MOYAI': '摩艾像', 'PLACARD': '标牌',
    'RESTROOM': '洗手间', 'CLOSET': '储物间', 'DOOR': '门', 'ELEVATOR': '电梯',
    'WINDOW': '窗', 'BED': '床', 'COUCH': '沙发', 'CHAIR': '椅子',
    'TOILET': '马桶', 'SHOWER': '淋浴', 'BATHTUB': '浴缸', 'MIRROR': '镜子',
})

EMOJI_WORD.update({
    # ============ 时间 ============
    'CLOCK': '钟', 'OCLOCK': '点', 'WATCH': '表', 'ALARM': '闹钟',
    'HOURGLASS': '沙漏', 'TIMER': '计时器', 'CALENDAR': '日历',
    'MANTELPIECE': '壁炉台', 'TWELVE-THIRTY': '十二点半',
    'ONE-THIRTY': '一点半', 'TWO-THIRTY': '两点半',
    'THREE-THIRTY': '三点半', 'FOUR-THIRTY': '四点半',
    'FIVE-THIRTY': '五点半', 'SIX-THIRTY': '六点半',
    'SEVEN-THIRTY': '七点半', 'EIGHT-THIRTY': '八点半',
    'NINE-THIRTY': '九点半', 'TEN-THIRTY': '十点半',
    'ELEVEN-THIRTY': '十一点半',
    # ============ 数字 / 符号 ============
    'ONE': '一', 'TWO': '二', 'THREE': '三', 'FOUR': '四', 'FIVE': '五',
    'SIX': '六', 'SEVEN': '七', 'EIGHT': '八', 'NINE': '九', 'TEN': '十',
    'ELEVEN': '十一', 'TWELVE': '十二', 'THIRTY': '三十', 'EIGHTEEN': '十八',
    'HUNDRED': '百', 'QUARTER': '四分之一', 'NUMBERS': '数字',
    'SYMBOL': '符号', 'SYMBOLS': '符号', 'SIGN': '符号', 'MARK': '符号',
    'SQUARED': '方形', 'SQUARE': '方形', 'NEGATIVE': '反白',
    'CIRCLED': '圆圈', 'CIRCLE': '圆圈', 'TRIANGLE': '三角',
    'TRIANGULAR': '三角形', 'DIAMOND': '菱形', 'STAR_': '星',
    'ARROW': '箭头', 'ARROWS': '箭头', 'RIGHTWARDS': '向右',
    'LEFTWARDS': '向左', 'UPWARDS': '向上', 'DOWNWARDS': '向下',
    'LEFT-POINTING': '向左指', 'RIGHT-POINTING': '向右指',
    'UP-POINTING': '向上指', 'DOWN-POINTING': '向下指',
    'POINTING': '指', 'UP': '上', 'DOWN': '下', 'LEFT': '左', 'RIGHT': '右',
    'MIDDLE': '中', 'ABOVE': '上方', 'LOWER': '下方', 'LOWERED': '放下',
    'TOP': '上', 'HIGH': '高', 'LOW': '低', 'HEAVY': '粗',
    'WHITE': '空心', 'BLACK': '实心', 'RED': '红', 'GREEN': '绿',
    'BLUE': '蓝', 'ORANGE': '橙', 'YELLOW': '黄', 'PURPLE': '紫',
    'BROWN': '棕', 'PINK': '粉', 'GREY': '灰',
    'EQUALS': '等号', 'NEGATIVE_': '负', 'CURRENCY': '货币',
    'EXCHANGE': '兑换', 'TRIDENT': '三叉戟', 'EMBLEM': '徽章',
    'NAME': '名称', 'BADGE': '徽章', 'BEGINNER': '新手', 'SPLATTER': '溅射',
    'SHAPE': '形状', 'INSIDE': '内', 'CHEQUERED': '方格', 'FLAG': '旗',
    'FLAGS': '旗帜', 'CANCELLATION': '取消', 'STROKE': '斜线', 'SPIRAL': '螺旋',
    'CROSS': '十字', 'DOT': '点', 'BARS': '信号', 'WIRELESS': '无线',
    'VIBRATION': '振动', 'MODE': '模式', 'OFF': '关', 'FREE': '免费',
    'CLOCKWISE': '顺时针', 'ANTICLOCKWISE': '逆时针', 'REVOLVING': '旋转',
    'DECORATION': '装饰', 'COMPONENT': '部件', 'VARIATION': '变体',
    'AB': 'AB', 'CL': 'CL', 'ID': 'ID', 'NG': 'NG', 'SOS': 'SOS', 'VS': 'VS',
    # ============ 音乐 / 声音 ============
    'MUSICAL': '音乐', 'NOTE': '音符', 'NOTES': '音符', 'SCORE': '乐谱',
    'STUDIO': '录音室', 'LEVEL': '电平', 'SLIDER': '滑块', 'KNOBS': '旋钮',
    'DRUM': '鼓', 'DRUMSTICKS': '鼓槌', 'SAXOPHONE': '萨克斯', 'TRUMPET': '小号',
    'TROMBONE': '长号', 'ACCORDION': '手风琴', 'GUITAR': '吉他',
    'KEYBOARD': '键盘', 'VIOLIN': '小提琴', 'BANJO': '班卓琴',
    'MARACAS': '沙锤', 'FLUTE': '长笛', 'HARP': '竖琴', 'BELL': '铃铛',
    'CHIME': '风铃', 'SPEAKER': '扬声器', 'SOUND': '声音', 'LOUDSPEAKER': '喇叭',
    'MICROPHONE': '麦克风', 'STUDIO_': '录音', 'CONTROL': '控制', 'RADIO': '收音机',
    'HEADPHONE': '耳机', 'MEGAPHONE': '扩音器', 'CHEERING': '欢呼',
    'MULTIPLE': '多个', 'CINEMA': '电影院', 'PERFORMING': '表演',
    'ARTS': '艺术', 'MICROPHONE_': '麦克风', 'SPEAKER_': '音箱',
    # ============ 科技 / 电子 ============
    'COMPUTER': '电脑', 'DESKTOP': '台式', 'PRINTER': '打印机', 'MOUSE_': '鼠标',
    'TRACKBALL': '轨迹球', 'MINIDISC': '迷你光盘', 'FLOPPY': '软盘',
    'DISK': '磁盘', 'OPTICAL': '光盘', 'DVD': 'DVD', 'BATTERY': '电池',
    'ELECTRIC': '电动', 'PLUG': '插头', 'MOBILE': '移动', 'PHONE': '电话',
    'PHONES': '电话', 'TELEPHONE': '电话', 'RECEIVER': '听筒', 'PAGER': '寻呼机',
    'FAX': '传真', 'ANTENNA': '天线', 'CAMERA': '相机', 'VIDEO': '录像',
    'FILM': '胶片', 'MOVIE': '电影', 'FRAME': '画格', 'FRAMES': '胶片格',
    'PROJECTOR': '放映机', 'CLAPPER': '场记板', 'BOARD': '板',
    'TELEVISION': '电视', 'FLASH': '闪光', 'VIDEOCASSETTE': '录像带',
    'MAGNIFYING': '放大', 'LAMP': '灯', 'TORCH': '手电', 'CANDLE': '蜡烛',
    'BULB': '灯泡', 'LANTERN': '灯笼', 'DIYA': '油灯', 'COMPUTER_': '电脑',
    'JOYSTICK': '操纵杆', 'SLOT': '老虎机', 'MACHINE': '机器',
    'AUTOMATED': '自动', 'TELLER': '柜员机', 'E-MAIL': '电子邮件',
    'INCOMING': '来信', 'OUTBOX': '发件箱', 'INBOX': '收件箱', 'PACKAGE': '包裹',
    'POSTBOX': '邮箱', 'POSTAL': '邮政', 'MAILBOX': '信箱', 'ENVELOPE': '信封',
    # ============ 办公 / 文具 ============
    'NOTEBOOK': '笔记本', 'PAGE': '页面', 'BOOK': '书', 'BOOKS': '书',
    'NEWSPAPER': '报纸', 'BOOKMARK': '书签', 'LEDGER': '账本', 'CURL': '卷边',
    'SCROLL': '卷轴', 'ROLLED-UP': '卷起', 'TABS': '标签页', 'LABEL': '标签',
    'MEMO': '备忘录', 'BRIEFCASE': '公文包', 'DIVIDERS': '分隔页',
    'TEAR-OFF': '撕页', 'CLIPBOARD': '写字板', 'PAPERCLIP': '回形针',
    'PAPERCLIPS': '回形针', 'LINKED': '连结', 'STRAIGHT': '直', 'RULER': '直尺',
    'CABINET': '文件柜', 'WASTEBASKET': '废纸篓', 'INK': '墨水', 'PEN': '笔',
    'BALLPOINT': '圆珠笔', 'PAINTBRUSH': '画笔', 'CRAYON': '蜡笔',
    'PUSHPIN': '图钉', 'PIN': '别针', 'PAPER': '纸', 'FILE': '文件夹',
    'FOLDER': '文件夹', 'PAD': '便签本', 'CHART': '图表', 'TRAY': '托盘',
    'BALLOT': '选票', 'CARD': '卡', 'CARDS': '牌', 'INDEX_': '索引',
    # ============ 钱 / 购物 ============
    'MONEY': '钱', 'DOLLAR': '美元', 'EURO': '欧元', 'POUND': '英镑',
    'BANKNOTE': '纸币', 'COIN': '硬币', 'TREASURE': '宝物', 'CHEST': '箱',
    'CREDIT': '信用卡', 'RECEIPT': '收据', 'SHOPPING': '购物',
    'ADMISSION': '入场', 'TICKETS': '票', 'TICKET': '票', 'GIFT': '礼物',
    'WRAPPED': '包装', 'PRESENT': '礼物', 'REMINDER': '提醒',
    # ============ 工具 / 武器 ============
    'HAMMER': '锤子', 'WRENCH': '扳手', 'SCREWDRIVER': '螺丝刀', 'NUT': '螺母',
    'BOLT': '螺栓', 'SAW': '锯', 'CARPENTRY': '木工', 'AXE': '斧头',
    'DAGGER': '匕首', 'BOMB': '炸弹', 'BOOMERANG': '回旋镖', 'SHIELD': '盾牌',
    'TOOLBOX': '工具箱', 'MAGNET': '磁铁', 'LADDER': '梯子', 'SHOVEL': '铲子',
    'CANE': '手杖', 'LINK': '链环', 'HOOK': '钩', 'COMPRESSION': '压缩',
    'PROBING': '探测', 'TRAP': '陷阱', 'RAZOR': '剃刀', 'BROOM': '扫帚',
    'BASKET': '篮子', 'ROLL': '卷', 'BUCKET': '水桶', 'SOAP': '肥皂',
    'TOOTHBRUSH': '牙刷', 'SPONGE': '海绵', 'EXTINGUISHER': '灭火器',
    'TROLLEY': '推车', 'PLUNGER': '搋子', 'LOTION': '乳液', 'MILITARY': '军用',
    'PISTOL': '手枪', 'BOW': '弓', 'ARROW_': '箭', 'SPEAR': '矛',
    # ============ 科学 / 医疗 ============
    'TEST': '试管', 'TUBE': '管', 'PETRI': '培养皿', 'DISH': '皿',
    'MICROSCOPE': '显微镜', 'TELESCOPE': '望远镜', 'LAB': '实验服',
    'CRYSTAL': '水晶球', 'MAGIC': '魔法', 'WAND': '魔杖', 'SCIENTIST': '科学家',
    # ============ 运动 / 游戏 ============
    'FOOTBALL': '足球', 'TENNIS': '网球', 'RACQUET': '球拍', 'DISC': '飞盘',
    'HOCKEY': '冰球', 'SKI': '滑雪', 'GAME': '游戏', 'PLAYING': '玩',
    'SOFTBALL': '垒球', 'BASKETBALL': '篮球', 'HOOP': '篮筐',
    'VOLLEYBALL': '排球', 'AMERICAN': '美式', 'RUGBY': '橄榄球',
    'BOWLING': '保龄球', 'FIELD': '场地', 'PUCK': '冰球', 'LACROSSE': '长曲棍球',
    'TABLE': '桌上', 'PADDLE': '球拍', 'BADMINTON': '羽毛球',
    'SHUTTLECOCK': '羽毛球', 'BOXING': '拳击', 'GLOVE': '手套',
    'GOAL': '球门', 'NET': '球网', 'FISHING': '钓鱼', 'DIVING': '潜水',
    'SLED': '雪橇', 'CURLING': '冰壶', 'DIRECT': '正中', 'HIT': '击中',
    'YO-YO': '悠悠球', 'KITE': '风筝', 'BILLIARDS': '台球', 'DIE': '骰子',
    'JIGSAW': '拼图', 'PUZZLE': '拼图', 'PIECE': '块', 'TEDDY': '泰迪熊',
    'PINATA': '皮纳塔', 'JOKER': '王牌', 'MAHJONG': '麻将', 'TILE': '牌',
    'MEDAL': '奖牌', 'TROPHY': '奖杯', 'SPORTS': '体育', 'CRICKET_': '板球',
    # ============ 服饰 ============
    'COAT': '外套', 'SAFETY': '安全', 'SANDAL': '凉鞋', 'CAP': '帽',
    'HAT': '帽子', 'HELMET': '头盔', 'BILLED': '鸭舌', 'GRADUATION': '毕业',
    'SCARF': '围巾', 'GLOVES': '手套', 'SOCKS': '袜子', 'DRESS': '连衣裙',
    'KIMONO': '和服', 'SARI': '纱丽', 'ONE-PIECE': '连体', 'SWIMSUIT': '泳衣',
    'BRIEFS': '三角裤', 'SHORTS': '短裤', 'CLOTHES': '衣服', 'FOLDING': '折扇',
    'FAN': '扇', 'PURSE': '钱包', 'HANDBAG': '手提包', 'POUCH': '手袋',
    'SATCHEL': '书包', 'THONG': '人字拖', 'ATHLETIC': '运动', 'HIKING': '登山',
    'FLAT': '平底', 'HIGH-HEELED': '高跟鞋', 'BALLET': '芭蕾', 'SHOES': '鞋',
    'BOOT': '靴子', 'BOOTS': '靴子', 'SHOE': '鞋', 'T-SHIRT': 'T恤',
    'JEANS': '牛仔裤', 'NECKTIE': '领带', 'VEST': '背心', 'PICK': '尖镐',
    'PRAYER': '念珠', 'BEADS': '珠', 'LIPSTICK': '口红', 'GEM': '宝石',
    'GLASS': '玻璃杯', 'GLASSES': '眼镜', 'CROWN_': '王冠', 'RING': '戒指',
    # ============ 宗教 / 信仰 ============
    'WORSHIP': '礼拜', 'OM': '唵', 'MENORAH': '烛台', 'BRANCHES': '枝',
    'POINTED': '尖', 'KHANDA': '双刃剑', 'TWISTED': '扭转', 'OVERLAY': '叠加',
    'NAZAR': '避邪眼', 'AMULET': '护身符', 'HAMSA': '法蒂玛之手',
    # ============ 节庆 / 装饰 ============
    'CHRISTMAS': '圣诞', 'DOLLS': '人偶', 'PARTY_': '派对',
    'JACK-O-LANTERN': '南瓜灯', 'FIREWORKS': '烟花', 'FIREWORK': '烟花',
    'SPARKLER': '仙女棒', 'FIRECRACKER': '鞭炮', 'TANABATA': '七夕',
    'PINE': '松', 'CARP': '鲤鱼', 'STREAMER': '彩带', 'VIEWING': '观赏',
    'CEREMONY': '典礼', 'CONSTRUCTION': '施工', 'CARNIVAL': '嘉年华',
    # ============ 地理 ============
    'JAPAN': '日本', 'MAP': '地图', 'COMPASS': '指南针', 'CAPPED': '圆顶',
    'EUROPE-AFRICA': '欧非', 'AMERICAS': '美洲', 'ASIA-AUSTRALIA': '亚澳',
    # ============ 交通标志 / 公共场所 ============
    'CROSSING': '过街', 'CHILDREN': '儿童', 'ENTRY': '入口',
    'PEDESTRIANS': '行人', 'NO': '禁止', 'DO': '请', 'NOT': '勿',
    'PUT': '放', 'ITS': '其', 'PASSPORT': '护照', 'CUSTOMS': '海关',
    'CLAIM': '提取', 'IDENTIFICATION': '身份证', 'END': '结束',
    'PUBLIC': '公共', 'ADDRESS': '地址', 'WOMENS_': '女', 'MENS_': '男',
    'MODE_': '模式', 'LEVEL_': '电平', 'CINEMA_': '影院', 'COLOR': '彩色',
    'BUT': '仅', 'OR': '或', 'THE': '', 'A': '', 'IN': '在', 'AT': '在',
    'FOR': '用于', 'OF': '之', 'WITH': '带', 'WITHOUT': '无', 'AND': '和',
    'ON': '上', 'OVER': '越过', 'INTO': '入', 'TO': '至',
    'EMOJI': 'emoji', 'CJK': 'CJK', 'UNIFIED': '统一',
    'DIGIT': '数字', 'LATIN': '拉丁', 'GREEK': '希腊',
    # ============ 补漏（2026-09 首轮跑出来没覆盖的 53 词）============
    'BALL': '球', 'FISH': '鱼', 'BOX': '盒', 'BUTTON': '按钮', 'BAR': '条',
    'STICK': '棒', 'KEY': '钥匙', 'BACK': '背', 'BEHIND': '后面',
    'DRAGON': '龙', 'POLE': '竿', 'WAVING': '挥舞', 'TREND': '趋势',
    'BRIGHTNESS': '亮度', 'LOCK': '锁', 'INPUT': '输入', 'SMOKING': '吸烟',
    'MECHANICAL': '机械', 'ADVANTAGE': '优', 'ACCEPT': '可', 'ARTIST': '画家',
    'PALETTE': '调色板', 'SHIRT': '衬衫', 'SASH': '腰带', 'UMBRELLA': '伞',
    'IZAKAYA': '居酒屋', 'COLLISION': '碰撞', 'SPLASHING': '飞溅',
    'POINTS': '分', 'BAG': '袋', 'PERSONAL': '个人', 'ROUND': '圆头',
    'DECORATIVE': '装饰', 'COVER': '封面', 'HOLE': '洞', 'DARK': '深色',
    'PICTURE': '图', 'SPEAKING': '说话', 'LOOK': '神情', 'ACCOMMODATION': '住宿',
    'BELLHOP': '行李员', 'LYING': '躺', 'ARM': '手臂', 'ABACUS': '算盘',
    'SPOOL': '线轴', 'THREAD': '线', 'YARN': '毛线', 'SEWING': '缝纫',
    'NEEDLE': '针', 'KNOT': '结', 'DONKEY': '驴', 'LIP': '嘴唇', 'FIGHT': '打斗',
    # ============ 杂项符号区（U+2600-27BF，2026-09 纳入范围时补）============
    'CHECK': '勾选',
    'MALE': '男性',
    'FEMALE': '女性',
    'MUSIC': '乐谱',
    'MEDIUM': '中号',
    'LOOP': '循环',
    'RAYS': '光芒',
    'COMET': '彗星',
    'DROPS': '滴',
    'BEVERAGE': '饮料',
    'SHAMROCK': '三叶草',
    'CROSSBONES': '交叉骨',
    'RADIOACTIVE': '放射性',
    'BIOHAZARD': '生物危害',
    'ORTHODOX': '东正教',
    'PEACE': '和平',
    'YIN': '阴',
    'YANG': '阳',
    'DHARMA': '法',
    'ARIES': '白羊座',
    'TAURUS': '金牛座',
    'GEMINI': '双子座',
    'CANCER': '巨蟹座',
    'LEO': '狮子座',
    'VIRGO': '处女座',
    'LIBRA': '天秤座',
    'SCORPIUS': '天蝎座',
    'SAGITTARIUS': '射手座',
    'CAPRICORN': '摩羯座',
    'AQUARIUS': '水瓶座',
    'PISCES': '双鱼座',
    'OPHIUCHUS': '蛇夫座',
    'CHESS': '国际象棋',
    'PAWN': '兵',
    'SPADE': '黑桃',
    'CLUB': '梅花',
    'SPRINGS': '泉',
    'EIGHTH': '八分',
    'SHARP': '升号',
    'FLAT': '平底',
    'UNIVERSAL': '通用',
    'RECYCLING': '回收',
    'PERMANENT': '永久',
    'ANCHOR': '锚',
    'SWORDS': '剑',
    'STAFF': '杖',
    'AESCULAPIUS': '阿斯克勒庇俄斯',
    'SCALES': '天平',
    'ALEMBIC': '蒸馏器',
    'GEAR': '齿轮',
    'ATOM': '原子',
    'FLEUR-DE-LIS': '百合花饰',
    'WARNING': '警告',
    'VOLTAGE': '电压',
    'COFFIN': '棺材',
    'FUNERAL': '丧葬',
    'URN': '骨灰瓮',
    'SOCCER': '足球',
    'BASEBALL': '棒球',
    'THUNDER': '雷电',
    'CHAINS': '锁链',
    'SHINTO': '神道',
    'SHRINE': '神社',
    'GROUND': '地面',
    'SKIER': '滑雪者',
    'FUEL': '燃油',
    'PUMP': '泵',
    'SCISSORS': '剪刀',
    'WRITING': '写字',
    'PENCIL': '铅笔',
    'NIB': '笔尖',
    'MULTIPLICATION': '乘法',
    'DIVISION': '除法',
    'DAVID': '大卫',
    'SPARKLES': '闪光',
    'SPARKLE': '闪光',
    'SPOKED': '辐条',
    'ASTERISK': '星号',
    'X': 'X',
})

# ============ ZWJ 序列专用：人称 + 动作 / 状态 / 身份 ============
# build_zwj.py 拿这些词把 emoji-test 的**序列**英文名（`man rowing boat` 这种）直译成
# 中文名。词形是 emoji-test 里的原形（动名词 / 名词短语），与单码位那份语料重叠不多，
# 所以**另起一块**，不混进上面按语义分的那些块。
#
# 漏一个实词，整条序列名就会掉回英文原文（build_zwj 不再拿 CLDR 兜底，见该脚本 zh_of）。
EMOJI_WORD.update({
    # ---- 动作 / 运动 ----
    'SWIMMING': '游泳', 'SURFING': '冲浪', 'ROWING': '划船', 'WRESTLING': '摔跤',
    'GOLFING': '打高尔夫', 'BIKING': '骑自行车', 'CARTWHEELING': '侧手翻',
    'SHRUGGING': '耸肩', 'FACEPALMING': '捂脸', 'WALKING': '走路',
    'LIFTING': '举', 'WEIGHTS': '重物', 'BOUNCING': '拍', 'TIPPING': '倾斜',
    'GETTING': '接受', 'FEEDING': '喂', 'WEARING': '戴', 'GESTURING': '做手势',
    'MENDING': '修复', 'EXHALING': '呼气', 'HORIZONTALLY': '左右',
    # ---- 职业 / 身份 ----
    'COOK': '厨师', 'FARMER': '农民', 'STUDENT': '学生', 'TEACHER': '教师',
    'JUDGE': '法官', 'MECHANIC': '机械师', 'TECHNOLOGIST': '技术员',
    'SINGER': '歌手', 'ASTRONAUT': '宇航员', 'FIREFIGHTER': '消防员',
    'DETECTIVE': '侦探', 'GUARD': '卫兵', 'HEALTH': '医务',
    # ---- 神话 / 生物 ----
    'FAIRY': '小仙子', 'MERMAID': '美人鱼', 'MERMAN': '男人鱼',
    'PHOENIX': '凤凰', 'POLAR': '北极', 'LIME': '青柠', 'CHAIN': '链',
    'TRANSGENDER': '跨性别', 'PIRATE': '海盗', 'CLAUS': '克劳斯', 'MX': 'Mx',
    # ---- 属性 ----
    'BEARD': '胡须',
})

# ---- 短语（优先于单词，按最长匹配） ----
# 键是空格分隔的英文词；值是整块译法。用于：
#   · 语序要倒装的（X OF Y → Y之X 已在引擎里，这里放固定搭配）
#   · 一词多义要靠上下文定死的（CLOCK FACE 的 FACE 是"面"不是"脸"）
#   · 习惯说法比字面拼接自然的
EMOJI_PHRASE = {
    'CLOCK FACE': '钟面',
    'SQUARED CJK UNIFIED': '带方框',
    'CIRCLED IDEOGRAPH': '带圈汉字',
    'MOUNT FUJI': '富士山',
    'ROLLER COASTER': '过山车',
    'FERRIS WHEEL': '摩天轮',
    'MOBILE PHONE': '手机',
    'OPTICAL DISC': '光盘',
    'AMERICAN FOOTBALL': '美式橄榄球',
    'HEAR-NO-EVIL MONKEY': '非礼勿听猴',
    'SEE-NO-EVIL MONKEY': '非礼勿视猴',
    'SPEAK-NO-EVIL MONKEY': '非礼勿言猴',
    'DO NOT LITTER': '禁止乱扔垃圾',
    'PUT LITTER IN ITS PLACE': '垃圾请入桶',
    'NO ONE UNDER EIGHTEEN': '禁止未满十八岁',
    'NON-POTABLE WATER': '非饮用水',
    'POTABLE WATER': '饮用水',
    'CALL ME HAND': '打电话的手',
    'JAPANESE DOLLS': '日本人偶',
    'JAPANESE POST OFFICE': '日本邮局',
    'JAPANESE GOBLIN': '日本天狗',
    'CROSSED FLAGS': '交叉旗帜',
    'FOLDED HANDS': '合十的手',
    'REVERSED HAND': '反转的手',
    'RAISED HAND': '抬起的手',
    'WAVING HAND': '挥手',
    'FLEXED BICEPS': '屈起的肱二头肌',
    'PINCHED FINGERS': '捏指',
    'INDEX POINTING': '食指指',
    'THUMBS UP': '拇指向上',
    'THUMBS DOWN': '拇指向下',
    'FALLEN LEAF': '落叶',
    'LEAF FLUTTERING': '飘动的叶',
    'RED APPLE': '红苹果',
    'GREEN APPLE': '青苹果',
    'SOFT ICE CREAM': '冰淇淋',
    'SHAVED ICE': '刨冰',
    'FRENCH FRIES': '薯条',
    'CUT OF MEAT': '肉块',
    'POULTRY LEG': '禽腿',
    'BIRTHDAY CAKE': '生日蛋糕',
    'SHORTCAKE': '海绵蛋糕',
    'OPEN BOOK': '打开的书',
    'CLOSED BOOK': '合上的书',
    'GREEN BOOK': '绿书',
    'BLUE BOOK': '蓝书',
    'ORANGE BOOK': '橙书',
    'BOOKMARK TABS': '书签页',
    'TEAR-OFF CALENDAR': '撕页日历',
    'SPIRAL CALENDAR': '螺旋日历',
    'CARD INDEX': '卡片索引',
    'CARD INDEX DIVIDERS': '卡片分隔页',
    'FILE FOLDER': '文件夹',
    'OPEN FILE FOLDER': '打开的文件夹',
    'CLOSED MAILBOX': '合上的信箱',
    'OPEN MAILBOX': '打开的信箱',
    'CLOSED UMBRELLA': '合上的伞',
    'CLOSED LOCK': '闭合的锁',
    'OPEN LOCK': '打开的锁',
    'LOWER LEFT': '左下',
    'LEFT LUGGAGE': '寄存行李',
    'BAGGAGE CLAIM': '行李提取',
    'CUSTOMS': '海关',
    'PASSENGER SHIP': '客船',
    'HIGH-SPEED TRAIN': '高速列车',
    'LIGHT RAIL': '轻轨',
    'MOTOR BOAT': '摩托艇',
    'SMALL AIRPLANE': '小型飞机',
    'WORLD MAP': '世界地图',
    'GLOBE WITH MERIDIANS': '带子午线的地球',
    # ---- 语序倒装（英文头在前、中文头在后，靠短语定死）----
    'EARTH GLOBE ASIA-AUSTRALIA': '地球（亚洲澳洲）',
    'EARTH GLOBE EUROPE-AFRICA': '地球（欧洲非洲）',
    'EARTH GLOBE AMERICAS': '地球（美洲）',
    'FILE CABINET': '文件柜',
    'FIRE ENGINE': '消防车',
    'TEST TUBE': '试管',
    'MAGIC WAND': '魔杖',
    'FOLDING HAND FAN': '折扇',
    'FIREWORK SPARKLER': '仙女棒',
    'RICE BALL': '饭团',
    'FISH CAKE': '鱼糕',
    'FISHING POLE': '钓竿',
    'BARBER POLE': '理发店转筒',
    'BAR CHART': '条形图',
    'RADIO BUTTON': '单选按钮',
    'THREE BUTTON MOUSE': '三键鼠标',
    'CARD FILE BOX': '卡片文件盒',
    'CRICKET BAT': '板球拍',
    'FIELD HOCKEY': '曲棍球',
    'ICE HOCKEY': '冰球',
    'TABLE TENNIS': '乒乓球',
    'WHITE FLAG': '白旗',
    'BLACK FLAG': '黑旗',
    'WHITE SUN': '太阳',
    'WHITE HEART': '白心',
    'BLACK HEART': '黑心',
    'WHITE FLOWER': '白花',
    'SLEEPING ACCOMMODATION': '住宿',
    'SPEAKING HEAD IN SILHOUETTE': '剪影里的说话头',
    'RAISED BACK OF HAND': '抬起的手背',
    'OPEN LOCK': '打开的锁',
    'CLOSED LOCK': '闭合的锁',
    'SHOPPING BAGS': '购物袋',
    'SHOPPING TROLLEY': '购物推车',
    'SAFETY PIN': '安全别针',
    'SAFETY VEST': '安全背心',
    'POLICE CAR': '警车',
    'POLICE OFFICER': '警察',
    'POLICE CARS': '警车',
    'AMBULANCE': '救护车',
    'WOMANS CLOTHES': '女装',
    'MANS SHOE': '男鞋',
    'WOMANS HAT': '女帽',
    'WOMANS BOOTS': '女靴',
    'WOMANS SANDAL': '女式凉鞋',
    'NON-POTABLE WATER': '非饮用水',
    'BLUE HEART': '蓝心',
    'GREEN HEART': '绿心',
    'YELLOW HEART': '黄心',
    'ORANGE HEART': '橙心',
    'PURPLE HEART': '紫心',
    'BROWN HEART': '棕心',
    'BROKEN HEART': '心碎',
    'BEATING HEART': '跳动的心',
    'GROWING HEART': '生长的心',
    'SPARKLING HEART': '闪亮的心',
    'REVOLVING HEARTS': '旋转的心',
    'HEART WITH ARROW': '带箭的心',
    'HEART WITH RIBBON': '带丝带的心',
    'HEART DECORATION': '心形装饰',
    'TWO HEARTS': '两颗心',
    'THREE HEARTS': '三颗心',
    # ---- 一词多义：靠上下文定死的义项 ----
    'EAR OF RICE': '稻穗',
    'EAR OF MAIZE': '玉米穗',
    'ROLLING ON THE FLOOR LAUGHING': '在地上打滚大笑',
    'PART BETWEEN MIDDLE AND RING FINGERS': '分开的中指和无名指',
    'MIDDLE FINGER': '中指',
    'INDEX FINGER': '食指',
    'MIDDLE FINGERS': '中指',
    'POST OFFICE': '邮局',
    'DAGGER KNIFE': '匕首',
    'FLYING SAUCER': '飞碟',
    'BOTH HANDS': '双手',
    'CIRCLED ONE': '圈1',
    'AT LEFT': '在左',
    'WHITE RIGHT POINTING': '空心向右',
    'WHITE LEFT POINTING': '空心向左',
    'WHITE UP POINTING': '空心向上',
    'WHITE DOWN POINTING': '空心向下',
    'FILM FRAMES': '胶片格',
    'EXTRATERRESTRIAL ALIEN': '外星人',
    'JIGSAW PUZZLE': '拼图',
    'WHITE HAIR': '白发',
    'CURLY HAIR': '卷发',
    'RED HAIR': '红发',
    # 词义要靠上下文定：PALM 在 emoji 名里 4 次有 3 次是「手掌」，树的那次走这条
    'PALM TREE': '棕榈树',
    'PALM BRANCH': '棕榈枝',
    'PALM DOWN HAND': '掌心向下的手',
    'PALM UP HAND': '掌心向上的手',
    'FLAT SHOE': '平底鞋',
    'FACE PALM': '捂脸',
    'CROSSED SWORDS': '交叉的剑',
    'BLACK HEART SUIT': '实心红心花色',
    'SPADE SUIT': '黑桃花色',
    'CLUB SUIT': '梅花花色',
    'DIAMOND SUIT': '方片花色',
    'CHESS PAWN': '国际象棋兵',
    'EXCLAMATION MARK': '感叹号',
    'QUESTION MARK': '问号',
    'CHECK MARK': '对勾',
    'EIGHTH NOTE': '八分音符',
    'MUSIC FLAT SIGN': '降号',
    'MUSIC SHARP SIGN': '升号',
    'MULTIPLE MUSICAL NOTES': '多个音符',
    'HEAVY MULTIPLICATION X': '粗乘号',
    'YIN YANG': '阴阳',
    'WHEEL OF DHARMA': '法轮',
    'STAFF OF AESCULAPIUS': '阿斯克勒庇俄斯之杖',
    'STAR OF DAVID': '大卫之星',
    'SHINTO SHRINE': '神社',
    'FUNERAL URN': '骨灰瓮',
    'FUEL PUMP': '燃油泵',
    'SOCCER BALL': '足球',
    'HEAVY EXCLAMATION MARK': '粗感叹号',
    'BLACK UNIVERSAL RECYCLING': '实心通用回收',
    'SPOKED ASTERISK': '辐条星号',
    'JAPANESE POST OFFICE': '日本邮局',
    'HOT BEVERAGE': '热饮',
    'RAISED FIST': '举起的拳头',
    'WRITING HAND': '写字的手',
    'BLACK NIB': '黑笔尖',
    'UMBRELLA ON GROUND': '地上的伞',
    'HEART EXCLAMATION': '心形感叹号',
    'BOTH HANDS': '双手',
    'SAILBOAT': '帆船',
    # VICTORY+ HAND 逐词拼成「胜利手」，中文里没这词；这个手势叫「胜利手势」。
    # （`REVERSED VICTORY HAND` 早年被手工改成「反向胜利手势」就是这个道理，
    #   但没回到引擎层修，于是那条一直冻在 find_scope 范围外。补了这条短语它自动回范围。）
    'VICTORY HAND': '胜利手势',

    # ---- ZWJ 序列专用：要靠整块才翻得对的短语 ----
    # 单词分开拼会串味（`LIFTING WEIGHTS` 逐词是「举重物」，运动名该是「举重」），
    # 或者中文里根本不是逐词结构（`IN LOTUS POSITION`）。
    'LIFTING WEIGHTS': '举重',
    'ROWING BOAT': '划船',
    'MOUNTAIN BIKING': '骑山地车',
    'BOUNCING BALL': '拍球',
    'PLAYING WATER POLO': '玩水球',
    'PLAYING HANDBALL': '玩手球',
    'TIPPING HAND': '手心向上',
    'GESTURING NO': '做“不”的手势',
    'GESTURING OK': '做“好”的手势',
    'GETTING MASSAGE': '做按摩',
    'GETTING HAIRCUT': '理发',
    'FEEDING BABY': '喂婴儿',
    'IN STEAMY ROOM': '蒸桑拿',
    'IN LOTUS POSITION': '莲花坐',
    # 单码位那两条（🧖 🧘）英文名是 `person in …`。**别拿逐词拼的「人蒸桑拿」当名字**，
    # 也别砍掉人称只留活动名——两种读法各有各的用：
    #   `人在桑拿房` / `莲花坐的人` 是**完整直译**（一个说状态、一个说人），
    #   `蒸桑拿` / `莲花坐` 是**活动侧写**（对应 🚣 的主题轴名「划船」）。
    # 这里定的是直译值；活动侧写由 符号富化数据.js 的语境名/别名承担。
    'PERSON IN STEAMY ROOM': '人在桑拿房',
    'PERSON IN LOTUS POSITION': '莲花坐的人',
    'IN MANUAL WHEELCHAIR': '坐手动轮椅',
    'IN MOTORIZED WHEELCHAIR': '坐电动轮椅',
    'WITH WHITE CANE': '拄白手杖',
    'WITH BUNNY EARS': '戴兔耳',
    'HOLDING HANDS': '牵手',
    'HEAD SHAKING HORIZONTALLY': '左右摇头',
    'HEAD SHAKING VERTICALLY': '上下点头',
    'HEALTH WORKER': '医生',
    'BALLET DANCER': '芭蕾舞者',
    'MX CLAUS': '圣诞老人',
    'SERVICE DOG': '服务犬',
    'BLACK CAT': '黑猫',
    'BROWN MUSHROOM': '褐蘑菇',
    'POLAR BEAR': '北极熊',
    'BROKEN CHAIN': '断链',
    'MENDING HEART': '修复的心',
    'FACE EXHALING': '呼气的脸',
    'FACE IN CLOUDS': '云中的脸',
    'RAINBOW FLAG': '彩虹旗',
    'TRANSGENDER FLAG': '跨性别旗',
    'PIRATE FLAG': '海盗旗',
    'EYE IN SPEECH BUBBLE': '对话气泡里的眼睛',
    # BLACK 在这块符号语料里是「实心」（BLACK SQUARE 实心方块），落到鸟身上会变「实心鸟」
    'BLACK BIRD': '黑鸟',
    'HEART ON FIRE': '着火的心',
    'IN TUXEDO': '穿燕尾服',
    # ============ person 一族：语序倒装（2026-09-16）============
    # 英文把 PERSON 放句首（PERSON FROWNING），中文得把它挪到句尾说「…的人」。
    # 引擎里已有一条**通用**规则（末词 PERSON → 「…的人」、首词 PEOPLE → 「人们…」，
    # 见 translate），但盖不住这些带副词/介词/多重修饰的——副词 DEEPLY 后置、
    # IN + 地点、AND 连接的两个定语，任何一条通用倒装规则都会被它们绕晕，只能逐条定死。
    # ⚠️ 值要是**直译**（忠于英文），不是通俗别名；「举双手」「前台」那种短名走人工主名。
    'PERSON BOWING DEEPLY': '深深鞠躬的人',
    'PERSON RAISING BOTH HANDS IN CELEBRATION': '举起双手庆祝的人',
    'PERSON FROWNING': '皱眉的人',
    'PERSON DOING CARTWHEEL': '做侧手翻的人',
    'PERSON IN STEAMY ROOM': '桑拿房里的人',
    'PERSON WITH FOLDED HANDS': '双手合十的人',
    'PERSON WITH BLOND HAIR': '金发的人',
    'PERSON WITH POUTING FACE': '撅嘴的人',
    'PERSON WITH HEADSCARF': '戴头巾的人',
    'PERSON WITH CROWN': '戴王冠的人',
    'HAPPY PERSON RAISING ONE HAND': '举起一只手的人',
    'INFORMATION DESK PERSON': '服务台人员',
    # ============ WITH 族：逐词拼读不通的（2026-09-16）============
    # 通用规则把 WITH 译成「带X的Y」，语序对，但这两类读不通：
    #   · 词义错/不地道：exploding head 不是爆炸头、bags under eyes 是眼袋、
    #     no good gesture 是摆手拒绝、GUA PI MAO 是拼音词（逐字译成「瓜皮帽便帽毛式」）
    #   · 专名没走专名：HEARING AID 是助听器不是「听力辅助」、MEDICAL MASK 是医用口罩、
    #     WHITE CROSS 是白十字
    # ⚠️ WHITE 在这份语料里**默认译「空心」**（Unicode 排版术语，WHITE SQUARE 空心方形，
    #    与 BLACK 实心配对），⛑ 是**唯一**用成颜色词的例外，所以只有它单列。
    # ⚠️ 这里只放**直译**。更好听的通名走人工主名/别名：
    #    🖖 瓦肯举手礼、🔂 重复一次按钮、🔝 置顶 都已挂在富化的 alias 上，别搬来当直译。
    'MAN WITH GUA PI MAO': '戴瓜皮帽的男人',
    'SHOCKED FACE WITH EXPLODING HEAD': '震惊到脑袋爆炸的脸',
    'FACE WITH NO GOOD GESTURE': '摆手拒绝的脸',
    'FACE WITH BAGS UNDER EYES': '有眼袋的脸',
    'FACE WITH OPEN EYES AND HAND OVER MOUTH': '捂嘴睁眼的脸',
    'FACE WITH DIAGONAL MOUTH': '歪嘴的脸',
    'FACE WITH PEEKING EYE': '偷看的脸',
    'FACE WITH ONE EYEBROW RAISED': '挑眉的脸',
    'FACE WITH THERMOMETER': '含温度计的脸',
    'FACE WITH HEAD-BANDAGE': '缠绷带的脸',
    'FACE WITH UNEVEN EYES AND WAVY MOUTH': '头晕目眩的脸',
    'FACE WITH SPIRAL EYES': '晕头转向的脸',
    'RAISED HAND WITH FINGERS SPLAYED': '张开手指的手',
    'REVERSED HAND WITH MIDDLE FINGER EXTENDED': '竖中指的手',
    'MOBILE PHONE WITH RIGHTWARDS ARROW AT LEFT': '左侧带右箭头的手机',
    'DIAMOND SHAPE WITH A DOT INSIDE': '中间带点的菱形',
    'EAR WITH HEARING AID': '戴助听器的耳朵',
    'FACE WITH MEDICAL MASK': '戴医用口罩的脸',
    # ============ WITH 族 · 第二批（2026-09-16）============
    # OPEN CIRCLE ARROWS 的 OPEN 是「未填充」，但**这四条是 emoji**——画出来就是白箭头，
    # 所以这儿取「白」不取「空心」（口径同 WHITE HEART 白心 / WHITE FLOWER 白花）。
    # ⚠️ 只能按短语定死：通用 OPEN 在 FACE WITH OPEN MOUTH（张开嘴）里是对的。
    'OPEN CIRCLE ARROWS': '白圆圈箭头',
    # 图像里印着英文原文的按键，直译要把那个词带出来（口径同下面 🔝🔙🔚 三条）。
    # 原名「写ON! 的箭头」是手写的，既没写「上方」也没交代箭头是左右两个。
    'ON WITH EXCLAMATION MARK WITH LEFT RIGHT ARROW ABOVE': '上方带左右箭头的ON!',
    # 这几条的图像里**真的印着英文单词**，直译必须把它带出来（口径同 🔛）。
    # 逐词拼出来的是「带向上箭头上方的上」——把 TOP 译成「上」、还丢了那是箭头上的字这层信息。
    'TOP WITH UPWARDS ARROW ABOVE': '上方带向上箭头的TOP',
    'BACK WITH LEFTWARDS ARROW ABOVE': '上方带向左箭头的BACK',
    'END WITH LEFTWARDS ARROW ABOVE': '上方带向左箭头的END',
    # 9 个词，超过 MAX_PHRASE —— 已把它从 8 提到 10（见下方常量）
    'RAISED HAND WITH PART BETWEEN MIDDLE AND RING FINGERS': '中指和无名指分开的举起的手',
    # X WITH Y 里 Y 是**五官 / 肢体**时，中文说「Y的X」，不说「带Y的X」（那是「携带」的带）
    'KISSING FACE WITH CLOSED EYES': '闭眼睛的亲吻脸',
    'KISSING FACE WITH SMILING EYES': '微笑眼睛的亲吻脸',
    'KISSING CAT FACE WITH CLOSED EYES': '闭眼睛的亲吻猫脸',
    'FROWNING FACE WITH OPEN MOUTH': '张开嘴的皱眉脸',
    'FACE WITH STUCK-OUT TONGUE': '伸出舌头的脸',
    'FACE WITH STUCK-OUT TONGUE AND TIGHTLY-CLOSED EYES': '伸出舌头、紧闭眼睛的脸',
    # ⚠️ 这条是上面那条的**前缀**：不一起定死，😜 会被切成「伸出舌头的脸 + 和眨眼眼睛」
    'FACE WITH STUCK-OUT TONGUE AND WINKING EYE': '伸出舌头和眨眼眼睛的脸',
    'FACE WITH OPEN MOUTH VOMITING': '张开嘴呕吐的脸',
    'SMILING FACE WITH TEAR': '含泪的微笑脸',
    'HAND WITH INDEX AND MIDDLE FINGERS CROSSED': '食指和中指交叉的手',
    'HAND WITH INDEX FINGER AND THUMB CROSSED': '食指和拇指交叉的手',
    # 月亮 / 太阳的「带脸」→「有脸」
    'NEW MOON WITH FACE': '有脸的新月',
    'FIRST QUARTER MOON WITH FACE': '有脸的上弦月',
    'LAST QUARTER MOON WITH FACE': '有脸的下弦月',
    'FULL MOON WITH FACE': '有脸的满月',
    'SUN WITH FACE': '有脸的太阳',
    # 月相一族：原名是逐词拼的「盈新月月亮符号」「第一四分之一月亮符号」——
    # 前半截和「月亮」重复，FIRST/LAST QUARTER 也不是天文通用叫法。
    # SYMBOL 后缀是 Unicode 为了跟 🌙 那个 emoji 区分才加的，中文里 🌙 叫弯月，不冲突，可以不要。
    # ⚠️ 键必须比 'CRESCENT MOON' 长：segment 按最长匹配，短的会先把 🌒/🌘 切走。
    'NEW MOON SYMBOL': '新月',
    'WAXING CRESCENT MOON SYMBOL': '蛾眉月',
    'FIRST QUARTER MOON SYMBOL': '上弦月',
    'WAXING GIBBOUS MOON SYMBOL': '盈凸月',
    'FULL MOON SYMBOL': '满月',
    'WANING GIBBOUS MOON SYMBOL': '亏凸月',
    'LAST QUARTER MOON SYMBOL': '下弦月',
    'WANING CRESCENT MOON SYMBOL': '残月',
    # CRESCENT MOON 原来叫「新月月亮」：既重复，又把新月（🌑）的名字安到了弯月头上
    'CRESCENT MOON': '弯月',
}

# ---- 人工补充别名 ----
# 脚本产出之外的别名，按字符给。用途：同一个官方英文名有几种都说得通的中文说法时，
# 挑一个进直译名，其余在这儿补成别名（搜索结果一样命中）。
# 键是字符，值是别名列表。脚本每次重跑都会把它们补回去，不会被覆盖掉。
EXTRA_ALIASES = {
    # CROSSED SWORDS：直译取「交叉的剑」，另两种写法留作别名
    '⚔': ['剑交叉', '交叉剑'],
}

# ==================== 翻译引擎 ====================
# 表在这儿，引擎也在这儿：单码位（build_emoji_zh）和 ZWJ 序列（build_zwj）共用同一份。
# 两边词形不同、语料不同，但查表规则、短语切分、结构词处理完全一致，分成两套必然漂移。

import re

try:
    from 译名词表 import WORD as FALLBACK_WORD       # 只借 WORD，**不借 KEEP**（见本文件开头）
except ImportError:
    FALLBACK_WORD = {}

MAX_PHRASE = 10                         # 短语切分最长几个词（原 8；🖖 那条要 9 个词才切得动）

# ==================== 翻译引擎 ====================

IDEOGRAPH = re.compile(r'^IDEOGRAPH-([0-9A-F]{4,6})$')


# 短语表的**值**（切分后可能是带拉丁字母的中文，如「上方带向左箭头的BACK」）。
# 判据不能写成「不含拉丁字母就透传」——那条在 🔛 那种「值里必须保留原文单词」的短语上会崩：
# 值含 BACK/ON 就被当成未收录的英文词，掉进兜底表返回 None，整条名变空串（实测踩过）。
PHRASE_VALUES = frozenset(EMOJI_PHRASE.values())


def token_of(word):
    """单个 token → 中文；查不到返回 None。"""
    m = IDEOGRAPH.match(word)
    if m:
        return '汉字' + chr(int(m.group(1), 16))     # IDEOGRAPH-6708 → 汉字月
    if word in EMOJI_WORD:
        return EMOJI_WORD[word]
    if word in PHRASE_VALUES:
        return word                                  # 短语切分的产物，已经是中文，原样透传
    if not re.search(r'[A-Za-z]', word):
        return word                                  # 别的路径留下的中文，同样透传
    return FALLBACK_WORD.get(word)


def segment(tokens):
    """把整块短语（任意位置）先切成一个中文 token，长短语优先。

    只在**前缀位置**匹配是不够的：`HAND WITH INDEX AND MIDDLE FINGERS CROSSED`
    里的 `MIDDLE FINGER` 在中间，前缀匹配够不着，会拼成「中手指」。
    """
    out, i = [], 0
    while i < len(tokens):
        for n in range(min(MAX_PHRASE, len(tokens) - i), 0, -1):
            key = ' '.join(tokens[i:i + n])
            if key in EMOJI_PHRASE:
                out.append(EMOJI_PHRASE[key])
                i += n
                break
        else:
            out.append(tokens[i])
            i += 1
    return out


# WITH 的中文动词：「戴」还是「带」取决于宾语是不是**穿戴物**。
#   FACE WITH SUNGLASSES → 戴太阳镜的笑脸     （带太阳镜 = 把它拎在手里）
#   HEART WITH RIBBON    → 带丝带的心          （丝带是系在心上的，不是「戴」）
# 穿戴物是个**封闭类**，所以列成表；表里没有的一律「带」——宁可漏「戴」（读出「携带」味），
# 也别把「带钥匙的锁」写成「戴钥匙的锁」。
# ⚠️ 比对的是**未切分的英文宾语**（`raw`），不是切分后的中文：分块短语（COWBOY HAT）会
#    把宾语并成一个中文 token，拿中文反查既脆弱又要多维护一份反向表。
WORN_WITH = frozenset({
    'SUNGLASSES', 'GLASSES', 'EYEGLASSES', 'GOGGLES', 'MONOCLE',
    'MASK', 'MEDICAL MASK', 'CROWN', 'TURBAN', 'HEADSCARF', 'VEIL',
    'COWBOY HAT', 'HEARING AID',
})


def with_verb(raw, kw):
    """WITH 的中文动词。raw 是本层**未切分**的词列表，kw 是结构词（此处恒为 WITH）。"""
    try:
        tail = ' '.join(raw[raw.index(kw) + 1:])
    except ValueError:
        return '带'
    return '戴' if tail in WORN_WITH else '带'


def translate(tokens, unknown):
    """词列表 → 中文。

    规则顺序（越靠前越优先）：
      1. 短语切分（`segment`，任意位置、长短语优先）
      2. 结构词 WITH / AND / OF / FOR / BEHIND（取第一个）
      3. 逐词拼接，查不到的原样保留并记进 unknown
    """
    raw = list(tokens)                      # 未切分的原始词：WITH 分支判「戴/带」要用它
    tokens = segment(raw)
    if not tokens:
        return ''

    for kw in ('WITH', 'AND', 'OF', 'FOR', 'BEHIND'):
        if kw not in tokens:
            continue
        i = tokens.index(kw)
        head, tail = tokens[:i], tokens[i + 1:]
        if not head or not tail:
            continue
        a, b = translate(head, unknown), translate(tail, unknown)
        if kw == 'WITH':
            return with_verb(raw, kw) + b + '的' + a
        if kw == 'AND':
            return a + '和' + b
        if kw == 'OF':
            return b + '之' + a
        if kw == 'BEHIND':
            return b + '后的' + a
        return a + '（' + b + '）'                 # FOR：ALCHEMICAL SYMBOL FOR X → 炼金术符号（X）

    # 语序：PERSON / PEOPLE 是**中心语**，中文必须把它挪到后面
    #   KNEELING PERSON  → 下跪的人   （逐词拼是「下跪人」）
    #   PEOPLE HUGGING   → 人们拥抱   （逐词拼是「人拥抱」，读着像句子不是名字）
    # ⚠️ 必须排在上面结构词之后：`… SIGN FOR PERSON` 要留给 FOR 分支，不能被这条截走。
    # ⚠️ 只对**末词** PERSON / **首词** PEOPLE 生效，中间位置（HAPPY PERSON RAISING…、
    #    PA PEOPLE）不动——那些是另一个语序问题，见 符号/docs/设计/数据说明.md。
    if len(tokens) > 1 and tokens[-1] == 'PERSON':
        return translate(tokens[:-1], unknown) + '的人'
    if len(tokens) > 1 and tokens[0] == 'PEOPLE':
        return '人们' + translate(tokens[1:], unknown)

    out = []
    for word in tokens:
        zh = token_of(word)
        if zh is None:
            unknown.append(word)
            zh = word
        out.append(zh)
    return ''.join(out)
